import { describe, expect, it } from 'vitest'
import { controleCode, hashPin, tokenHash } from '@/lib/club/kern/pin'
import type { Beheerder } from './beheerder'
import { beheerderVanSessie, beoordeelBeheerder, haalBeheerders, kiesBeheerderPin, logInBeheerder, nieuweBeheerderCode, vindBeheerder } from './beheerder-opslag'
import { heeftFilter, nepSupabase, type Antwoord, type Vraag } from './nep-supabase'

const GYM_A = 'de000000-0000-4000-8000-0000000000c1'
const GYM_B = 'be000000-0000-4000-8000-0000000000b2'
const ID = '11111111-1111-4111-8111-111111111111'
const NU = new Date('2026-10-17T12:00:00Z')
const PIN = '482915'

const rij = (extra: Record<string, unknown> = {}) => ({
  id: ID, organisatie_id: GYM_A, naam: 'Sanne', email: null, rol: 'eigenaar', code: 'abcdefghijklmnopqrstuvwx', actief: true,
  pin_hash: null, pin_status: 'geen', mislukt: 0, geblokkeerd_tot: null, blokkades: 0, laatst_ingelogd_op: null, ...extra,
})

const beheerder = (extra: Partial<Beheerder> = {}): Beheerder => ({
  id: ID, organisatieId: GYM_A, naam: 'Sanne', email: null, rol: 'eigenaar', code: 'abcdefghijklmnopqrstuvwx', actief: true,
  pinStatus: 'actief', pinHash: hashPin(PIN), mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null, ...extra,
})

const ok = (data: unknown): Antwoord => ({ data, error: null })
const eenRij: Antwoord = ok([{ id: ID }])

describe('vindBeheerder', () => {
  it('een ongeldige code vraagt de database niet eens', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await vindBeheerder(admin, '../etc')).toBeNull()
    expect(vragen).toHaveLength(0)
  })
  it('een gestopte beheerder telt niet', async () => {
    const { admin } = nepSupabase(() => ok(rij({ actief: false })))
    expect(await vindBeheerder(admin, 'abcdefghijklmnopqrstuvwx')).toBeNull()
  })
})

describe('kiesBeheerderPin', () => {
  it('alleen als er nog geen pin is, en geeft een controlecode', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    const uit = await kiesBeheerderPin(admin, beheerder({ pinStatus: 'geen', pinHash: null }), PIN, NU)
    expect(uit.staat).toBe('ok')
    expect(heeftFilter(vragen[0], 'pin_status', 'geen')).toBe(true)
    expect((vragen[0].waarde as Record<string, unknown>).pin_status).toBe('wacht')
    expect(await kiesBeheerderPin(admin, beheerder({ pinStatus: 'wacht' }), PIN, NU)).toEqual({ staat: 'al_gekozen' })
  })
})

describe('logInBeheerder', () => {
  it('goede pin: een sessie, alleen de hash in de database', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok([]) : eenRij))
    const uit = await logInBeheerder(admin, beheerder(), PIN, NU)
    expect(uit.staat).toBe('ok')
    if (uit.staat !== 'ok') return
    const insert = vragen.find((v) => v.tabel === 'club_beheerder_sessies' && v.actie === 'insert')
    expect((insert?.waarde as Record<string, unknown>).token_hash).toBe(tokenHash(uit.token))
    expect(JSON.stringify(insert?.waarde)).not.toContain(uit.token)
  })
  it('foute pin: telt af, en de vijfde fout blokkeert', async () => {
    const { admin } = nepSupabase(() => eenRij)
    expect(await logInBeheerder(admin, beheerder(), '000000', NU)).toEqual({ staat: 'fout', over: 4 })
    const vijfde = await logInBeheerder(admin, beheerder({ mislukt: 4 }), '000000', NU)
    expect(vijfde.staat).toBe('geblokkeerd')
  })
  it('poging niet gereserveerd (parallel verzoek): geen pincheck, geen sessie', async () => {
    const { admin, vragen } = nepSupabase(() => ok([]))
    expect((await logInBeheerder(admin, beheerder(), PIN, NU)).staat).toBe('fout')
    expect(vragen.some((v) => v.tabel === 'club_beheerder_sessies')).toBe(false)
  })
  it('geblokkeerd, dicht of niet goedgekeurd: de database wordt niet aangeraakt', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect((await logInBeheerder(admin, beheerder({ geblokkeerdTot: '2026-10-17T13:00:00Z' }), PIN, NU)).staat).toBe('geblokkeerd')
    expect((await logInBeheerder(admin, beheerder({ blokkades: 6 }), PIN, NU)).staat).toBe('gesloten')
    expect((await logInBeheerder(admin, beheerder({ pinStatus: 'wacht' }), PIN, NU)).staat).toBe('niet_actief')
    expect(vragen).toHaveLength(0)
  })
})

describe('beheerderVanSessie', () => {
  const sessie = { beheerder_id: ID, verloopt_op: '2026-11-01T00:00:00Z', laatst_gebruikt_op: '2026-10-17T11:30:00Z', aangemaakt_op: '2026-10-10T00:00:00Z' }
  const db = (b: unknown) => (v: Vraag) => (v.tabel === 'club_beheerder_sessies' ? ok(sessie) : ok(b))
  it('geldige sessie en actieve beheerder', async () => {
    const { admin } = nepSupabase(db(rij({ pin_status: 'actief' })))
    expect((await beheerderVanSessie(admin, 'token', NU))?.organisatieId).toBe(GYM_A)
  })
  it('gestopt of pin gereset: geen toegang meer', async () => {
    expect(await beheerderVanSessie(nepSupabase(db(rij({ pin_status: 'actief', actief: false }))).admin, 'token', NU)).toBeNull()
    expect(await beheerderVanSessie(nepSupabase(db(rij({ pin_status: 'geen' }))).admin, 'token', NU)).toBeNull()
  })
  it('geen of een te lang token: null zonder database', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await beheerderVanSessie(admin, undefined, NU)).toBeNull()
    expect(await beheerderVanSessie(admin, 'x'.repeat(101), NU)).toBeNull()
    expect(vragen).toHaveLength(0)
  })
})

describe('beheer door Kane blijft binnen de sportschool', () => {
  it('lijst filtert op de organisatie en geeft nooit de pin-hash of controlecode', async () => {
    const hash = hashPin(PIN)
    const { admin, vragen } = nepSupabase(() => ok([rij({ pin_status: 'wacht', pin_hash: hash })]))
    const lijst = await haalBeheerders(admin, GYM_A)
    expect(heeftFilter(vragen[0], 'organisatie_id', GYM_A)).toBe(true)
    expect(JSON.stringify(lijst)).not.toContain(hash)
    expect(JSON.stringify(lijst)).not.toContain(controleCode(hash))
    expect(lijst?.[0]).not.toHaveProperty('pinHash')
  })
  it('elke actie filtert op id EN organisatie; een beheerder van een andere sportschool: niet gevonden', async () => {
    const { admin, vragen } = nepSupabase((v) => (heeftFilter(v, 'organisatie_id', GYM_B) ? ok([]) : eenRij))
    expect(await beoordeelBeheerder(admin, GYM_B, ID, { actie: 'stoppen', controle: null })).toBe('niet_gevonden')
    expect(heeftFilter(vragen[0], 'id', ID)).toBe(true)
    expect(vragen.some((v) => v.tabel === 'club_beheerder_sessies')).toBe(false)
  })
  it('stoppen, resetten en afwijzen loggen alle toestellen uit', async () => {
    for (const actie of ['stoppen', 'reset', 'afwijzen'] as const) {
      const { admin, vragen } = nepSupabase(() => eenRij)
      expect(await beoordeelBeheerder(admin, GYM_A, ID, { actie, controle: null })).toBe('ok')
      expect(vragen.some((v) => v.tabel === 'club_beheerder_sessies' && v.actie === 'delete' && heeftFilter(v, 'beheerder_id', ID))).toBe(true)
    }
  })
  it('goedkeuren alleen met de juiste controlecode, gebonden aan die ene pin', async () => {
    const hash = hashPin(PIN)
    const db = (v: Vraag) => (v.actie === 'select' ? ok({ pin_hash: hash }) : eenRij)
    const fout = nepSupabase(db)
    const andere = controleCode(hash) === '0000' ? '0001' : '0000'
    expect(await beoordeelBeheerder(fout.admin, GYM_A, ID, { actie: 'goedkeuren', controle: andere })).toBe('controle_fout')
    expect(fout.vragen.some((v) => v.actie === 'update')).toBe(false)
    const goed = nepSupabase(db)
    expect(await beoordeelBeheerder(goed.admin, GYM_A, ID, { actie: 'goedkeuren', controle: controleCode(hash) })).toBe('ok')
    const update = goed.vragen.find((v) => v.actie === 'update')
    expect(update && heeftFilter(update, 'pin_hash', hash) && heeftFilter(update, 'organisatie_id', GYM_A)).toBe(true)
    expect(goed.vragen.some((v) => v.tabel === 'club_beheerder_sessies')).toBe(false)
  })
})

describe('nieuweBeheerderCode', () => {
  it('24 tekens en elke keer anders', () => {
    const a = nieuweBeheerderCode()
    expect(a).toMatch(/^[A-Za-z0-9_-]{24}$/)
    expect(nieuweBeheerderCode()).not.toBe(a)
  })
})
