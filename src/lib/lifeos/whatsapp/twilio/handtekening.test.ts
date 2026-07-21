import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { handtekeningGeldig } from './handtekening'

// De handtekening is de enige beveiliging die "van Twilio" bewijst; dus testen we
// 'm streng. We berekenen in de test zélf een geldige Twilio-handtekening (het
// gedocumenteerde schema: URL + alfabetisch gesorteerde sleutel+waarde, HMAC-SHA1,
// base64) en bewijzen dat elke afwijking → false.

const URL = 'https://mentaforce.nl/api/lifeos/whatsapp/twilio/webhook'
const TOKEN = 'test-twilio-auth-token-abcdef0123456789'

/** Bereken een geldige X-Twilio-Signature voor deze url + params. */
function teken(url: string, params: Record<string, string>, token = TOKEN): string {
  const sleutels = Object.keys(params).sort()
  let data = url
  for (const k of sleutels) data += k + params[k]
  return createHmac('sha1', token).update(data, 'utf8').digest('base64')
}

const params = {
  From: 'whatsapp:+31612345678',
  Body: 'niet vergeten de vuilnis buiten te zetten',
  MessageSid: 'SM1234567890',
  NumMedia: '0',
}

describe('handtekeningGeldig (Twilio)', () => {
  it('accepteert een correct berekende handtekening', () => {
    const sig = teken(URL, params)
    expect(handtekeningGeldig(URL, new URLSearchParams(params), sig, TOKEN)).toBe(true)
  })

  it('is bestand tegen de volgorde van de parameters (sorteert zelf)', () => {
    // Zelfde params, andere invoervolgorde in de query — moet nog steeds kloppen.
    const sig = teken(URL, params)
    const anders = new URLSearchParams()
    anders.set('NumMedia', '0')
    anders.set('Body', params.Body)
    anders.set('MessageSid', params.MessageSid)
    anders.set('From', params.From)
    expect(handtekeningGeldig(URL, anders, sig, TOKEN)).toBe(true)
  })

  it('weigert bij een verkeerde Auth Token', () => {
    const sig = teken(URL, params, 'het-verkeerde-token')
    expect(handtekeningGeldig(URL, new URLSearchParams(params), sig, TOKEN)).toBe(false)
  })

  it('weigert als een parameter is aangepast (gemanipuleerd)', () => {
    const sig = teken(URL, params)
    const gewijzigd = { ...params, Body: 'iets heel anders' }
    expect(handtekeningGeldig(URL, new URLSearchParams(gewijzigd), sig, TOKEN)).toBe(false)
  })

  it('weigert bij een andere URL dan ondertekend', () => {
    const sig = teken(URL, params)
    expect(handtekeningGeldig(`${URL}/anders`, new URLSearchParams(params), sig, TOKEN)).toBe(false)
  })

  it('weigert zonder handtekening-header of zonder token (fail-closed)', () => {
    const sig = teken(URL, params)
    expect(handtekeningGeldig(URL, new URLSearchParams(params), null, TOKEN)).toBe(false)
    expect(handtekeningGeldig(URL, new URLSearchParams(params), sig, undefined)).toBe(false)
    expect(handtekeningGeldig(URL, new URLSearchParams(params), sig, '')).toBe(false)
  })
})
