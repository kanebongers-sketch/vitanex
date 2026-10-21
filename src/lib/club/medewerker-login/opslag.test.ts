// De opslag van de medewerker-login tegen een nep-Supabase: tenant-scheiding
// (elke beheerquery filtert op de sportschool), goedkeuren alleen met de juiste
// controlecode, en sessies die alleen bij de huidige link horen.

import { describe, expect, it } from 'vitest'
import { controleCode, hashPin, tokenHash } from '@/lib/club/kern/pin'
import { heeftFilter, nepSupabase, type Vraag } from '@/lib/club/beheerders/nep-supabase'
import { beheerMedewerkerLogin, kiesMedewerkerPin, logInMedewerker, medewerkerVanSessie, vindMedewerkerLink } from './opslag'
import { toegangUitRij, type MedewerkerToegang } from './medewerker-login'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const ANDERE_GYM = 'be000000-0000-4000-8000-0000000000b2'
const MW = '33333333-3333-4333-8333-333333333333'
const TOEGANG_ID = '44444444-4444-4444-8444-444444444444'
const CODE = 'abcdefghijklmnopqrstuvwx'
const NU = new Date('2026-10-17T12:00:00Z')
const PIN = '482915'
const HASH = hashPin(PIN)

const toegangRij = (extra: Record<string, unknown> = {}) => ({
  id: TOEGANG_ID, user_id: GYM, medewerker_id: MW, code: CODE, actief: true, pin_hash: HASH, pin_status: 'actief', mislukt: 0, geblokkeerd_tot: null, blokkades: 0, laatst_ingelogd_op: null, ...extra,
})
const mensRij = (extra: Record<string, unknown> = {}) => ({ id: MW, user_id: GYM, naam: 'Lotte', email: null, rollen: ['trainer'], vestigingen: ['budel'], actief: true, ...extra })
const toegang = (extra: Record<string, unknown> = {}) => toegangUitRij(toegangRij(extra)) as MedewerkerToegang

/** Een nep-database met een link, een medewerker en een sessie. */
function db(opties: { toegang?: Record<string, unknown> | null; mens?: Record<string, unknown>; sessie?: Record<string, unknown> | null } = {}) {
  return nepSupabase((v: Vraag) => {
    if (v.actie === 'update') return { data: [{ id: TOEGANG_ID }], error: null }
    if (v.actie !== 'select') return { data: null, error: null }
    if (v.tabel === 'club_medewerker_toegang') return { data: opties.toegang === null ? null : toegangRij(opties.toegang), error: null }
    if (v.tabel === 'club_medewerkers') return { data: heeftFilter(v, 'user_id', GYM) ? mensRij(opties.mens) : null, error: null }
    if (v.tabel === 'club_medewerker_sessies') {
      if (opties.sessie === null) return { data: null, error: null }
      return { data: { toegang_id: TOEGANG_ID, medewerker_id: MW, user_id: GYM, verloopt_op: '2026-11-01T00:00:00Z', laatst_gebruikt_op: '2026-10-17T11:30:00Z', aangemaakt_op: '2026-10-10T00:00:00Z', ...opties.sessie }, error: null }
    }
    return { data: null, error: null }
  })
}

describe('vindMedewerkerLink', () => {
  it('geeft link en medewerker bij een actieve link', async () => {
    const { admin } = db()
    expect((await vindMedewerkerLink(admin, CODE))?.medewerker.naam).toBe('Lotte')
  })
  it('kapotte code, ingetrokken link of medewerker uit dienst: null', async () => {
    expect(await vindMedewerkerLink(db().admin, 'kort')).toBeNull()
    expect(await vindMedewerkerLink(db({ toegang: { actief: false } }).admin, CODE)).toBeNull()
    expect(await vindMedewerkerLink(db({ mens: { actief: false } }).admin, CODE)).toBeNull()
  })
})

describe('pincode kiezen en inloggen', () => {
  it('kiezen zet de pin op wacht en geeft de controlecode', async () => {
    const { admin, vragen } = db()
    const uit = await kiesMedewerkerPin(admin, toegang({ pin_status: 'geen', pin_hash: null }), PIN, NU)
    expect(uit.staat).toBe('ok')
    const update = vragen.find((v) => v.actie === 'update')
    expect(update?.waarde).toMatchObject({ pin_status: 'wacht' })
    expect(heeftFilter(update as Vraag, 'pin_status', 'geen')).toBe(true)
  })
  it('een pin die al gekozen is, kan niet overschreven worden', async () => {
    expect((await kiesMedewerkerPin(db().admin, toegang({ pin_status: 'wacht' }), PIN, NU)).staat).toBe('al_gekozen')
  })
  it('goede pin: een sessie bij deze link, medewerker en sportschool', async () => {
    const { admin, vragen } = db()
    const uit = await logInMedewerker(admin, toegang(), PIN, NU)
    expect(uit.staat).toBe('ok')
    const insert = vragen.find((v) => v.actie === 'insert' && v.tabel === 'club_medewerker_sessies')
    expect(insert?.waarde).toMatchObject({ toegang_id: TOEGANG_ID, medewerker_id: MW, user_id: GYM })
  })
  it('foute pin: een poging minder; pin nog niet goedgekeurd: niet actief', async () => {
    expect(await logInMedewerker(db().admin, toegang(), '000000', NU)).toEqual({ staat: 'fout', over: 4 })
    expect((await logInMedewerker(db().admin, toegang({ pin_status: 'wacht' }), PIN, NU)).staat).toBe('niet_actief')
  })
  it('de laatste blokkade sluit de link en wist alle sessies van de medewerker', async () => {
    const { admin, vragen } = db()
    const uit = await logInMedewerker(admin, toegang({ blokkades: 5, mislukt: 4 }), '000000', NU)
    expect(uit.staat).toBe('gesloten')
    const wis = vragen.find((v) => v.actie === 'delete' && v.tabel === 'club_medewerker_sessies')
    expect(wis && heeftFilter(wis, 'user_id', GYM) && heeftFilter(wis, 'medewerker_id', MW)).toBe(true)
  })
  it('een tijdelijke blokkade wist geen sessies', async () => {
    const { admin, vragen } = db()
    expect((await logInMedewerker(admin, toegang({ mislukt: 4 }), '000000', NU)).staat).toBe('geblokkeerd')
    expect(vragen.some((v) => v.actie === 'delete')).toBe(false)
  })
  it('na te veel blokkades blijft de link dicht', async () => {
    expect((await logInMedewerker(db().admin, toegang({ blokkades: 6 }), PIN, NU)).staat).toBe('gesloten')
  })
})

describe('medewerkerVanSessie', () => {
  it('geldige sessie bij een actieve medewerker: binnen', async () => {
    expect((await medewerkerVanSessie(db().admin, 'token', NU))?.medewerker.id).toBe(MW)
  })
  it('een sessie van een oude link of andere sportschool telt niet', async () => {
    expect(await medewerkerVanSessie(db({ sessie: { toegang_id: MW } }).admin, 'token', NU)).toBeNull()
    expect(await medewerkerVanSessie(db({ sessie: { user_id: ANDERE_GYM } }).admin, 'token', NU)).toBeNull()
  })
  it('uit dienst, link ingetrokken of pin gereset: niet meer binnen', async () => {
    expect(await medewerkerVanSessie(db({ mens: { actief: false } }).admin, 'token', NU)).toBeNull()
    expect(await medewerkerVanSessie(db({ toegang: { actief: false } }).admin, 'token', NU)).toBeNull()
    expect(await medewerkerVanSessie(db({ toegang: { pin_status: 'geen' } }).admin, 'token', NU)).toBeNull()
  })
  it('verlopen sessie wordt gewist', async () => {
    const { admin, vragen } = db({ sessie: { verloopt_op: '2026-10-01T00:00:00Z' } })
    expect(await medewerkerVanSessie(admin, 'token', NU)).toBeNull()
    expect(vragen.some((v) => v.actie === 'delete' && heeftFilter(v, 'token_hash', tokenHash('token')))).toBe(true)
  })
  it('geen of een te lang token: null zonder databasevraag', async () => {
    const { admin, vragen } = db()
    expect(await medewerkerVanSessie(admin, undefined, NU)).toBeNull()
    expect(await medewerkerVanSessie(admin, 'x'.repeat(101), NU)).toBeNull()
    expect(vragen).toHaveLength(0)
  })
})

describe('beheer door eigenaar of clubmanager', () => {
  const wacht = { pin_status: 'wacht' }
  it('goedkeuren alleen met de juiste controlecode, gebonden aan die pin', async () => {
    const { admin, vragen } = db({ toegang: wacht })
    expect(await beheerMedewerkerLogin(admin, GYM, MW, { actie: 'goedkeuren', controle: controleCode(HASH) === '0000' ? '0001' : '0000' }, NU)).toBe('controle_fout')
    expect(await beheerMedewerkerLogin(admin, GYM, MW, { actie: 'goedkeuren', controle: controleCode(HASH) }, NU)).toBe('ok')
    const update = vragen.find((v) => v.actie === 'update')
    expect(update?.waarde).toMatchObject({ pin_status: 'actief' })
    expect(heeftFilter(update as Vraag, 'pin_hash', HASH) && heeftFilter(update as Vraag, 'user_id', GYM)).toBe(true)
  })
  it('elke beheerquery filtert op de eigen sportschool', async () => {
    const { admin, vragen } = db()
    await beheerMedewerkerLogin(admin, GYM, MW, { actie: 'intrekken', controle: null }, NU)
    const toegangVragen = vragen.filter((v) => v.tabel === 'club_medewerker_toegang')
    expect(toegangVragen.length).toBeGreaterThan(0)
    expect(toegangVragen.every((v) => heeftFilter(v, 'user_id', GYM))).toBe(true)
  })
  it('intrekken zet de link uit en logt alle toestellen uit', async () => {
    const { admin, vragen } = db()
    expect(await beheerMedewerkerLogin(admin, GYM, MW, { actie: 'intrekken', controle: null }, NU)).toBe('ok')
    expect(vragen.find((v) => v.actie === 'update')?.waarde).toMatchObject({ actief: false, pin_hash: null, pin_status: 'geen' })
    expect(vragen.some((v) => v.actie === 'delete' && v.tabel === 'club_medewerker_sessies' && heeftFilter(v, 'toegang_id', TOEGANG_ID))).toBe(true)
  })
  it('maken: nieuwe link als er nog geen is, anders nieuwe code en alle toestellen uit', async () => {
    const nieuw = db({ toegang: null })
    expect(await beheerMedewerkerLogin(nieuw.admin, GYM, MW, { actie: 'maken', controle: null }, NU)).toBe('ok')
    expect(nieuw.vragen.find((v) => v.actie === 'insert')?.waarde).toMatchObject({ user_id: GYM, medewerker_id: MW, pin_status: 'geen', actief: true })

    const opnieuw = db()
    expect(await beheerMedewerkerLogin(opnieuw.admin, GYM, MW, { actie: 'maken', controle: null }, NU)).toBe('ok')
    const update = opnieuw.vragen.find((v) => v.actie === 'update')
    expect((update?.waarde as { code: string }).code).not.toBe(CODE)
    expect(opnieuw.vragen.some((v) => v.actie === 'delete' && v.tabel === 'club_medewerker_sessies')).toBe(true)
  })
  it('een medewerker van een andere sportschool of uit dienst: niet gevonden', async () => {
    expect(await beheerMedewerkerLogin(db().admin, ANDERE_GYM, MW, { actie: 'maken', controle: null }, NU)).toBe('niet_gevonden')
    expect(await beheerMedewerkerLogin(db({ mens: { actief: false } }).admin, GYM, MW, { actie: 'maken', controle: null }, NU)).toBe('niet_gevonden')
  })
})
