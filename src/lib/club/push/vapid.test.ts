import { createECDH, verify } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { naarB64u } from './base64url'
import { leesVapidSleutels, publiekeSleutelVoorApp, pushActief } from './sleutels'
import { GELDIG_SEC, publiekeSleutelObject, vapidJwt, vapidKop } from './vapid'

function nieuwPaar(): { publiek: string; prive: string } {
  const ecdh = createECDH('prime256v1')
  ecdh.generateKeys()
  return { publiek: naarB64u(ecdh.getPublicKey()), prive: naarB64u(ecdh.getPrivateKey()) }
}

const paar = nieuwPaar()
const ENV = { CLUB_VAPID_PUBLIC_KEY: paar.publiek, CLUB_VAPID_PRIVATE_KEY: paar.prive, CLUB_VAPID_SUBJECT: 'mailto:club@example.nl' }
const NU = new Date('2026-10-18T10:00:00.000Z')
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123'

describe('VAPID (RFC 8292)', () => {
  it('maakt een ES256-JWT met aud, exp en sub die met de publieke sleutel klopt', () => {
    const s = leesVapidSleutels(ENV)
    expect(s).not.toBeNull()
    if (!s) return
    const jwt = vapidJwt(ENDPOINT, s, NU)
    const [kopDeel, claimsDeel, handtekening] = jwt.split('.')
    expect(JSON.parse(Buffer.from(kopDeel, 'base64url').toString())).toEqual({ typ: 'JWT', alg: 'ES256' })
    expect(JSON.parse(Buffer.from(claimsDeel, 'base64url').toString())).toEqual({
      aud: 'https://fcm.googleapis.com',
      exp: Math.floor(NU.getTime() / 1000) + GELDIG_SEC,
      sub: 'mailto:club@example.nl',
    })
    expect(GELDIG_SEC).toBeLessThanOrEqual(24 * 3600)
    const sig = Buffer.from(handtekening, 'base64url')
    expect(sig.length).toBe(64)
    const klopt = verify('sha256', Buffer.from(`${kopDeel}.${claimsDeel}`), { key: publiekeSleutelObject(s.publiek), dsaEncoding: 'ieee-p1363' }, sig)
    expect(klopt).toBe(true)
  })

  it('zet de Authorization-kop in de vorm vapid t=..., k=...', () => {
    const s = leesVapidSleutels(ENV)
    if (!s) throw new Error('sleutels')
    expect(vapidKop(ENDPOINT, s, NU)).toMatch(new RegExp(`^vapid t=[\\w-]+\\.[\\w-]+\\.[\\w-]+, k=${paar.publiek}$`))
  })
})

describe('sleutels uit de omgeving', () => {
  it('geeft null zonder of met kapotte sleutels, zonder te crashen', () => {
    expect(leesVapidSleutels({})).toBeNull()
    expect(leesVapidSleutels({ ...ENV, CLUB_VAPID_PRIVATE_KEY: 'kapot!' })).toBeNull()
    expect(leesVapidSleutels({ ...ENV, CLUB_VAPID_PUBLIC_KEY: naarB64u(Buffer.alloc(65, 1)) })).toBeNull()
    expect(leesVapidSleutels({ ...ENV, CLUB_VAPID_SUBJECT: 'iemand' })).toBeNull()
  })

  it('weigert een publieke sleutel die niet bij de prive hoort', () => {
    expect(leesVapidSleutels({ ...ENV, CLUB_VAPID_PUBLIC_KEY: nieuwPaar().publiek })).toBeNull()
  })

  it('geeft de publieke sleutel aan de app alleen met CLUB_PUSH_ACTIEF=1', () => {
    expect(pushActief(ENV)).toBe(false)
    expect(publiekeSleutelVoorApp(ENV)).toBeNull()
    expect(publiekeSleutelVoorApp({ ...ENV, CLUB_PUSH_ACTIEF: '1' })).toBe(paar.publiek)
    expect(publiekeSleutelVoorApp({ CLUB_PUSH_ACTIEF: '1' })).toBeNull()
  })
})
