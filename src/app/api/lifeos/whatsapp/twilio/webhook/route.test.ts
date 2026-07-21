import { describe, it, expect, afterEach, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { NextRequest } from 'next/server'
import { POST, verwerkBericht, type VerwerkDeps } from './route'
import type { TwilioBericht } from '@/lib/lifeos/whatsapp/twilio/update'
import type { AudioBestand } from '@/lib/lifeos/telegram/transcribe'
import type { UitvoerDeps } from '@/lib/lifeos/telegram/uitvoeren'

// ─── Handtekening + allowlist zijn de ENIGE beveiliging van deze publieke route ─
// Een fout/ontbrekende Twilio-handtekening mag nooit voorbij 403; een nummer
// buiten de allowlist mag NIETS uitvoeren. Dat de allowlist-tests slagen zónder
// TWILIO_ACCOUNT_SID / ANTHROPIC_API_KEY / LifeOS-env is het bewijs: kwam de gate
// ooit voorbij, dan zou `maakTwilioClient()`/`maakAnthropicModel()` gooien.

const TOKEN = 'test-twilio-auth-token-0123456789'
const APP = 'https://mentaforce.test'
const URL = `${APP}/api/lifeos/whatsapp/twilio/webhook`

const oud = {
  token: process.env.TWILIO_AUTH_TOKEN,
  app: process.env.APP_URL,
  allow: process.env.LIFEOS_WHATSAPP_ALLOWED_FROM,
}
afterEach(() => {
  for (const [k, v] of [
    ['TWILIO_AUTH_TOKEN', oud.token],
    ['APP_URL', oud.app],
    ['LIFEOS_WHATSAPP_ALLOWED_FROM', oud.allow],
  ] as const) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
})

/** Bereken een geldige X-Twilio-Signature (URL + gesorteerde sleutel+waarde). */
function teken(params: Record<string, string>, token = TOKEN): string {
  const sleutels = Object.keys(params).sort()
  let data = URL
  for (const k of sleutels) data += k + params[k]
  return createHmac('sha1', token).update(data, 'utf8').digest('base64')
}

function post(params: Record<string, string>, sig?: string): NextRequest {
  const body = new URLSearchParams(params).toString()
  return new NextRequest(URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'x-twilio-signature': sig ?? teken(params),
    },
    body,
  })
}

const tekstParams = { From: 'whatsapp:+31699999999', Body: 'maak een taak', MessageSid: 'SM1', NumMedia: '0' }

describe('POST /api/lifeos/whatsapp/twilio/webhook — handtekening', () => {
  it('wijst af (403) zonder Auth Token geconfigureerd', async () => {
    delete process.env.TWILIO_AUTH_TOKEN
    process.env.APP_URL = APP
    const res = await POST(post(tekstParams))
    expect(res.status).toBe(403)
  })

  it('wijst af (403) bij een verkeerde handtekening', async () => {
    process.env.TWILIO_AUTH_TOKEN = TOKEN
    process.env.APP_URL = APP
    const res = await POST(post(tekstParams, teken(tekstParams, 'verkeerd-token')))
    expect(res.status).toBe(403)
  })
})

describe('POST /api/lifeos/whatsapp/twilio/webhook — allowlist (fail-closed)', () => {
  it('antwoordt met leeg TwiML (200) als het nummer niet op de allowlist staat', async () => {
    process.env.TWILIO_AUTH_TOKEN = TOKEN
    process.env.APP_URL = APP
    process.env.LIFEOS_WHATSAPP_ALLOWED_FROM = '31600000000'
    const res = await POST(post(tekstParams))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/xml')
    await expect(res.text()).resolves.toContain('<Response></Response>')
  })

  it('verwerkt NIETS als de allowlist ontbreekt — fail-closed', async () => {
    process.env.TWILIO_AUTH_TOKEN = TOKEN
    process.env.APP_URL = APP
    delete process.env.LIFEOS_WHATSAPP_ALLOWED_FROM
    const res = await POST(post({ ...tekstParams, Body: 'zet morgen 9 uur een afspraak' }))
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toContain('<Response></Response>')
  })

  it('antwoordt met leeg TwiML als er geen bruikbaar bericht is', async () => {
    process.env.TWILIO_AUTH_TOKEN = TOKEN
    process.env.APP_URL = APP
    const leeg = { From: 'whatsapp:+31699999999', MessageSid: 'SM2', NumMedia: '0' } // geen Body
    const res = await POST(post(leeg))
    expect(res.status).toBe(200)
    await expect(res.text()).resolves.toContain('<Response></Response>')
  })
})

// ─── De compositie: verwerkBericht (met nep-injecties, geen netwerk) ─────────

function nepClient() {
  const media: string[] = []
  return {
    media,
    async haalMedia(mediaUrl: string): Promise<AudioBestand> {
      media.push(mediaUrl)
      return { data: new ArrayBuffer(8), bestandsnaam: 'spraak.ogg', mimeType: 'audio/ogg' }
    },
  }
}

function nepOpslag() {
  const taken: unknown[] = []
  const deps: UitvoerDeps = {
    maakTaak: async (_u, nieuw) => {
      taken.push(nieuw)
      return { ok: true }
    },
    maakNotitie: async () => ({ ok: true }),
    maakAgenda: async () => ({ ok: true }),
  }
  return { deps, taken }
}

function nepModel(soort: string, titel: string) {
  return {
    classificeer: async () => ({
      soort,
      titel,
      wanneer: null,
      categorie: 'onbekend',
      vertrouwen: 0.9,
      toelichting: 'test',
    }),
  }
}

const nepTranscriber = { transcribeer: vi.fn(async () => 'niet vergeten de vuilnis buiten te zetten') }

function deps(over: Partial<VerwerkDeps> = {}): VerwerkDeps {
  return {
    userId: 'user-1',
    client: nepClient(),
    transcriber: nepTranscriber,
    model: nepModel('taak', 'Vuilnis buiten zetten'),
    nu: new Date('2026-07-21T10:00:00Z'),
    opslag: nepOpslag().deps,
    ...over,
  }
}

function bericht(over: Partial<TwilioBericht> = {}): TwilioBericht {
  return { soort: 'tekst', from: 'whatsapp:+31612345678', tekst: 'vuilnis buiten zetten', ...over } as TwilioBericht
}

describe('verwerkBericht (Twilio)', () => {
  it('maakt van een tekstbericht een taak en geeft de bevestiging terug', async () => {
    const opslag = nepOpslag()
    const antwoord = await verwerkBericht(bericht(), deps({ opslag: opslag.deps }))
    expect(opslag.taken).toHaveLength(1)
    expect(antwoord).toContain('Vuilnis buiten zetten')
  })

  it('transcribeert een spraakmemo eerst en verwerkt die tekst', async () => {
    const client = nepClient()
    nepTranscriber.transcribeer.mockClear()
    const antwoord = await verwerkBericht(
      bericht({ soort: 'spraak', mediaUrl: 'https://api.twilio.com/media/xyz', mediaType: 'audio/ogg', tekst: undefined } as unknown as Partial<TwilioBericht>),
      deps({ client }),
    )
    expect(client.media).toEqual(['https://api.twilio.com/media/xyz'])
    expect(nepTranscriber.transcribeer).toHaveBeenCalledOnce()
    expect(antwoord.length).toBeGreaterThan(0)
  })

  it('meldt bij een genegeerd type dat alleen tekst/spraak werkt — zonder te verwerken', async () => {
    const opslag = nepOpslag()
    const antwoord = await verwerkBericht(
      bericht({ soort: 'genegeerd', tekst: undefined } as unknown as Partial<TwilioBericht>),
      deps({ opslag: opslag.deps }),
    )
    expect(opslag.taken).toHaveLength(0)
    expect(antwoord).toContain('tekstberichten en spraakmemo')
  })
})
