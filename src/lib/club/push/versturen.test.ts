import { createECDH, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { naarB64u } from './base64url'
import { maakInhoud } from './bericht'
import { leesVapidSleutels } from './sleutels'
import { stuurNaarToestellen, type PushDeps } from './versturen'
import type { OpgeslagenAbonnement } from './opslag'
import { metPush } from '@/lib/club/meldingen/plannen'
import type { NieuweMelding } from '@/lib/club/meldingen/plannen'

function toestel(id: string, endpoint = `https://fcm.googleapis.com/fcm/send/${id}`): OpgeslagenAbonnement {
  const ecdh = createECDH('prime256v1')
  ecdh.generateKeys()
  return { id, userId: 'org', lidId: 'lid', endpoint, p256dh: naarB64u(ecdh.getPublicKey()), auth: naarB64u(randomBytes(16)) }
}

const vapid = createECDH('prime256v1')
vapid.generateKeys()
const sleutels = leesVapidSleutels({ CLUB_VAPID_PUBLIC_KEY: naarB64u(vapid.getPublicKey()), CLUB_VAPID_PRIVATE_KEY: naarB64u(vapid.getPrivateKey()), CLUB_VAPID_SUBJECT: 'mailto:a@b.nl' })
const inhoud = maakInhoud({ id: 'm1', onderwerp: 'Les', inhoud: 'Je plek is gereserveerd.' })

function deps(antwoorden: Record<string, number | null>, bezocht: string[] = []): PushDeps {
  return {
    omgeving: { actief: true, ingesteld: true },
    sleutels,
    post: async (v) => {
      bezocht.push(v.url)
      return v.url in antwoorden ? antwoorden[v.url] : 201
    },
  }
}

describe('stuurNaarToestellen', () => {
  it('telt als verstuurd zodra een toestel hem kreeg en ruimt 404/410 op', async () => {
    const a = toestel('a')
    const b = toestel('b')
    const uit = await stuurNaarToestellen([a, b], inhoud, deps({ [b.endpoint]: 410 }), new Date())
    expect(uit).toEqual({ verstuurd: true, opnieuw: false, weg: ['b'], gelukt: ['a'] })
  })

  it('probeert later opnieuw als de dienst tijdelijk niet kan', async () => {
    const a = toestel('a')
    expect(await stuurNaarToestellen([a], inhoud, deps({ [a.endpoint]: 503 }), new Date())).toMatchObject({ verstuurd: false, opnieuw: true })
    expect(await stuurNaarToestellen([a], inhoud, deps({ [a.endpoint]: null }), new Date())).toMatchObject({ verstuurd: false, opnieuw: true })
  })

  it('stuurt nooit naar een onbekend adres, ook niet als het in de database staat', async () => {
    const bezocht: string[] = []
    const uit = await stuurNaarToestellen([toestel('x', 'https://169.254.169.254/latest')], inhoud, deps({}, bezocht), new Date())
    expect(bezocht).toEqual([])
    expect(uit.verstuurd).toBe(false)
  })
})

describe('metPush', () => {
  it('maakt bij elke app-melding een geplande push met dezelfde sleutel', () => {
    const basis = { soort: 'les_geboekt', sleutel: 'les_geboekt:r1:1', onderwerp: 'O', bron_soort: 'reservering', bron_id: 'r1', bron_start: 's', gepland_op: 'g' } as const
    const rijen: NieuweMelding[] = [
      { ...basis, kanaal: 'app', inhoud: 'kort', status: 'verstuurd', verstuurd_op: 'g' },
      { ...basis, kanaal: 'email', inhoud: 'lang', status: 'gepland', verstuurd_op: null },
    ]
    const uit = metPush(rijen)
    expect(uit).toHaveLength(3)
    expect(uit[2]).toEqual({ ...basis, kanaal: 'push', inhoud: 'kort', status: 'gepland', verstuurd_op: null })
  })
})
