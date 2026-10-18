import { describe, expect, it } from 'vitest'
import { hashPin, pinKlopt, tokenHash } from '@/lib/lifeos/leads/pin'
import { heeftFilter, nepSupabase, type Antwoord } from '@/lib/club/beheerders/nep-supabase'
import type { LidToegangRij } from './regels'
import { kiesLidPin, lidVanSessie, logInLid, maakLidLink, trekLidLinkIn, vindLidToegang } from './opslag'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const ANDER = 'be000000-0000-4000-8000-0000000000b2'
const LID = '11111111-1111-4111-8111-111111111111'
const ID = '22222222-2222-4222-8222-222222222222'
const CODE = 'abcdefghijklmnopqrstuvwx'
const NU = new Date('2026-10-17T12:00:00Z')
const PIN = '482915'

const ok = (data: unknown): Antwoord => ({ data, error: null })
const eenRij = ok([{ id: ID }])

const toegang = (extra: Partial<LidToegangRij> = {}): LidToegangRij => ({
  id: ID, userId: GYM, lidId: LID, code: CODE, codeGemaaktOp: NU.toISOString(), actief: true,
  pinHash: hashPin(PIN), mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null, ...extra,
})

const rij = (extra: Record<string, unknown> = {}) => ({
  id: ID, user_id: GYM, lid_id: LID, code: CODE, code_gemaakt_op: NU.toISOString(), actief: true, pin_hash: 'x', mislukt: 0, geblokkeerd_tot: null, blokkades: 0, ...extra,
})

describe('vindLidToegang', () => {
  it('een ongeldige code vraagt de database niet', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await vindLidToegang(admin, '../../etc')).toBeNull()
    expect(vragen).toHaveLength(0)
  })
  it('ingetrokken telt als onbekend', async () => {
    const { admin } = nepSupabase(() => ok(rij({ actief: false })))
    expect(await vindLidToegang(admin, CODE)).toBeNull()
  })
})

describe('kiesLidPin', () => {
  it('alleen op een verse link zonder pincode; de pin staat alleen gehasht in de database', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok([]) : eenRij))
    const uit = await kiesLidPin(admin, toegang({ pinHash: null }), PIN, NU)
    expect(uit.staat).toBe('ok')
    const update = vragen.find((v) => v.tabel === 'club_lid_toegang' && v.actie === 'update')!
    expect(update.filters).toContainEqual(['is', 'pin_hash', null])
    expect(heeftFilter(update, 'user_id', GYM)).toBe(true)
    const opgeslagen = (update.waarde as Record<string, unknown>).pin_hash as string
    expect(opgeslagen).not.toContain(PIN)
    expect(pinKlopt(PIN, opgeslagen)).toBe(true)
    expect(JSON.stringify(vragen.map((v) => v.waarde))).not.toContain(`"${PIN}"`)
  })
  it('al een pincode: niet overschrijven', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await kiesLidPin(admin, toegang(), PIN, NU)).toEqual({ staat: 'al_gekozen' })
    expect(vragen).toHaveLength(0)
  })
  it('twee toestellen tegelijk: de tweede verliest', async () => {
    const { admin } = nepSupabase(() => ok([]))
    expect(await kiesLidPin(admin, toegang({ pinHash: null }), PIN, NU)).toEqual({ staat: 'al_gekozen' })
  })
})

describe('logInLid', () => {
  it('goede pin: een sessie met alleen de hash van het token, gekoppeld aan lid en sportschool', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok([]) : eenRij))
    const uit = await logInLid(admin, toegang(), PIN, NU)
    expect(uit.staat).toBe('ok')
    if (uit.staat !== 'ok') return
    const insert = vragen.find((v) => v.tabel === 'club_lid_sessies' && v.actie === 'insert')!
    expect(insert.waarde).toMatchObject({ token_hash: tokenHash(uit.sessie.token), toegang_id: ID, user_id: GYM, lid_id: LID })
    expect(JSON.stringify(insert.waarde)).not.toContain(uit.sessie.token)
    expect(uit.sessie.verlooptOp.getTime() - NU.getTime()).toBe(90 * 86_400_000)
  })
  it('foute pin telt af; de vijfde fout blokkeert 15 minuten', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await logInLid(admin, toegang(), '000001', NU)).toEqual({ staat: 'fout', over: 4 })
    const vijfde = await logInLid(admin, toegang({ mislukt: 4 }), '000001', NU)
    expect(vijfde).toEqual({ staat: 'geblokkeerd', totOp: new Date(NU.getTime() + 15 * 60_000).toISOString() })
    expect(vragen.some((v) => v.actie === 'insert')).toBe(false)
  })
  it('tijdens een blokkade wordt de pin niet eens gecontroleerd', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    const tot = new Date(NU.getTime() + 60_000).toISOString()
    expect(await logInLid(admin, toegang({ geblokkeerdTot: tot }), PIN, NU)).toEqual({ staat: 'geblokkeerd', totOp: tot })
    expect(vragen).toHaveLength(0)
  })
  it('na de laatste blokkade gaat de link dicht en worden alle toestellen uitgelogd', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await logInLid(admin, toegang({ mislukt: 4, blokkades: 5 }), '000001', NU)).toEqual({ staat: 'ongeldig' })
    expect(vragen.some((v) => v.tabel === 'club_lid_sessies' && v.actie === 'delete' && heeftFilter(v, 'lid_id', LID))).toBe(true)
  })
  it('parallelle poging (teller veranderd): telt als fout, geen pincheck', async () => {
    const { admin } = nepSupabase(() => ok([]))
    expect(await logInLid(admin, toegang(), PIN, NU)).toEqual({ staat: 'fout', over: 4 })
  })
})

describe('lidVanSessie', () => {
  const sessieRij = (extra: Record<string, unknown> = {}) => ({
    toegang_id: ID, user_id: GYM, lid_id: LID, verloopt_op: new Date(NU.getTime() + 86_400_000).toISOString(), laatst_gebruikt_op: NU.toISOString(), aangemaakt_op: NU.toISOString(), ...extra,
  })
  it('geldige sessie: de toegang, gezocht binnen de sportschool van de sessie', async () => {
    const { admin, vragen } = nepSupabase((v) => ok(v.tabel === 'club_lid_sessies' ? sessieRij() : rij()))
    const uit = await lidVanSessie(admin, 'token', NU)
    expect(uit?.toegang.lidId).toBe(LID)
    expect(heeftFilter(vragen[1], 'user_id', GYM)).toBe(true)
  })
  it('een sessie die niet bij de toegang past (ander lid of andere sportschool): niets', async () => {
    const { admin } = nepSupabase((v) => ok(v.tabel === 'club_lid_sessies' ? sessieRij({ lid_id: ID }) : rij()))
    expect(await lidVanSessie(admin, 'token', NU)).toBeNull()
    const { admin: a2 } = nepSupabase((v) => ok(v.tabel === 'club_lid_sessies' ? sessieRij() : rij({ user_id: ANDER })))
    expect(await lidVanSessie(a2, 'token', NU)).toBeNull()
  })
  it('ingetrokken link of gewiste pincode: niets', async () => {
    const { admin } = nepSupabase((v) => ok(v.tabel === 'club_lid_sessies' ? sessieRij() : rij({ actief: false })))
    expect(await lidVanSessie(admin, 'token', NU)).toBeNull()
    const { admin: a2 } = nepSupabase((v) => ok(v.tabel === 'club_lid_sessies' ? sessieRij() : rij({ pin_hash: null })))
    expect(await lidVanSessie(a2, 'token', NU)).toBeNull()
  })
  it('verlopen: de sessie wordt gewist', async () => {
    const { admin, vragen } = nepSupabase(() => ok(sessieRij({ verloopt_op: new Date(NU.getTime() - 1).toISOString() })))
    expect(await lidVanSessie(admin, 'token', NU)).toBeNull()
    expect(vragen.some((v) => v.actie === 'delete')).toBe(true)
  })
  it('geen of een absurd lang token: geen databasevraag', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await lidVanSessie(admin, undefined, NU)).toBeNull()
    expect(await lidVanSessie(admin, 'x'.repeat(200), NU)).toBeNull()
    expect(vragen).toHaveLength(0)
  })
})

describe('link beheren', () => {
  it('opnieuw maken: nieuwe code, pincode gewist, alle toestellen uit, binnen de sportschool', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok(rij()) : ok(null)))
    expect(await maakLidLink(admin, GYM, LID, NU)).toBe(true)
    const update = vragen.find((v) => v.tabel === 'club_lid_toegang' && v.actie === 'update')!
    const w = update.waarde as Record<string, unknown>
    expect(w.code).not.toBe(CODE)
    expect(w.code).toMatch(/^[A-Za-z0-9_-]{24}$/)
    expect(w.pin_hash).toBeNull()
    expect(heeftFilter(update, 'user_id', GYM)).toBe(true)
    const wis = vragen.find((v) => v.tabel === 'club_lid_sessies' && v.actie === 'delete')!
    expect(heeftFilter(wis, 'user_id', GYM) && heeftFilter(wis, 'lid_id', LID)).toBe(true)
  })
  it('eerste keer: een nieuwe rij voor dit lid en deze sportschool', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await maakLidLink(admin, GYM, LID, NU)).toBe(true)
    expect(vragen.find((v) => v.actie === 'insert')?.waarde).toMatchObject({ user_id: GYM, lid_id: LID, actief: true })
  })
  it('intrekken: niet meer actief en alle toestellen uit', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await trekLidLinkIn(admin, GYM, LID, NU)).toBe(true)
    expect((vragen[0].waarde as Record<string, unknown>).actief).toBe(false)
    expect(vragen[1]).toMatchObject({ tabel: 'club_lid_sessies', actie: 'delete' })
  })
})
