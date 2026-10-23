import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { bronnenWissenBijOntkoppelen, PROVIDERS, providerKaarten, providerStatus } from './providers'
import { healthHoofdsleutel, healthKlaar } from './schakelaar'
import { filterVoorTrainer, GEEN_TOESTEMMING, leesKeuze, magTrainerZien, toestemmingUitRij, TOESTEMMING_VERSIE, type Toestemming } from './toestemming'
import { laatstePerSoort, leesNativeBody, schoneMeting, schoneMetingen, waardeTekst } from './metingen'
import { ontsleutelTokens, versleutelTokens } from './versleutelen'
import { codeChallenge, controleerCallback, koppelCookieWaarde, leesState, maakState } from './oauth'
import type { Meting } from './typen'

const SLEUTEL_HEX = 'a'.repeat(64)
const SLEUTEL = Buffer.from(SLEUTEL_HEX, 'hex')
const NU = new Date('2026-10-23T12:00:00Z')
const AAN = { CLUB_HEALTH_ACTIEF: '1', CLUB_HEALTH_SLEUTEL: SLEUTEL_HEX }

function meting(m: Partial<Meting>): Meting {
  return { soort: 'gewicht_kg', waarde: 80, training: null, bron: 'withings', externId: 'x', gemetenOp: '2026-10-22T08:00:00Z', ...m }
}

describe('schakelaar en sleutel', () => {
  it('staat standaard uit', () => {
    expect(healthKlaar({})).toBe(false)
    expect(healthKlaar({ CLUB_HEALTH_ACTIEF: '1' })).toBe(false)
    expect(healthKlaar(AAN)).toBe(true)
  })

  it('accepteert 32 bytes als hex of base64 en weigert de rest', () => {
    expect(healthHoofdsleutel({ CLUB_HEALTH_SLEUTEL: SLEUTEL.toString('base64') })?.equals(SLEUTEL)).toBe(true)
    expect(healthHoofdsleutel({ CLUB_HEALTH_SLEUTEL: 'kort' })).toBeNull()
  })
})

describe('providers', () => {
  it('toont alles als Binnenkort zonder schakelaar, sleutel of client id', () => {
    expect(providerKaarten({}).every((k) => k.status === 'binnenkort')).toBe(true)
    expect(providerStatus(PROVIDERS.withings, AAN)).toBe('binnenkort')
    expect(providerStatus(PROVIDERS.withings, { ...AAN, CLUB_HEALTH_WITHINGS_CLIENT_ID: 'id' })).toBe('binnenkort')
  })

  it('is te koppelen met de schakelaar, de sleutel en beide sleutels van de leverancier', () => {
    expect(providerStatus(PROVIDERS.withings, { ...AAN, CLUB_HEALTH_WITHINGS_CLIENT_ID: 'id', CLUB_HEALTH_WITHINGS_SECRET: 's' })).toBe('beschikbaar')
    expect(providerStatus(PROVIDERS.apple_health, AAN)).toBe('alleen_app')
  })

  it('houdt bronnen die eerst goedkeuring nodig hebben altijd op Binnenkort', () => {
    for (const id of ['garmin', 'google_health', 'suunto', 'wahoo', 'samsung', 'huawei'] as const) {
      expect(PROVIDERS[id].goedkeuringNodig).toBe(true)
      expect(providerStatus(PROVIDERS[id], { ...AAN, [`CLUB_HEALTH_${id.toUpperCase()}_CLIENT_ID`]: 'x' })).toBe('binnenkort')
    }
  })

  it('Strava: alleen trainingen, trainers apart, wissen bij ontkoppelen', () => {
    expect(PROVIDERS.strava.soorten).toEqual(['training'])
    expect(PROVIDERS.strava.regels).toMatchObject({ trainer: 'apart', wissenBijOntkoppelen: true, geenAi: true })
    expect(PROVIDERS.oura.regels.wissenBinnenUur).toBe(72)
  })

  it('elke bron die bij ontkoppelen gewist moet worden staat in de nachtelijke ronde van migratie 463', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase', 'lifeos-migrations', '463_club_health.sql'), 'utf8')
    const lijst = /where m\.bron in \(([^)]*)\)/.exec(sql)?.[1] ?? ''
    for (const bron of bronnenWissenBijOntkoppelen()) expect(lijst).toContain(`'${bron}'`)
  })

  it('kent geen bron in de app die de database weigert', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase', 'lifeos-migrations', '463_club_health.sql'), 'utf8')
    for (const id of Object.keys(PROVIDERS)) expect(sql).toContain(`'${id}'`)
  })
})

describe('toestemming', () => {
  const t: Toestemming = { ...GEEN_TOESTEMMING, delen: ['gewicht_kg', 'training'], trainerZien: ['gewicht_kg', 'training'], gegevenOp: NU.toISOString() }

  it('vraagt akkoord en de juiste versie', () => {
    expect(leesKeuze({ delen: ['stappen'] }).ok).toBe(false)
    expect(leesKeuze({ akkoord: true, versie: 'oud', delen: ['stappen'] }).ok).toBe(false)
  })

  it('perkt trainerZien in tot delen en trainerBronnen tot bronnen met een eigen schakelaar', () => {
    const k = leesKeuze({ akkoord: true, versie: TOESTEMMING_VERSIE, delen: ['stappen', 'onzin'], trainerZien: ['stappen', 'gewicht_kg'], trainerBronnen: ['strava', 'withings'] })
    expect(k).toEqual({ ok: true, delen: ['stappen'], trainerZien: ['stappen'], trainerBronnen: ['strava'] })
  })

  it('laat trainers Strava-trainingen alleen zien met de aparte schakelaar', () => {
    expect(magTrainerZien(t, 'training', 'strava')).toBe(false)
    expect(magTrainerZien(t, 'training', 'polar')).toBe(true)
    expect(magTrainerZien({ ...t, trainerBronnen: ['strava'] }, 'training', 'strava')).toBe(true)
  })

  it('filtert voor trainers op soort en bron', () => {
    const lijst = [meting({ soort: 'gewicht_kg' }), meting({ soort: 'stappen' }), meting({ soort: 'training', bron: 'strava' })]
    expect(filterVoorTrainer(lijst, t).map((m) => m.soort)).toEqual(['gewicht_kg'])
  })

  it('telt een oude tekstversie en ingetrokken toestemming niet', () => {
    expect(toestemmingUitRij({ tekst_versie: 'oud', delen: ['stappen'] }).delen).toEqual([])
    const ingetrokken = toestemmingUitRij({ tekst_versie: TOESTEMMING_VERSIE, delen: ['stappen'], trainer_zien: ['stappen'], ingetrokken_op: NU.toISOString() })
    expect(magTrainerZien(ingetrokken, 'stappen', 'withings')).toBe(false)
  })
})

describe('metingen', () => {
  it('weigert onzinwaarden, toekomst en te oud', () => {
    expect(schoneMeting(meting({ waarde: 900 }), NU)).toBeNull()
    expect(schoneMeting(meting({ gemetenOp: '2026-10-24T12:00:00Z' }), NU)).toBeNull()
    expect(schoneMeting(meting({ gemetenOp: '2024-01-01T00:00:00Z' }), NU)).toBeNull()
    expect(schoneMeting(meting({ waarde: 82.456 }), NU)?.waarde).toBe(82.5)
  })

  it('houdt een training met redelijke waarden en laat onzin weg', () => {
    const t = schoneMeting(meting({ soort: 'training', waarde: 0, training: { soort: 'Run', duurSec: 1800, kcal: -5, gemHartslag: 400 } }), NU)
    expect(t).toMatchObject({ waarde: 30, training: { kcal: null, gemHartslag: null } })
  })

  it('haalt dubbelen weg (laatste wint)', () => {
    expect(schoneMetingen([meting({ waarde: 80 }), meting({ waarde: 81 })], NU)).toHaveLength(1)
  })

  it('leest de body van de app en legt de bron op', () => {
    const r = leesNativeBody({ bron: 'health_connect', metingen: [{ soort: 'stappen', waarde: 5000, externId: 's', gemetenOp: NU.toISOString(), bron: 'withings' }, { soort: 'x' }] })
    expect(r.ok && r.metingen).toEqual([{ soort: 'stappen', waarde: 5000, training: null, bron: 'health_connect', externId: 's', gemetenOp: NU.toISOString() }])
    expect(leesNativeBody({ bron: 'strava', metingen: [] }).ok).toBe(false)
  })

  it('geeft de laatste per soort en een leesbare waarde', () => {
    const l = laatstePerSoort([meting({ waarde: 80, gemetenOp: '2026-10-20T08:00:00Z' }), meting({ waarde: 79, gemetenOp: '2026-10-22T08:00:00Z' })])
    expect(l).toHaveLength(1)
    expect(waardeTekst(l[0])).toBe('79 kg')
    expect(waardeTekst({ soort: 'slaap_minuten', waarde: 425, training: null })).toBe('7 u 5 min')
  })
})

describe('tokens versleutelen', () => {
  const rij = { userId: 'org', lidId: 'lid', bron: 'withings' }

  it('ontsleutelt wat het versleutelde en zet de tekst nooit leesbaar weg', () => {
    const v = versleutelTokens('{"accessToken":"geheim"}', SLEUTEL, rij)
    expect(v.startsWith('v1.')).toBe(true)
    expect(v).not.toContain('geheim')
    expect(ontsleutelTokens(v, SLEUTEL, rij)).toBe('{"accessToken":"geheim"}')
  })

  it('weigert een andere rij, een andere sleutel of een gewijzigd token', () => {
    const v = versleutelTokens('x', SLEUTEL, rij)
    expect(ontsleutelTokens(v, SLEUTEL, { ...rij, lidId: 'ander' })).toBeNull()
    expect(ontsleutelTokens(v, Buffer.alloc(32, 1), rij)).toBeNull()
    const delen = v.split('.')
    delen[2] = Buffer.from('y').toString('base64url')
    expect(ontsleutelTokens(delen.join('.'), SLEUTEL, rij)).toBeNull()
    expect(ontsleutelTokens('onzin', SLEUTEL, rij)).toBeNull()
  })
})

describe('OAuth', () => {
  it('maakt de S256-uitdaging volgens RFC 7636 bijlage B', () => {
    expect(codeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  const inhoud = { bron: 'strava' as const, userId: 'org', lidId: 'lid', nonce: 'n1', verloopt: NU.getTime() + 60_000 }

  it('leest een eigen state terug en weigert een gewijzigde of verlopen', () => {
    const s = maakState(inhoud, SLEUTEL)
    expect(leesState(s, SLEUTEL, NU)).toEqual({ ok: true, inhoud })
    expect(leesState(`${s}x`, SLEUTEL, NU).ok).toBe(false)
    expect(leesState(s, Buffer.alloc(32, 2), NU).ok).toBe(false)
    expect(leesState(s, SLEUTEL, new Date(NU.getTime() + 120_000))).toEqual({ ok: false, fout: 'verlopen' })
  })

  it('controleert bron, lid en het cookie in de callback', () => {
    const s = maakState(inhoud, SLEUTEL)
    const basis = { state: s, cookie: koppelCookieWaarde('n1', 'ver'), bron: 'strava' as const, userId: 'org', lidId: 'lid', hoofdsleutel: SLEUTEL, nu: NU }
    expect(controleerCallback(basis)).toEqual({ ok: true, verifier: 'ver' })
    expect(controleerCallback({ ...basis, bron: 'withings' })).toEqual({ ok: false, fout: 'andere_bron' })
    expect(controleerCallback({ ...basis, lidId: 'ander' })).toEqual({ ok: false, fout: 'ander_lid' })
    expect(controleerCallback({ ...basis, cookie: 'n2' })).toEqual({ ok: false, fout: 'geen_cookie' })
    expect(controleerCallback({ ...basis, cookie: undefined })).toEqual({ ok: false, fout: 'geen_cookie' })
  })
})
