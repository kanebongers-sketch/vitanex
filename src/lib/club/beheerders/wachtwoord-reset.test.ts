// Wachtwoord vergeten voor een eigenaar of clubmanager: de aanvraag laat het
// wachtwoord en de toestellen met rust; pas de link vervangt het wachtwoord.

import { beforeEach, describe, expect, it, vi } from 'vitest'
const meld = vi.hoisted(() => vi.fn(async () => undefined))
vi.mock('@/lib/club/betrouwbaarheid/melden', () => ({ meldFout: meld }))

import { hashWachtwoord } from '@/lib/club/kern/wachtwoord'
import { BEHEERDER_CODE, RESET_MS, beheerderLinkPad, resetGrens, resetStaatOpen, type Beheerder } from './beheerder'
import { heeftOpenReset, kiesNieuwBeheerderWachtwoord, logInMetWachtwoord, vraagBeheerderReset } from './beheerder-opslag'
import { heeftFilter, nepSupabase, type Antwoord, type Vraag } from './nep-supabase'

const GYM_A = 'de000000-0000-4000-8000-0000000000c1'
const ID = '11111111-1111-4111-8111-111111111111'
const CODE = 'abcdefghijklmnopqrstuvwx'
const NU = new Date('2026-11-14T12:00:00Z')
const minutenTerug = (minuten: number) => new Date(NU.getTime() - minuten * 60_000).toISOString()

const beheerder = (extra: Partial<Beheerder> = {}): Beheerder => ({
  id: ID, organisatieId: GYM_A, naam: 'Sanne', email: 'sanne@gyma.nl', rol: 'eigenaar', code: CODE, actief: true,
  pinStatus: 'geen', pinHash: null, wachtwoordHash: 's2:oud', mislukt: 2, geblokkeerdTot: null, blokkades: 1, laatstIngelogdOp: null, ...extra,
})

const ok = (data: unknown): Antwoord => ({ data, error: null })
const eenRij: Antwoord = ok([{ id: ID }])
const veld = (v: Vraag) => v.waarde as Record<string, unknown>

beforeEach(() => meld.mockClear())

describe('staat er een aanvraag open (puur)', () => {
  it('de link werkt een uur', () => {
    expect(RESET_MS).toBe(60 * 60_000)
  })
  it('alleen met de markering en binnen het uur', () => {
    expect(resetStaatOpen({ pin_status: 'wacht', pin_aangevraagd_op: minutenTerug(1) }, NU)).toBe(true)
    expect(resetStaatOpen({ pin_status: 'wacht', pin_aangevraagd_op: minutenTerug(59) }, NU)).toBe(true)
    expect(resetStaatOpen({ pin_status: 'wacht', pin_aangevraagd_op: minutenTerug(61) }, NU)).toBe(false)
  })
  it('verlopen, zonder markering, zonder moment, in de toekomst of geen rij: nee', () => {
    expect(resetStaatOpen({ pin_status: 'wacht', pin_aangevraagd_op: minutenTerug(60) }, NU)).toBe(false)
    expect(resetStaatOpen({ pin_status: 'geen', pin_aangevraagd_op: minutenTerug(1) }, NU)).toBe(false)
    expect(resetStaatOpen({ pin_status: 'actief', pin_aangevraagd_op: minutenTerug(1) }, NU)).toBe(false)
    expect(resetStaatOpen({ pin_status: 'wacht', pin_aangevraagd_op: null }, NU)).toBe(false)
    expect(resetStaatOpen({ pin_status: 'wacht', pin_aangevraagd_op: 'geen datum' }, NU)).toBe(false)
    expect(resetStaatOpen({ pin_status: 'wacht', pin_aangevraagd_op: minutenTerug(-1) }, NU)).toBe(false)
    expect(resetStaatOpen(null, NU)).toBe(false)
    expect(resetStaatOpen([], NU)).toBe(false)
  })
  it('de grens voor de database ligt precies een uur terug', () => {
    expect(resetGrens(NU)).toBe(minutenTerug(60))
  })
  it('de link is de bestaande uitnodigingspagina', () => {
    expect(beheerderLinkPad(CODE)).toBe(`/clubinloggen/${CODE}`)
  })
})

describe('aanvragen: een verse code, verder verandert er niets', () => {
  it('nieuwe code met het moment van aanvragen; wachtwoord, tellers en toestellen blijven', async () => {
    // Arrange
    const { admin, vragen } = nepSupabase(() => eenRij)
    // Act
    const code = await vraagBeheerderReset(admin, beheerder(), NU)
    // Assert
    expect(code).toMatch(BEHEERDER_CODE)
    expect(code).not.toBe(CODE)
    expect(vragen).toHaveLength(1)
    expect(vragen[0]).toMatchObject({ tabel: 'club_beheerders', actie: 'update' })
    expect(veld(vragen[0])).toEqual({ code, pin_status: 'wacht', pin_aangevraagd_op: NU.toISOString() })
    expect(heeftFilter(vragen[0], 'id', ID)).toBe(true)
    expect(heeftFilter(vragen[0], 'actief', true)).toBe(true)
    expect(vragen[0].filters).toContainEqual(['not', 'wachtwoord_hash', 'is'])
    expect(vragen.some((v) => v.tabel === 'club_beheerder_sessies')).toBe(false)
  })
  it('elke aanvraag geeft een andere code (de vorige link vervalt)', async () => {
    const { admin } = nepSupabase(() => eenRij)
    expect(await vraagBeheerderReset(admin, beheerder(), NU)).not.toBe(await vraagBeheerderReset(admin, beheerder(), NU))
  })
  it('gestopt of nog zonder wachtwoord: niets, zonder de database', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await vraagBeheerderReset(admin, beheerder({ actief: false }), NU)).toBeNull()
    expect(await vraagBeheerderReset(admin, beheerder({ wachtwoordHash: null }), NU)).toBeNull()
    expect(vragen).toHaveLength(0)
  })
  it('een fout of geen rij geraakt: geen code', async () => {
    expect(await vraagBeheerderReset(nepSupabase(() => ({ data: null, error: { message: 'x' } })).admin, beheerder(), NU)).toBeNull()
    expect(await vraagBeheerderReset(nepSupabase(() => ok([])).admin, beheerder(), NU)).toBeNull()
  })
})

describe('de link openen', () => {
  it('open bij precies deze code en een geldige aanvraag', async () => {
    const { admin, vragen } = nepSupabase(() => ok({ pin_status: 'wacht', pin_aangevraagd_op: minutenTerug(20) }))
    expect(await heeftOpenReset(admin, beheerder(), NU)).toBe(true)
    expect(heeftFilter(vragen[0], 'id', ID)).toBe(true)
    expect(heeftFilter(vragen[0], 'code', CODE)).toBe(true)
  })
  it('een oude uitnodigingslink van iemand die al een wachtwoord heeft: dicht', async () => {
    expect(await heeftOpenReset(nepSupabase(() => ok({ pin_status: 'geen', pin_aangevraagd_op: null })).admin, beheerder(), NU)).toBe(false)
    expect(await heeftOpenReset(nepSupabase(() => ok(null)).admin, beheerder(), NU)).toBe(false)
    expect(await heeftOpenReset(nepSupabase(() => ({ data: null, error: { message: 'x' } })).admin, beheerder(), NU)).toBe(false)
  })
})

describe('met de link een nieuw wachtwoord kiezen', () => {
  it('vervangt het wachtwoord een keer, logt alle toestellen uit en start een sessie', async () => {
    const { admin, vragen } = nepSupabase((v) => (v.tabel === 'club_beheerders' && v.actie === 'update' ? eenRij : ok(null)))
    const uit = await kiesNieuwBeheerderWachtwoord(admin, beheerder(), 's2:nieuw', NU)
    expect(uit.staat).toBe('ok')
    const kies = vragen[0]
    expect(veld(kies)).toMatchObject({ wachtwoord_hash: 's2:nieuw', pin_status: 'geen', pin_aangevraagd_op: null, mislukt: 0, geblokkeerd_tot: null, blokkades: 0 })
    // Compare-and-set: alleen met deze code en een aanvraag die nog openstaat.
    expect(heeftFilter(kies, 'id', ID)).toBe(true)
    expect(heeftFilter(kies, 'code', CODE)).toBe(true)
    expect(heeftFilter(kies, 'pin_status', 'wacht')).toBe(true)
    expect(kies.filters).toContainEqual(['gt', 'pin_aangevraagd_op', resetGrens(NU)])
    const wis = vragen.findIndex((v) => v.tabel === 'club_beheerder_sessies' && v.actie === 'delete' && heeftFilter(v, 'beheerder_id', ID))
    const nieuw = vragen.findIndex((v) => v.tabel === 'club_beheerder_sessies' && v.actie === 'insert')
    expect(wis).toBeGreaterThan(0)
    expect(nieuw).toBeGreaterThan(wis)
  })
  it('aanvraag verlopen of link al gebruikt: niets, de toestellen blijven', async () => {
    const { admin, vragen } = nepSupabase(() => ok([]))
    expect(await kiesNieuwBeheerderWachtwoord(admin, beheerder(), 's2:nieuw', NU)).toEqual({ staat: 'al_gekozen' })
    expect(vragen.some((v) => v.tabel === 'club_beheerder_sessies')).toBe(false)
  })
  it('gestopt: niet, zonder de database', async () => {
    const { admin, vragen } = nepSupabase(() => eenRij)
    expect(await kiesNieuwBeheerderWachtwoord(admin, beheerder({ actief: false }), 's2:nieuw', NU)).toEqual({ staat: 'al_gekozen' })
    expect(vragen).toHaveLength(0)
  })
})

describe('gewoon inloggen sluit een openstaande aanvraag', () => {
  const WW = 'Blauwe-kat-rent-7'
  const SLUIT = { pin_status: 'geen', pin_aangevraagd_op: null }
  const isSluit = (v: Vraag) => v.tabel === 'club_beheerders' && v.actie === 'update' && JSON.stringify(v.waarde) === JSON.stringify(SLUIT)
  const db = (sluitFout = false) =>
    nepSupabase((v) => {
      if (sluitFout && isSluit(v)) return { data: null, error: { message: 'x' } }
      if (v.tabel === 'club_beheerder_sessies' && v.actie === 'select') return ok([])
      return eenRij
    })
  const met = async (extra: Partial<Beheerder>) => beheerder({ wachtwoordHash: await hashWachtwoord(WW), mislukt: 0, ...extra })

  it('na een goed wachtwoord vervalt de link: alleen de twee kolommen van de aanvraag', async () => {
    // Arrange
    const { admin, vragen } = db()
    // Act
    const uit = await logInMetWachtwoord(admin, await met({ pinStatus: 'wacht' }), WW, NU)
    // Assert
    expect(uit.staat).toBe('ok')
    const sluit = vragen.filter(isSluit)
    expect(sluit).toHaveLength(1)
    expect(heeftFilter(sluit[0], 'id', ID)).toBe(true)
    expect(heeftFilter(sluit[0], 'pin_status', 'wacht')).toBe(true)
    expect(meld).not.toHaveBeenCalled()
  })
  it('zonder openstaande aanvraag of met een fout wachtwoord: niets extra', async () => {
    const zonder = db()
    await logInMetWachtwoord(zonder.admin, await met({ pinStatus: 'geen' }), WW, NU)
    expect(zonder.vragen.some(isSluit)).toBe(false)
    const fout = db()
    await logInMetWachtwoord(fout.admin, await met({ pinStatus: 'wacht' }), 'Verkeerd-wachtwoord-9', NU)
    expect(fout.vragen.some(isSluit)).toBe(false)
  })
  it('sluiten mislukt: het inloggen gaat door, de fout gaat zonder persoonsgegevens naar de foutregistratie', async () => {
    const { admin } = db(true)
    const uit = await logInMetWachtwoord(admin, await met({ pinStatus: 'wacht' }), WW, NU)
    expect(uit.staat).toBe('ok')
    expect(meld).toHaveBeenCalledTimes(1)
    const melding = JSON.stringify(meld.mock.calls[0])
    expect(melding).toContain('/api/club/inloggen')
    for (const persoonlijk of ['sanne', ID, CODE]) expect(melding).not.toContain(persoonlijk)
  })
})
