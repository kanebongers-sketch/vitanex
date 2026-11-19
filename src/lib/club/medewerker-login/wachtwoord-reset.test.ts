// Wachtwoord vergeten voor een medewerker: een verse eenmalige link naast het
// bestaande wachtwoord. De aanvraag raakt het wachtwoord, de toestellen en de
// tellers van de rem niet.

import { beforeEach, describe, expect, it, vi } from 'vitest'
const meld = vi.hoisted(() => vi.fn(async () => undefined))
vi.mock('@/lib/club/betrouwbaarheid/melden', () => ({ meldFout: meld }))

import { tokenHash } from '@/lib/club/kern/pin'
import { hashWachtwoord } from '@/lib/club/kern/wachtwoord'
import { heeftFilter, nepSupabase, type Antwoord, type Vraag } from '@/lib/club/beheerders/nep-supabase'
import { kiesWachtwoord, logInMedewerkerMetWachtwoord, vraagMedewerkerReset } from './opslag'
import { UITNODIGING_TOKEN, medewerkerMetOrgUitRij, toegangUitRij, type MedewerkerMetOrg, type MedewerkerToegang } from './medewerker-login'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const MW = '33333333-3333-4333-8333-333333333333'
const TOEGANG_ID = '44444444-4444-4444-8444-444444444444'
const NU = new Date('2026-11-14T12:00:00Z')
const HASH = `s2:16384:8:1:${'a'.repeat(32)}:${'b'.repeat(64)}`

const toegang = (extra: Record<string, unknown> = {}) =>
  toegangUitRij({
    id: TOEGANG_ID, user_id: GYM, medewerker_id: MW, code: 'abcdefghijklmnopqrstuvwx', actief: true, email: 'lotte@gym.nl', pin_hash: null, pin_status: 'geen',
    wachtwoord_hash: HASH, uitnodiging_verloopt_op: null, mislukt: 3, geblokkeerd_tot: null, blokkades: 2, laatst_ingelogd_op: null, ...extra,
  }) as MedewerkerToegang
const mens = (extra: Record<string, unknown> = {}) =>
  medewerkerMetOrgUitRij({ id: MW, user_id: GYM, naam: 'Lotte de Vries', email: null, rollen: ['trainer'], vestigingen: ['budel'], actief: true, ...extra }) as MedewerkerMetOrg

const ok = (data: unknown): Antwoord => ({ data, error: null })
const eenRij: Antwoord = ok([{ id: TOEGANG_ID }])
const veld = (v: Vraag) => v.waarde as Record<string, unknown>

describe('wachtwoord vergeten: een verse link voor een medewerker', () => {
  it('slaat alleen de hash van een nieuw token op, een uur geldig (een uitnodiging blijft 7 dagen)', async () => {
    // Arrange
    const { admin, vragen } = nepSupabase(() => eenRij)
    // Act
    const token = await vraagMedewerkerReset(admin, { toegang: toegang(), medewerker: mens() }, NU)
    // Assert
    expect(token).toMatch(UITNODIGING_TOKEN)
    expect(vragen).toHaveLength(1)
    expect(vragen[0]).toMatchObject({ tabel: 'club_medewerker_toegang', actie: 'update' })
    expect(veld(vragen[0])).toEqual({
      uitnodiging_hash: tokenHash(token as string),
      uitnodiging_verloopt_op: new Date(NU.getTime() + 60 * 60_000).toISOString(),
      gewijzigd_op: NU.toISOString(),
    })
    expect(JSON.stringify(vragen[0].waarde)).not.toContain(token as string)
  })
  it('laat het wachtwoord, de tellers van de rem en de toestellen met rust', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    await vraagMedewerkerReset(admin, { toegang: toegang(), medewerker: mens() }, NU)
    for (const kolom of ['wachtwoord_hash', 'mislukt', 'geblokkeerd_tot', 'blokkades', 'actief', 'email']) expect(veld(vragen[0]), kolom).not.toHaveProperty(kolom)
    expect(vragen.some((v) => v.tabel === 'club_medewerker_sessies')).toBe(false)
  })
  it('blijft binnen de eigen login en sportschool, en alleen zolang er een wachtwoord is', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    await vraagMedewerkerReset(admin, { toegang: toegang(), medewerker: mens() }, NU)
    expect(heeftFilter(vragen[0], 'id', TOEGANG_ID)).toBe(true)
    expect(heeftFilter(vragen[0], 'user_id', GYM)).toBe(true)
    expect(heeftFilter(vragen[0], 'actief', true)).toBe(true)
    expect(vragen[0].filters).toContainEqual(['not', 'wachtwoord_hash', 'is'])
  })
  it('zonder wachtwoord, ingetrokken, uit dienst of zonder rol: niets, zonder de database', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await vraagMedewerkerReset(admin, { toegang: toegang({ wachtwoord_hash: null }), medewerker: mens() }, NU)).toBeNull()
    expect(await vraagMedewerkerReset(admin, { toegang: toegang({ actief: false }), medewerker: mens() }, NU)).toBeNull()
    expect(await vraagMedewerkerReset(admin, { toegang: toegang({ email: null }), medewerker: mens() }, NU)).toBeNull()
    expect(await vraagMedewerkerReset(admin, { toegang: toegang(), medewerker: mens({ actief: false }) }, NU)).toBeNull()
    expect(await vraagMedewerkerReset(admin, { toegang: toegang(), medewerker: mens({ rollen: [] }) }, NU)).toBeNull()
    expect(vragen).toHaveLength(0)
  })
  it('een fout of geen rij geraakt: geen token', async () => {
    const paar = { toegang: toegang(), medewerker: mens() }
    expect(await vraagMedewerkerReset(nepSupabase(() => ({ data: null, error: { message: 'x' } })).admin, paar, NU)).toBeNull()
    expect(await vraagMedewerkerReset(nepSupabase(() => ok([])).admin, paar, NU)).toBeNull()
  })
})

beforeEach(() => meld.mockClear())

const WW = 'paars-fietsen-langs-de-dijk'
const OPEN = { uitnodiging_verloopt_op: new Date(NU.getTime() + 30 * 60_000).toISOString() }

describe('met de link een nieuw wachtwoord kiezen: andere toestellen gaan uit', () => {
  const TOKEN = 'T'.repeat(43)
  const wisAlles = (v: Vraag) => v.tabel === 'club_medewerker_sessies' && v.actie === 'delete' && heeftFilter(v, 'user_id', GYM) && heeftFilter(v, 'medewerker_id', MW)
  const db = (wisFout = false) =>
    nepSupabase((v) => {
      if (v.tabel === 'club_beheerders') return ok([])
      if (wisFout && wisAlles(v)) return { data: null, error: { message: 'x' } }
      if (v.tabel === 'club_medewerker_sessies' && v.actie === 'select') return ok([])
      return eenRij
    })

  it('na het nieuwe wachtwoord eerst alle sessies van deze medewerker weg, dan een sessie voor dit toestel', async () => {
    // Arrange
    const { admin, vragen } = db()
    // Act
    const uit = await kiesWachtwoord(admin, { toegang: toegang(OPEN), medewerker: mens() }, TOKEN, WW, NU)
    // Assert
    expect(uit.staat).toBe('ok')
    const kies = vragen.findIndex((v) => v.tabel === 'club_medewerker_toegang' && v.actie === 'update')
    const wis = vragen.findIndex(wisAlles)
    const nieuw = vragen.findIndex((v) => v.tabel === 'club_medewerker_sessies' && v.actie === 'insert')
    expect(kies).toBeGreaterThanOrEqual(0)
    expect(wis).toBeGreaterThan(kies)
    expect(nieuw).toBeGreaterThan(wis)
  })
  it('wissen mislukt: een databasefout en geen nieuwe sessie', async () => {
    const { admin, vragen } = db(true)
    expect(await kiesWachtwoord(admin, { toegang: toegang(OPEN), medewerker: mens() }, TOKEN, WW, NU)).toEqual({ staat: 'db' })
    expect(vragen.some((v) => v.tabel === 'club_medewerker_sessies' && v.actie === 'insert')).toBe(false)
  })
})

describe('gewoon inloggen sluit een openstaande link', () => {
  const LEEG = { uitnodiging_hash: null, uitnodiging_verloopt_op: null }
  const isSluit = (v: Vraag) => v.tabel === 'club_medewerker_toegang' && v.actie === 'update' && JSON.stringify(v.waarde) === JSON.stringify(LEEG)
  const db = (sluitFout = false) =>
    nepSupabase((v) => {
      if (sluitFout && isSluit(v)) return { data: null, error: { message: 'x' } }
      if (v.tabel === 'club_medewerker_sessies' && v.actie === 'select') return ok([])
      return eenRij
    })
  const met = async (extra: Record<string, unknown> = {}) => toegang({ wachtwoord_hash: await hashWachtwoord(WW), mislukt: 0, ...extra })

  it('na een goed wachtwoord vervalt de link, alleen bij een login met wachtwoord', async () => {
    // Arrange
    const { admin, vragen } = db()
    // Act
    const uit = await logInMedewerkerMetWachtwoord(admin, { toegang: await met(OPEN), medewerker: mens() }, WW, NU)
    // Assert
    expect(uit.staat).toBe('ok')
    const sluit = vragen.filter(isSluit)
    expect(sluit).toHaveLength(1)
    expect(heeftFilter(sluit[0], 'id', TOEGANG_ID)).toBe(true)
    expect(heeftFilter(sluit[0], 'user_id', GYM)).toBe(true)
    expect(sluit[0].filters).toContainEqual(['not', 'wachtwoord_hash', 'is'])
    expect(meld).not.toHaveBeenCalled()
  })
  it('zonder openstaande link of met een fout wachtwoord: niets extra', async () => {
    const zonder = db()
    await logInMedewerkerMetWachtwoord(zonder.admin, { toegang: await met(), medewerker: mens() }, WW, NU)
    expect(zonder.vragen.some(isSluit)).toBe(false)
    const fout = db()
    await logInMedewerkerMetWachtwoord(fout.admin, { toegang: await met(OPEN), medewerker: mens() }, 'Verkeerd-wachtwoord-9', NU)
    expect(fout.vragen.some(isSluit)).toBe(false)
  })
  it('sluiten mislukt: het inloggen gaat door, de fout gaat zonder persoonsgegevens naar de foutregistratie', async () => {
    const { admin } = db(true)
    const uit = await logInMedewerkerMetWachtwoord(admin, { toegang: await met(OPEN), medewerker: mens() }, WW, NU)
    expect(uit.staat).toBe('ok')
    expect(meld).toHaveBeenCalledTimes(1)
    const melding = JSON.stringify(meld.mock.calls[0])
    expect(melding).toContain('/api/club/inloggen')
    for (const persoonlijk of ['lotte', TOEGANG_ID, MW, GYM]) expect(melding).not.toContain(persoonlijk)
  })
})
