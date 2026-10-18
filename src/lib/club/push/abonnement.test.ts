import { createECDH, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { naarB64u } from './base64url'
import { isToegestaneDienst, kortToestel, leesAbonnement, leesEndpoint } from './abonnement'
import { pushBeslissing, type PushOntvanger } from './beleid'
import { STANDAARD_URL, beoordeelAntwoord, bouwVerzoek, maakInhoud, veiligeUrl } from './bericht'
import { leesVapidSleutels } from './sleutels'
import { gemeldWaarde, moetStilMelden, pushStand, sleutelNaarBytes, type PushToestel } from './toestel'
import { pushSessieMerk } from './sessie-merk'
import { DEMO_SPORTSCHOOL_ID } from '@/lib/club/meldingen/beleid'

const ua = createECDH('prime256v1')
ua.generateKeys()
const KEYS = { p256dh: naarB64u(ua.getPublicKey()), auth: naarB64u(randomBytes(16)) }

describe('isToegestaneDienst', () => {
  it('laat alleen https-adressen van bekende push-diensten toe', () => {
    expect(isToegestaneDienst('https://fcm.googleapis.com/fcm/send/abc')).toBe(true)
    expect(isToegestaneDienst('https://updates.push.services.mozilla.com/wpush/v2/abc')).toBe(true)
    expect(isToegestaneDienst('https://web.push.apple.com/QGx')).toBe(true)
    expect(isToegestaneDienst('https://wns2-db5p.notify.windows.com/w/?token=x')).toBe(true)
  })

  it('weigert al het andere (SSRF)', () => {
    for (const url of [
      'http://fcm.googleapis.com/fcm/send/abc',
      'https://fcm.googleapis.com:8443/x',
      'https://user:pw@fcm.googleapis.com/x',
      'https://fcm.googleapis.com.evil.nl/x',
      'https://evilnotify.windows.com/x',
      'https://a.b.notify.windows.com/x',
      'https://127.0.0.1/x',
      'https://localhost/x',
      'https://169.254.169.254/latest',
      'niet-een-url',
      `https://fcm.googleapis.com/${'a'.repeat(1000)}`,
    ]) {
      expect(isToegestaneDienst(url)).toBe(false)
    }
  })
})

describe('leesAbonnement', () => {
  it('leest PushSubscription.toJSON()', () => {
    const uit = leesAbonnement({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', expirationTime: null, keys: KEYS })
    expect(uit).toEqual({ ok: true, waarde: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', ...KEYS } })
  })

  it('weigert foute sleutels, een vreemd endpoint en rommel', () => {
    expect(leesAbonnement(null).ok).toBe(false)
    expect(leesAbonnement({ endpoint: 'https://example.com/x', keys: KEYS }).ok).toBe(false)
    expect(leesAbonnement({ endpoint: 'https://fcm.googleapis.com/x', keys: { ...KEYS, auth: 'kort' } }).ok).toBe(false)
    expect(leesAbonnement({ endpoint: 'https://fcm.googleapis.com/x', keys: { ...KEYS, p256dh: naarB64u(Buffer.alloc(65, 2)) } }).ok).toBe(false)
    expect(leesAbonnement({ endpoint: 'https://fcm.googleapis.com/x' }).ok).toBe(false)
  })

  it('leest alleen een toegestaan endpoint om af te melden', () => {
    expect(leesEndpoint({ endpoint: 'https://web.push.apple.com/x' })).toBe('https://web.push.apple.com/x')
    expect(leesEndpoint({ endpoint: 'https://example.com/x' })).toBeNull()
    expect(leesEndpoint('x')).toBeNull()
  })
})

describe('kortToestel', () => {
  it('geeft alleen browser en systeem', () => {
    expect(kortToestel('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36')).toBe('Chrome op Android')
    expect(kortToestel('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile/15E148 Safari/604.1')).toBe('Safari op iPhone')
    expect(kortToestel(null)).toBeNull()
  })
})

describe('bericht', () => {
  it('houdt de link binnen /mijn en kort de tekst in', () => {
    expect(veiligeUrl('/mijn?tab=lessen')).toBe('/mijn?tab=lessen')
    expect(veiligeUrl('https://evil.nl')).toBe(STANDAARD_URL)
    expect(veiligeUrl('//evil.nl/mijn')).toBe(STANDAARD_URL)
    const i = maakInhoud({ id: 'm1', onderwerp: 'Reservering bevestigd', inhoud: 'x '.repeat(400) })
    expect(i.tekst.length).toBeLessThanOrEqual(240)
    expect(i.tag).toBe('club-m1')
  })

  it('bouwt een versleuteld verzoek met VAPID, TTL en aes128gcm', () => {
    const vapid = createECDH('prime256v1')
    vapid.generateKeys()
    const s = leesVapidSleutels({ CLUB_VAPID_PUBLIC_KEY: naarB64u(vapid.getPublicKey()), CLUB_VAPID_PRIVATE_KEY: naarB64u(vapid.getPrivateKey()), CLUB_VAPID_SUBJECT: 'mailto:a@b.nl' })
    if (!s) throw new Error('sleutels')
    const v = bouwVerzoek({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', ...KEYS }, maakInhoud({ id: 'm1', onderwerp: 'Les', inhoud: 'Tekst' }), s, new Date())
    expect(v.url).toBe('https://fcm.googleapis.com/fcm/send/abc')
    expect(v.headers['Content-Encoding']).toBe('aes128gcm')
    expect(v.headers.TTL).toMatch(/^\d+$/)
    expect(v.headers.Authorization).toMatch(/^vapid t=/)
    expect(v.body.length).toBeGreaterThan(86 + 16)
  })

  it('verwijdert het abonnement bij 404 en 410, probeert later bij 429 en 5xx', () => {
    expect(beoordeelAntwoord(201)).toBe('ok')
    expect(beoordeelAntwoord(404)).toBe('weg')
    expect(beoordeelAntwoord(410)).toBe('weg')
    expect(beoordeelAntwoord(429)).toBe('opnieuw')
    expect(beoordeelAntwoord(503)).toBe('opnieuw')
    expect(beoordeelAntwoord(400)).toBe('fout')
  })
})

describe('pushBeslissing', () => {
  const basis: PushOntvanger = { organisatieId: 'org', organisatieDemo: false, lidDemo: false, rijDemo: false, push: null, abonnementen: 1 }
  const aan = { actief: true, ingesteld: true }

  it('stuurt alleen met schakelaar, sleutels, abonnement en zonder demo', () => {
    expect(pushBeslissing(basis, aan)).toEqual({ ok: true })
    expect(pushBeslissing(basis, { ...aan, actief: false }).ok).toBe(false)
    expect(pushBeslissing(basis, { ...aan, ingesteld: false }).ok).toBe(false)
    expect(pushBeslissing({ ...basis, organisatieDemo: true }, aan).ok).toBe(false)
    expect(pushBeslissing({ ...basis, organisatieId: DEMO_SPORTSCHOOL_ID }, aan).ok).toBe(false)
    expect(pushBeslissing({ ...basis, lidDemo: true }, aan).ok).toBe(false)
    expect(pushBeslissing({ ...basis, rijDemo: true }, aan).ok).toBe(false)
    expect(pushBeslissing({ ...basis, push: false }, aan).ok).toBe(false)
    expect(pushBeslissing({ ...basis, abonnementen: 0 }, aan).ok).toBe(false)
  })
})

describe('pushStand', () => {
  const kan: PushToestel = { heeftServiceWorker: true, heeftPushManager: true, heeftNotification: true, ios: false, standalone: false, toestemming: 'default' }

  it('legt op iPhone uit dat het alleen vanaf het beginscherm werkt', () => {
    expect(pushStand({ ...kan, ios: true })).toBe('ios-beginscherm')
    expect(pushStand({ ...kan, ios: true, standalone: true })).toBe('kan')
    expect(pushStand({ ...kan, ios: true, standalone: true, heeftPushManager: false })).toBe('ios-beginscherm')
  })

  it('herkent geweigerde toestemming en browsers zonder push', () => {
    expect(pushStand(kan)).toBe('kan')
    expect(pushStand({ ...kan, toestemming: 'denied' })).toBe('geweigerd')
    expect(pushStand({ ...kan, heeftPushManager: false })).toBe('geen-ondersteuning')
  })

  it('zet de publieke sleutel om naar bytes voor de browser', () => {
    expect(Buffer.from(sleutelNaarBytes(KEYS.p256dh)).equals(ua.getPublicKey())).toBe(true)
  })
})

describe('stil melden bij het openen van de app', () => {
  const ep = 'https://fcm.googleapis.com/fcm/send/abc'
  it('meldt alleen als deze sessie en dit abonnement nog niet gemeld zijn', () => {
    expect(moetStilMelden(null, 'merk1', ep)).toBe(true)
    expect(moetStilMelden(gemeldWaarde('merk1', ep), 'merk1', ep)).toBe(false)
    expect(moetStilMelden(gemeldWaarde('merk1', ep), 'merk2', ep)).toBe(true)
    expect(moetStilMelden(gemeldWaarde('merk1', ep), 'merk1', `${ep}2`)).toBe(true)
  })
  it('zonder sessiemerkje (voorvertoning) nooit stil melden', () => {
    expect(moetStilMelden(null, null, ep)).toBe(false)
  })
  it('het sessiemerkje is kort, vast per sessie en verraadt de sessiehash niet', () => {
    expect(pushSessieMerk(null)).toBeNull()
    const a = pushSessieMerk('hash-a')
    expect(a).toHaveLength(16)
    expect(pushSessieMerk('hash-a')).toBe(a)
    expect(pushSessieMerk('hash-b')).not.toBe(a)
    expect(a).not.toContain('hash')
  })
})
