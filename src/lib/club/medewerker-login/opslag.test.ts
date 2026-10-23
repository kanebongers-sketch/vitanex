// De opslag van de medewerker-login tegen een nep-Supabase: uitnodigen en
// wachtwoord kiezen (eenmalig, binnen de termijn, een adres hoort bij precies
// een account), inloggen met de rem, tenant-scheiding (elke beheerquery
// filtert op de sportschool) en sessies die alleen bij de huidige login horen.

import { describe, expect, it } from 'vitest'
import { tokenHash } from '@/lib/club/kern/pin'
import { hashWachtwoord } from '@/lib/club/kern/wachtwoord'
import { heeftFilter, nepSupabase, type Antwoord, type Vraag } from '@/lib/club/beheerders/nep-supabase'
import { beheerMedewerkerLogin, haalMedewerkerLogins, kiesWachtwoord, logInMedewerkerMetWachtwoord, medewerkerVanSessie, vindMedewerkerOpEmail, vindUitnodiging } from './opslag'
import { medewerkerMetOrgUitRij, toegangUitRij, type MedewerkerMetOrg, type MedewerkerToegang } from './medewerker-login'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const ANDERE_GYM = 'be000000-0000-4000-8000-0000000000b2'
const MW = '33333333-3333-4333-8333-333333333333'
const TOEGANG_ID = '44444444-4444-4444-8444-444444444444'
const ANDER_ID = '55555555-5555-4555-8555-555555555555'
const CODE = 'abcdefghijklmnopqrstuvwx'
const TOKEN = 'T'.repeat(43)
const NU = new Date('2026-10-23T12:00:00Z')
const WW = 'paars-fietsen-langs-de-dijk'
const HASH = hashWachtwoord(WW)
const EMAIL = 'lotte@gym.nl'

const toegangRij = (extra: Record<string, unknown> = {}) => ({
  id: TOEGANG_ID, user_id: GYM, medewerker_id: MW, code: CODE, actief: true, email: EMAIL, pin_hash: null, pin_status: 'geen', wachtwoord_hash: HASH,
  uitnodiging_verloopt_op: null, mislukt: 0, geblokkeerd_tot: null, blokkades: 0, laatst_ingelogd_op: null, ...extra,
})
const mensRij = (extra: Record<string, unknown> = {}) => ({ id: MW, user_id: GYM, naam: 'Lotte de Vries', email: null, rollen: ['trainer'], vestigingen: ['budel'], actief: true, ...extra })
const toegang = (extra: Record<string, unknown> = {}) => toegangUitRij(toegangRij(extra)) as MedewerkerToegang
const mens = (extra: Record<string, unknown> = {}) => medewerkerMetOrgUitRij(mensRij(extra)) as MedewerkerMetOrg
const OPEN = { wachtwoord_hash: null, uitnodiging_verloopt_op: '2026-10-30T12:00:00Z' }

interface Opties {
  toegang?: Record<string, unknown> | null
  mens?: Record<string, unknown>
  sessie?: Record<string, unknown> | null
  /** Rijen van club_medewerker_toegang bij een zoekvraag op e-mailadres. */
  opEmail?: Record<string, unknown>[]
  /** Een beheerder met wachtwoord op dit adres. */
  beheerder?: boolean
  /** Antwoord op een update of insert van club_medewerker_toegang. */
  schrijf?: Antwoord
}

function db(opties: Opties = {}) {
  return nepSupabase((v: Vraag) => {
    if (v.tabel === 'club_beheerders') {
      const rij = { id: '11111111-1111-4111-8111-111111111111', organisatie_id: ANDERE_GYM, naam: 'Sanne', email: EMAIL, rol: 'eigenaar', code: 'zyxwvutsrqponmlkjihgfedc', actief: true, wachtwoord_hash: HASH, pin_status: 'geen' }
      return { data: opties.beheerder ? [rij] : [], error: null }
    }
    if (v.tabel === 'club_medewerker_toegang' && (v.actie === 'update' || v.actie === 'insert')) {
      return opties.schrijf ?? { data: [{ id: TOEGANG_ID }], error: null }
    }
    if (v.actie !== 'select') return { data: null, error: null }
    if (v.tabel === 'club_medewerker_toegang') {
      if (v.filters.some(([, k]) => k === 'email')) return { data: opties.opEmail ?? [toegangRij(opties.toegang ?? {})], error: null }
      return { data: opties.toegang === null ? null : toegangRij(opties.toegang), error: null }
    }
    if (v.tabel === 'club_medewerkers') return { data: heeftFilter(v, 'user_id', GYM) ? mensRij(opties.mens) : null, error: null }
    if (v.tabel === 'club_medewerker_sessies') {
      if (opties.sessie === null) return { data: null, error: null }
      return { data: { toegang_id: TOEGANG_ID, medewerker_id: MW, user_id: GYM, verloopt_op: '2026-11-01T00:00:00Z', laatst_gebruikt_op: '2026-10-23T11:30:00Z', aangemaakt_op: '2026-10-20T00:00:00Z', ...opties.sessie }, error: null }
    }
    return { data: null, error: null }
  })
}

describe('vindUitnodiging', () => {
  it('een open uitnodiging: login en medewerker, gezocht op de hash van de token', async () => {
    const { admin, vragen } = db({ toegang: OPEN })
    expect((await vindUitnodiging(admin, TOKEN, NU))?.medewerker.naam).toBe('Lotte de Vries')
    expect(heeftFilter(vragen[0], 'uitnodiging_hash', tokenHash(TOKEN))).toBe(true)
  })
  it('kapotte token (ook een oude pincode-link), verlopen, ingetrokken, zonder adres of uit dienst: null', async () => {
    expect(await vindUitnodiging(db({ toegang: OPEN }).admin, CODE, NU)).toBeNull()
    expect(await vindUitnodiging(db({ toegang: { ...OPEN, uitnodiging_verloopt_op: '2026-10-23T11:59:00Z' } }).admin, TOKEN, NU)).toBeNull()
    expect(await vindUitnodiging(db({ toegang: { ...OPEN, actief: false } }).admin, TOKEN, NU)).toBeNull()
    expect(await vindUitnodiging(db({ toegang: { ...OPEN, email: null } }).admin, TOKEN, NU)).toBeNull()
    expect(await vindUitnodiging(db({ toegang: OPEN, mens: { actief: false } }).admin, TOKEN, NU)).toBeNull()
  })
})

describe('kiesWachtwoord', () => {
  const gevonden = () => ({ toegang: toegang(OPEN), medewerker: mens() })
  it('slaat alleen een hash op, eenmalig en binnen de termijn, en geeft een sessie', async () => {
    const { admin, vragen } = db()
    const uit = await kiesWachtwoord(admin, gevonden(), TOKEN, WW, NU)
    expect(uit.staat).toBe('ok')
    const update = vragen.find((v) => v.actie === 'update' && v.tabel === 'club_medewerker_toegang') as Vraag
    const waarde = update.waarde as Record<string, unknown>
    expect(waarde.wachtwoord_hash).toMatch(/^s2:/)
    expect(JSON.stringify(waarde)).not.toContain(WW)
    expect(waarde).toMatchObject({ uitnodiging_hash: null, uitnodiging_verloopt_op: null, pin_hash: null, pin_status: 'geen', mislukt: 0 })
    expect(heeftFilter(update, 'uitnodiging_hash', tokenHash(TOKEN)) && heeftFilter(update, 'actief', true)).toBe(true)
    expect(update.filters.some(([op, k]) => op === 'gt' && k === 'uitnodiging_verloopt_op')).toBe(true)
    expect(vragen.find((v) => v.actie === 'insert' && v.tabel === 'club_medewerker_sessies')?.waarde).toMatchObject({ toegang_id: TOEGANG_ID, medewerker_id: MW, user_id: GYM })
  })
  it('al gebruikt (niemand bijgewerkt): verlopen, zonder sessie', async () => {
    const { admin, vragen } = db({ schrijf: { data: [], error: null } })
    expect((await kiesWachtwoord(admin, gevonden(), TOKEN, WW, NU)).staat).toBe('verlopen')
    expect(vragen.some((v) => v.tabel === 'club_medewerker_sessies')).toBe(false)
  })
  it('een adres dat al bij een beheerder of (unieke index) een andere login hoort: bezet', async () => {
    expect((await kiesWachtwoord(db({ beheerder: true }).admin, gevonden(), TOKEN, WW, NU)).staat).toBe('email_bezet')
    expect((await kiesWachtwoord(db({ schrijf: { data: null, error: { message: 'dubbel', code: '23505' } } }).admin, gevonden(), TOKEN, WW, NU)).staat).toBe('email_bezet')
  })
})

describe('inloggen met e-mailadres en wachtwoord', () => {
  it('vindt precies een login met wachtwoord; twee of geen: null', async () => {
    const { admin, vragen } = db()
    expect((await vindMedewerkerOpEmail(admin, ' Lotte@Gym.NL '))?.toegang.id).toBe(TOEGANG_ID)
    expect(heeftFilter(vragen[0], 'email', EMAIL) && heeftFilter(vragen[0], 'actief', true)).toBe(true)
    expect(await vindMedewerkerOpEmail(db({ opEmail: [toegangRij(), toegangRij({ id: ANDER_ID })] }).admin, EMAIL)).toBeNull()
    expect(await vindMedewerkerOpEmail(db({ opEmail: [] }).admin, EMAIL)).toBeNull()
    expect(await vindMedewerkerOpEmail(db().admin, 'geen-adres')).toBeNull()
  })
  it('goed wachtwoord: een sessie; fout: een poging minder', async () => {
    const { admin, vragen } = db()
    expect((await logInMedewerkerMetWachtwoord(admin, { toegang: toegang(), medewerker: mens() }, WW, NU)).staat).toBe('ok')
    expect(vragen.some((v) => v.actie === 'insert' && v.tabel === 'club_medewerker_sessies')).toBe(true)
    expect(await logInMedewerkerMetWachtwoord(db().admin, { toegang: toegang(), medewerker: mens() }, 'fout-wachtwoord-123', NU)).toEqual({ staat: 'fout', over: 4 })
  })
  it('zonder wachtwoord (alleen oude pincode of uitgenodigd) of uit dienst: niet actief', async () => {
    expect((await logInMedewerkerMetWachtwoord(db().admin, { toegang: toegang({ wachtwoord_hash: null, pin_status: 'actief', pin_hash: 'a:b' }), medewerker: mens() }, WW, NU)).staat).toBe('niet_actief')
    expect((await logInMedewerkerMetWachtwoord(db().admin, { toegang: toegang(), medewerker: mens({ actief: false }) }, WW, NU)).staat).toBe('niet_actief')
  })
  it('rem: poging eerst reserveren; de laatste blokkade sluit en wist alle sessies', async () => {
    const { admin, vragen } = db()
    expect((await logInMedewerkerMetWachtwoord(admin, { toegang: toegang({ blokkades: 5, mislukt: 4 }), medewerker: mens() }, 'fout-wachtwoord-123', NU)).staat).toBe('gesloten')
    const reserveer = vragen.find((v) => v.actie === 'update') as Vraag
    expect(reserveer.waarde).toEqual({ mislukt: 5 })
    expect(heeftFilter(reserveer, 'mislukt', 4)).toBe(true)
    const wis = vragen.find((v) => v.actie === 'delete' && v.tabel === 'club_medewerker_sessies')
    expect(wis && heeftFilter(wis, 'user_id', GYM) && heeftFilter(wis, 'medewerker_id', MW)).toBe(true)
  })
  it('geblokkeerd of dicht: geen wachtwoordcontrole', async () => {
    const tot = '2026-10-23T13:00:00Z'
    expect(await logInMedewerkerMetWachtwoord(db().admin, { toegang: toegang({ geblokkeerd_tot: tot }), medewerker: mens() }, WW, NU)).toEqual({ staat: 'geblokkeerd', totOp: tot })
    expect((await logInMedewerkerMetWachtwoord(db().admin, { toegang: toegang({ blokkades: 6 }), medewerker: mens() }, WW, NU)).staat).toBe('gesloten')
  })
})

describe('medewerkerVanSessie', () => {
  it('geldige sessie met wachtwoord, of nog met de oude goedgekeurde pincode: binnen', async () => {
    expect((await medewerkerVanSessie(db().admin, 'token', NU))?.medewerker.id).toBe(MW)
    expect((await medewerkerVanSessie(db({ toegang: { wachtwoord_hash: null, pin_status: 'actief', pin_hash: 'a:b' } }).admin, 'token', NU))?.medewerker.id).toBe(MW)
  })
  it('een sessie van een oude login of andere sportschool telt niet', async () => {
    expect(await medewerkerVanSessie(db({ sessie: { toegang_id: MW } }).admin, 'token', NU)).toBeNull()
    expect(await medewerkerVanSessie(db({ sessie: { user_id: ANDERE_GYM } }).admin, 'token', NU)).toBeNull()
  })
  it('uit dienst, ingetrokken of zonder wachtwoord en pincode: niet meer binnen', async () => {
    expect(await medewerkerVanSessie(db({ mens: { actief: false } }).admin, 'token', NU)).toBeNull()
    expect(await medewerkerVanSessie(db({ toegang: { actief: false } }).admin, 'token', NU)).toBeNull()
    expect(await medewerkerVanSessie(db({ toegang: { wachtwoord_hash: null } }).admin, 'token', NU)).toBeNull()
  })
  it('verlopen sessie wordt gewist; geen of te lang token: geen databasevraag', async () => {
    const verlopen = db({ sessie: { verloopt_op: '2026-10-01T00:00:00Z' } })
    expect(await medewerkerVanSessie(verlopen.admin, 'token', NU)).toBeNull()
    expect(verlopen.vragen.some((v) => v.actie === 'delete' && heeftFilter(v, 'token_hash', tokenHash('token')))).toBe(true)
    const { admin, vragen } = db()
    expect(await medewerkerVanSessie(admin, undefined, NU)).toBeNull()
    expect(await medewerkerVanSessie(admin, 'x'.repeat(101), NU)).toBeNull()
    expect(vragen).toHaveLength(0)
  })
})

describe('beheer door eigenaar of clubmanager', () => {
  const nodig = { actie: 'uitnodigen' as const, email: EMAIL }
  it('uitnodigen zonder login: een nieuwe rij met alleen de hash van de token, 7 dagen geldig', async () => {
    const { admin, vragen } = db({ toegang: null, opEmail: [] })
    const uit = await beheerMedewerkerLogin(admin, GYM, MW, nodig, NU)
    if (uit.staat !== 'ok' || !uit.token) throw new Error('geen token')
    const insert = vragen.find((v) => v.actie === 'insert')?.waarde as Record<string, unknown>
    expect(insert).toMatchObject({ user_id: GYM, medewerker_id: MW, email: EMAIL, actief: true, uitnodiging_hash: tokenHash(uit.token), uitnodiging_verloopt_op: '2026-10-30T12:00:00.000Z' })
    expect(JSON.stringify(insert)).not.toContain(uit.token)
  })
  it('opnieuw uitnodigen: nieuwe token, dichtgelopen login weer open, wachtwoord en toestellen blijven', async () => {
    const { admin, vragen } = db({ toegang: { blokkades: 6 } })
    expect((await beheerMedewerkerLogin(admin, GYM, MW, nodig, NU)).staat).toBe('ok')
    const update = vragen.find((v) => v.actie === 'update')?.waarde as Record<string, unknown>
    expect(update).toMatchObject({ blokkades: 0, mislukt: 0, actief: true })
    expect(update).not.toHaveProperty('wachtwoord_hash')
    expect(vragen.some((v) => v.actie === 'delete')).toBe(false)
  })
  it('na intrekken opnieuw uitnodigen: het oude wachtwoord en de oude pincode vervallen', async () => {
    const { admin, vragen } = db({ toegang: { actief: false, pin_status: 'actief', pin_hash: 'a:b' }, opEmail: [] })
    expect((await beheerMedewerkerLogin(admin, GYM, MW, nodig, NU)).staat).toBe('ok')
    expect(vragen.find((v) => v.actie === 'update')?.waarde).toMatchObject({ wachtwoord_hash: null, pin_hash: null, pin_status: 'geen' })
  })
  it('een adres van een beheerder of van een andere medewerkerlogin: bezet, niets opgeslagen', async () => {
    const beheerder = db({ beheerder: true })
    expect((await beheerMedewerkerLogin(beheerder.admin, GYM, MW, nodig, NU)).staat).toBe('email_bezet')
    expect(beheerder.vragen.some((v) => v.actie !== 'select')).toBe(false)
    expect((await beheerMedewerkerLogin(db({ opEmail: [{ id: ANDER_ID }] }).admin, GYM, MW, nodig, NU)).staat).toBe('email_bezet')
    // Het eigen adres opnieuw gebruiken mag.
    expect((await beheerMedewerkerLogin(db({ opEmail: [{ id: TOEGANG_ID }] }).admin, GYM, MW, nodig, NU)).staat).toBe('ok')
    expect((await beheerMedewerkerLogin(db({ schrijf: { data: null, error: { message: 'dubbel', code: '23505' } } }).admin, GYM, MW, nodig, NU)).staat).toBe('email_bezet')
  })
  it('intrekken: login uit, adres en wachtwoord weg, alle toestellen uit', async () => {
    const { admin, vragen } = db()
    expect((await beheerMedewerkerLogin(admin, GYM, MW, { actie: 'intrekken' }, NU)).staat).toBe('ok')
    expect(vragen.find((v) => v.actie === 'update')?.waarde).toMatchObject({ actief: false, email: null, wachtwoord_hash: null, uitnodiging_hash: null, pin_hash: null })
    expect(vragen.some((v) => v.actie === 'delete' && v.tabel === 'club_medewerker_sessies' && heeftFilter(v, 'medewerker_id', MW) && heeftFilter(v, 'user_id', GYM))).toBe(true)
  })
  it('elke beheerquery op logins filtert op de eigen sportschool', async () => {
    for (const actie of [nodig, { actie: 'intrekken' as const }]) {
      const { admin, vragen } = db({ opEmail: [] })
      await beheerMedewerkerLogin(admin, GYM, MW, actie, NU)
      const eigen = vragen.filter((v) => v.tabel === 'club_medewerker_toegang' && !v.filters.some(([, k]) => k === 'email'))
      expect(eigen.length).toBeGreaterThan(0)
      expect(eigen.every((v) => heeftFilter(v, 'user_id', GYM))).toBe(true)
    }
  })
  it('een medewerker van een andere sportschool of uit dienst: niet gevonden', async () => {
    expect((await beheerMedewerkerLogin(db().admin, ANDERE_GYM, MW, nodig, NU)).staat).toBe('niet_gevonden')
    expect((await beheerMedewerkerLogin(db({ mens: { actief: false } }).admin, GYM, MW, nodig, NU)).staat).toBe('niet_gevonden')
    expect((await beheerMedewerkerLogin(db({ toegang: { actief: false } }).admin, GYM, MW, { actie: 'intrekken' }, NU)).staat).toBe('niet_gevonden')
  })
  it('het overzicht toont staat en adres, nooit een hash of token', async () => {
    const { admin } = nepSupabase(() => ({ data: [toegangRij(), toegangRij({ id: ANDER_ID, medewerker_id: ANDER_ID, ...OPEN })], error: null }))
    const lijst = await haalMedewerkerLogins(admin, GYM, NU)
    expect(lijst?.map((l) => l.staat)).toEqual(['actief', 'uitgenodigd'])
    expect(lijst?.[0]).toMatchObject({ email: EMAIL, gesloten: false })
    expect(JSON.stringify(lijst)).not.toContain('s2:')
  })
})
