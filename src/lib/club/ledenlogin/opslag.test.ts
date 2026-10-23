import { describe, expect, it } from 'vitest'
import { tokenHash } from '@/lib/club/kern/pin'
import { hashWachtwoord, wachtwoordKlopt } from '@/lib/club/kern/wachtwoord'
import { heeftFilter, nepSupabase, type Antwoord } from '@/lib/club/beheerders/nep-supabase'
import type { LidToegangRij } from './regels'
import {
  activeerLid, controleerWachtwoord, geefUitnodigingCode, kiesWachtwoordInApp, lidVanSessie, maakLidLink, maakSessie, trekLidLinkIn, vindInlogKandidaten, vindLidToegang,
} from './opslag'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const ANDER = 'be000000-0000-4000-8000-0000000000b2'
const LID = '11111111-1111-4111-8111-111111111111'
const ID = '22222222-2222-4222-8222-222222222222'
const CODE = 'abcdefghijklmnopqrstuvwx'
const NU = new Date('2026-10-17T12:00:00Z')
const WW = 'Paars-fietsje-op-de-dijk-7'
const EMAIL = 'sanne@voorbeeld.nl'
const HASH = hashWachtwoord(WW)

const ok = (data: unknown): Antwoord => ({ data, error: null })
const eenRij = ok([{ id: ID }])

const toegang = (extra: Partial<LidToegangRij> = {}): LidToegangRij => ({
  id: ID, userId: GYM, lidId: LID, code: CODE, codeGemaaktOp: NU.toISOString(), actief: true, email: EMAIL, wachtwoordHash: HASH,
  pinHash: null, codeGebruiktOp: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null, ...extra,
})

const rij = (extra: Record<string, unknown> = {}) => ({
  id: ID, user_id: GYM, lid_id: LID, code: CODE, code_gemaakt_op: NU.toISOString(), actief: true, email: EMAIL, wachtwoord_hash: 'x', pin_hash: null,
  code_gebruikt_op: null, mislukt: 0, geblokkeerd_tot: null, blokkades: 0, ...extra,
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

describe('activeerLid (uitnodiging gebruiken)', () => {
  const vers = toegang({ email: null, wachtwoordHash: null, pinHash: 'oude-pin' })
  it('legt e-mail en wachtwoord vast (alleen gehasht), maakt de link eenmalig en wist de pincode', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok([]) : eenRij))
    const uit = await activeerLid(admin, vers, EMAIL, WW, NU)
    expect(uit.staat).toBe('ok')
    const update = vragen.find((v) => v.tabel === 'club_lid_toegang' && v.actie === 'update')!
    const w = update.waarde as Record<string, unknown>
    expect(w).toMatchObject({ email: EMAIL, pin_hash: null, code_gebruikt_op: NU.toISOString(), mislukt: 0, blokkades: 0 })
    expect(wachtwoordKlopt(WW, w.wachtwoord_hash as string)).toBe(true)
    expect(update.filters).toContainEqual(['is', 'code_gebruikt_op', null])
    expect(heeftFilter(update, 'user_id', GYM) && heeftFilter(update, 'code', CODE)).toBe(true)
    expect(JSON.stringify(vragen.map((v) => v.waarde))).not.toContain(WW)
    // Alle oude toestellen uit, daarna een sessie voor dit toestel.
    const wis = vragen.findIndex((v) => v.tabel === 'club_lid_sessies' && v.actie === 'delete' && heeftFilter(v, 'lid_id', LID))
    const nieuw = vragen.findIndex((v) => v.tabel === 'club_lid_sessies' && v.actie === 'insert')
    expect(wis).toBeGreaterThan(-1)
    expect(nieuw).toBeGreaterThan(wis)
  })
  it('gebruikte, verlopen of ingetrokken link: niets', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await activeerLid(admin, { ...vers, codeGebruiktOp: NU.toISOString() }, EMAIL, WW, NU)).toEqual({ staat: 'ongeldig' })
    expect(await activeerLid(admin, { ...vers, codeGemaaktOp: '2020-01-01T00:00:00Z' }, EMAIL, WW, NU)).toEqual({ staat: 'ongeldig' })
    expect(await activeerLid(admin, { ...vers, actief: false }, EMAIL, WW, NU)).toEqual({ staat: 'ongeldig' })
    expect(await activeerLid(admin, vers, 'Geen Adres', WW, NU)).toEqual({ staat: 'ongeldig' })
    expect(vragen).toHaveLength(0)
  })
  it('twee toestellen tegelijk: de tweede verliest', async () => {
    const { admin } = nepSupabase(() => ok([]))
    expect(await activeerLid(admin, vers, EMAIL, WW, NU)).toEqual({ staat: 'ongeldig' })
  })
  it('adres al in gebruik bij een ander lid van deze sportschool: nette melding', async () => {
    const { admin } = nepSupabase(() => ({ data: null, error: { message: 'dubbel', code: '23505' } }))
    expect(await activeerLid(admin, vers, EMAIL, WW, NU)).toEqual({ staat: 'email_bezet' })
  })
})

describe('kiesWachtwoordInApp (oude pincode-sessie)', () => {
  it('alleen zonder wachtwoord; de pincode verdwijnt, de sessie blijft', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await kiesWachtwoordInApp(admin, toegang({ wachtwoordHash: null, pinHash: 'x' }), EMAIL, WW, NU)).toEqual({ staat: 'ok' })
    const update = vragen[0]
    expect(update.filters).toContainEqual(['is', 'wachtwoord_hash', null])
    expect((update.waarde as Record<string, unknown>).pin_hash).toBeNull()
    expect(vragen.some((v) => v.tabel === 'club_lid_sessies')).toBe(false)
  })
  it('al een wachtwoord: niet overschrijven', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await kiesWachtwoordInApp(admin, toegang(), EMAIL, WW, NU)).toEqual({ staat: 'al_gekozen' })
    expect(vragen).toHaveLength(0)
  })
})

describe('vindInlogKandidaten', () => {
  it('zoekt op het genormaliseerde adres, alleen actief met wachtwoord, begrensd', async () => {
    const { admin, vragen } = nepSupabase(() => ok([rij(), rij({ id: 'kapot' }), rij({ email: 'ander@x.nl' })]))
    const uit = await vindInlogKandidaten(admin, '  Sanne@Voorbeeld.NL ', null)
    expect(uit.map((t) => t.id)).toEqual([ID])
    expect(heeftFilter(vragen[0], 'email', EMAIL) && heeftFilter(vragen[0], 'actief', true)).toBe(true)
    expect(vragen[0].filters).toContainEqual(['not', 'wachtwoord_hash', 'is'])
  })
  it('met een sportschool alleen daar; een ongeldig adres vraagt niets', async () => {
    const { admin, vragen } = nepSupabase(() => ok([]))
    await vindInlogKandidaten(admin, EMAIL, ANDER)
    expect(heeftFilter(vragen[0], 'user_id', ANDER)).toBe(true)
    expect(await vindInlogKandidaten(admin, 'geen-adres', null)).toEqual([])
    expect(vragen).toHaveLength(1)
  })
  it('een dicht account of alleen een pincode doet niet mee', async () => {
    const { admin } = nepSupabase(() => ok([rij({ blokkades: 6 }), rij({ wachtwoord_hash: null, pin_hash: 'x' })]))
    expect(await vindInlogKandidaten(admin, EMAIL, null)).toEqual([])
  })
})

describe('controleerWachtwoord (de rem)', () => {
  it('goed wachtwoord: tellers terug naar nul, binnen de sportschool', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await controleerWachtwoord(admin, toegang({ mislukt: 3 }), WW, NU)).toEqual({ staat: 'goed' })
    const wis = vragen[1]
    expect(wis.waarde).toMatchObject({ mislukt: 0, blokkades: 0, geblokkeerd_tot: null })
    expect(heeftFilter(wis, 'user_id', GYM)).toBe(true)
  })
  it('fout wachtwoord telt af; de vijfde fout blokkeert 15 minuten', async () => {
    const { admin } = nepSupabase(() => eenRij)
    expect(await controleerWachtwoord(admin, toegang(), 'Fout-wachtwoord-123', NU)).toEqual({ staat: 'fout', over: 4 })
    expect(await controleerWachtwoord(admin, toegang({ mislukt: 4 }), 'Fout-wachtwoord-123', NU)).toEqual({ staat: 'geblokkeerd', totOp: new Date(NU.getTime() + 15 * 60_000).toISOString() })
  })
  it('tijdens een blokkade wordt het wachtwoord niet eens gecontroleerd', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    const tot = new Date(NU.getTime() + 60_000).toISOString()
    expect(await controleerWachtwoord(admin, toegang({ geblokkeerdTot: tot }), WW, NU)).toEqual({ staat: 'geblokkeerd', totOp: tot })
    expect(vragen).toHaveLength(0)
  })
  it('na de laatste blokkade gaat het account dicht en worden alle toestellen uitgelogd', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await controleerWachtwoord(admin, toegang({ mislukt: 4, blokkades: 5 }), 'Fout-wachtwoord-123', NU)).toEqual({ staat: 'dicht' })
    expect(vragen.some((v) => v.tabel === 'club_lid_sessies' && v.actie === 'delete' && heeftFilter(v, 'lid_id', LID))).toBe(true)
  })
  it('parallelle poging (teller veranderd): telt als fout, geen controle', async () => {
    const { admin } = nepSupabase(() => ok([]))
    expect(await controleerWachtwoord(admin, toegang(), WW, NU)).toEqual({ staat: 'fout', over: 4 })
  })
  it('alleen een oude pincode: inloggen kan niet', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await controleerWachtwoord(admin, toegang({ wachtwoordHash: null, pinHash: 'x' }), WW, NU)).toEqual({ staat: 'dicht' })
    expect(vragen).toHaveLength(0)
  })
})

describe('maakSessie', () => {
  it('alleen de hash van het token, gekoppeld aan lid en sportschool, 90 dagen', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok([]) : eenRij))
    const sessie = await maakSessie(admin, toegang(), NU)
    expect(sessie).not.toBeNull()
    const insert = vragen.find((v) => v.tabel === 'club_lid_sessies' && v.actie === 'insert')!
    expect(insert.waarde).toMatchObject({ token_hash: tokenHash(sessie!.token), toegang_id: ID, user_id: GYM, lid_id: LID })
    expect(JSON.stringify(insert.waarde)).not.toContain(sessie!.token)
    expect(sessie!.verlooptOp.getTime() - NU.getTime()).toBe(90 * 86_400_000)
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
  it('een bestaande sessie van een oude pincode blijft geldig', async () => {
    const { admin } = nepSupabase((v) => ok(v.tabel === 'club_lid_sessies' ? sessieRij() : rij({ wachtwoord_hash: null, pin_hash: 'x' })))
    expect((await lidVanSessie(admin, 'token', NU))?.toegang.pinHash).toBe('x')
  })
  it('een sessie die niet bij de toegang past (ander lid of andere sportschool): niets', async () => {
    const { admin } = nepSupabase((v) => ok(v.tabel === 'club_lid_sessies' ? sessieRij({ lid_id: ID }) : rij()))
    expect(await lidVanSessie(admin, 'token', NU)).toBeNull()
    const { admin: a2 } = nepSupabase((v) => ok(v.tabel === 'club_lid_sessies' ? sessieRij() : rij({ user_id: ANDER })))
    expect(await lidVanSessie(a2, 'token', NU)).toBeNull()
  })
  it('ingetrokken, dicht, of geen wachtwoord en geen pincode: niets', async () => {
    for (const extra of [{ actief: false }, { blokkades: 6 }, { wachtwoord_hash: null, pin_hash: null }]) {
      const { admin } = nepSupabase((v) => ok(v.tabel === 'club_lid_sessies' ? sessieRij() : rij(extra)))
      expect(await lidVanSessie(admin, 'token', NU)).toBeNull()
    }
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

describe('beheer vanaf de ledenkaart', () => {
  it('nieuwe link: nieuwe code, wachtwoord en pincode gewist, alle toestellen uit, binnen de sportschool', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok(rij()) : ok(null)))
    expect(await maakLidLink(admin, GYM, LID, NU)).toBe(true)
    const update = vragen.find((v) => v.tabel === 'club_lid_toegang' && v.actie === 'update')!
    const w = update.waarde as Record<string, unknown>
    expect(w.code).not.toBe(CODE)
    expect(w.code).toMatch(/^[A-Za-z0-9_-]{24}$/)
    expect(w).toMatchObject({ wachtwoord_hash: null, pin_hash: null, code_gebruikt_op: null })
    expect(heeftFilter(update, 'user_id', GYM)).toBe(true)
    const wis = vragen.find((v) => v.tabel === 'club_lid_sessies' && v.actie === 'delete')!
    expect(heeftFilter(wis, 'user_id', GYM) && heeftFilter(wis, 'lid_id', LID)).toBe(true)
  })
  it('eerste keer: een nieuwe rij voor dit lid en deze sportschool', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await maakLidLink(admin, GYM, LID, NU)).toBe(true)
    expect(vragen.find((v) => v.actie === 'insert')?.waarde).toMatchObject({ user_id: GYM, lid_id: LID, actief: true })
  })
  it('intrekken: niet meer actief, wachtwoord weg en alle toestellen uit', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect(await trekLidLinkIn(admin, GYM, LID, NU)).toBe(true)
    expect(vragen[0].waarde).toMatchObject({ actief: false, wachtwoord_hash: null })
    expect(vragen[1]).toMatchObject({ tabel: 'club_lid_sessies', actie: 'delete' })
  })
})

describe('geefUitnodigingCode (mail)', () => {
  it('een werkende uitnodiging wordt hergebruikt', async () => {
    const { admin, vragen } = nepSupabase(() => ok(rij()))
    expect(await geefUitnodigingCode(admin, GYM, LID, NU)).toEqual({ staat: 'ok', code: CODE })
    expect(vragen).toHaveLength(1)
  })
  it('gebruikt of verlopen: een nieuwe code, maar het wachtwoord en de toestellen blijven', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.actie === 'select' ? ok(rij({ code_gebruikt_op: NU.toISOString() })) : ok(null)))
    const uit = await geefUitnodigingCode(admin, GYM, LID, NU)
    expect(uit.staat).toBe('ok')
    const update = vragen.find((v) => v.actie === 'update')!
    expect(Object.keys(update.waarde as object).sort()).toEqual(['code', 'code_gebruikt_op', 'code_gemaakt_op', 'gewijzigd_op'])
    expect(heeftFilter(update, 'user_id', GYM)).toBe(true)
    expect(vragen.some((v) => v.tabel === 'club_lid_sessies')).toBe(false)
  })
  it('ingetrokken door de sportschool: geen uitnodiging', async () => {
    const { admin, vragen } = nepSupabase(() => ok(rij({ actief: false })))
    expect(await geefUitnodigingCode(admin, GYM, LID, NU)).toEqual({ staat: 'ingetrokken' })
    expect(vragen).toHaveLength(1)
  })
  it('nog geen toegang: een nieuwe rij', async () => {
    const { admin, vragen } = nepSupabase(() => ok(null))
    expect((await geefUitnodigingCode(admin, GYM, LID, NU)).staat).toBe('ok')
    expect(vragen.find((v) => v.actie === 'insert')?.waarde).toMatchObject({ user_id: GYM, lid_id: LID, actief: true })
  })
})
