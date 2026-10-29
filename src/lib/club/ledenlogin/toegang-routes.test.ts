// De poort van de ledenapp: de schakelaar, de voorvertoning voor Kane, het lid
// altijd uit de sessie (nooit uit body of vraag), tenant-scheiding, en de
// inlogroutes (404 zonder verraad, cookies, CSRF, zwakke pincode).

import { ALLE_PAKKETTEN } from '@/lib/club/kern/pakketten'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const stand = vi.hoisted(() => ({ aan: true, cookies: new Map<string, string>(), geremd: false }))
vi.mock('./schakelaar', () => ({
  get CLUB_LEDEN_LOGIN() {
    return stand.aan
  },
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (naam: string) => (stand.cookies.has(naam) ? { value: stand.cookies.get(naam) } : undefined) }),
  headers: async () => new Headers({ host: 'fitfactorypt.nl' }),
}))
vi.mock('react', async (orig) => ({ ...(await orig<typeof import('react')>()), cache: <T,>(f: T) => f }))
vi.mock('@/lib/utils/rate-limit', () => ({ isRateLimited: () => stand.geremd }))

const db = vi.hoisted(() => ({ admin: null as unknown }))
vi.mock('@/lib/club/kern/database', () => ({ clubDatabase: () => db.admin }))

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const ANDER = 'be000000-0000-4000-8000-0000000000b2'
const SANNE_ID = '11111111-1111-4111-8111-111111111111'
const PIET_ID = '33333333-3333-4333-8333-333333333333'
const CODE = 'abcdefghijklmnopqrstuvwx'

const mocks = vi.hoisted(() => ({
  clubToegang: vi.fn(), haalEigenOrganisatie: vi.fn(), hostPastBij: vi.fn(), haalLid: vi.fn(),
  lidVanSessie: vi.fn(), vindLidToegang: vi.fn(), boekLesVoorLid: vi.fn(), markeerMeldingenGelezen: vi.fn(),
  vindInlogKandidaten: vi.fn(), controleerWachtwoord: vi.fn(), maakSessie: vi.fn(), activeerLid: vi.fn(), kiesWachtwoordInApp: vi.fn(),
}))
vi.mock('@/lib/club/toegang', async (orig) => ({
  ...(await orig<typeof import('@/lib/club/toegang')>()),
  clubToegang: mocks.clubToegang, haalEigenOrganisatie: mocks.haalEigenOrganisatie, hostPastBij: mocks.hostPastBij, sessiePastBijAdres: mocks.hostPastBij,
}))
vi.mock('@/lib/club/kern/lid', async (orig) => ({ ...(await orig<typeof import('@/lib/club/kern/lid')>()), haalLid: mocks.haalLid }))
vi.mock('./opslag', async (orig) => ({
  ...(await orig<typeof import('./opslag')>()),
  lidVanSessie: mocks.lidVanSessie, vindLidToegang: mocks.vindLidToegang, vindInlogKandidaten: mocks.vindInlogKandidaten,
  controleerWachtwoord: mocks.controleerWachtwoord, maakSessie: mocks.maakSessie, activeerLid: mocks.activeerLid, kiesWachtwoordInApp: mocks.kiesWachtwoordInApp,
}))
vi.mock('@/lib/club/meldingen/opslag', async (orig) => ({ ...(await orig<typeof import('@/lib/club/meldingen/opslag')>()), markeerMeldingenGelezen: mocks.markeerMeldingenGelezen }))
vi.mock('@/lib/club/app/acties-training', async (orig) => ({ ...(await orig<typeof import('@/lib/club/app/acties-training')>()), boekLesVoorLid: mocks.boekLesVoorLid }))

import { nepSupabase } from '@/lib/club/beheerders/nep-supabase'
db.admin = nepSupabase((v) => (v.tabel === 'club_vestigingen' ? { data: [{ vestiging: 'budel', naam: 'Budel', volgorde: 1, standaard: true }], error: null } : { data: null, error: null })).admin

import { lidToegang, vereisLidToegang } from './toegang'
import { lidApparaatCookie, lidCookie } from './regels'
import { INLOG_FOUT, LINK_WERKT_NIET } from './inlog-api'
import { POST as reserveer } from '@/app/(aiyourgym)/api/club/lid/reserveringen/route'
import { POST as inloggen } from '@/app/(aiyourgym)/api/club/lid/inloggen/route'
import { POST as activeren } from '@/app/(aiyourgym)/api/club/lid/activeren/route'
import { POST as kiesWachtwoord } from '@/app/(aiyourgym)/api/club/lid/wachtwoord/route'
import { POST as meldingenGelezen } from '@/app/(aiyourgym)/api/club/lid/meldingen/gelezen/route'

const ORG = {
  id: GYM, naam: 'Gym A', slogan: null, logo: null, kleurAccent: '#B58E5C', thema: 'donker', uit: [], eigenUit: [], afgenomen: [...ALLE_PAKKETTEN], demo: false, slug: 'gyma',
  instellingen: { ledenapp: { welkom: null, tabsUit: [], qr: true }, rechten: { manager: [] } },
}
const lid = (id: string, extra: Record<string, unknown> = {}) => ({
  id, vestiging: 'budel', voornaam: id === SANNE_ID ? 'Sanne' : 'Piet', achternaam: 'Jansen', status: 'actief', demo: false, lidnummer: null, sportivityId: null,
  email: null, telefoon: null, geboortedatum: null, geslacht: null, abonnement: null, lidSinds: null, einddatum: null, tags: [], coachId: null, ...extra,
})
const toegangRij = {
  id: '22222222-2222-4222-8222-222222222222', userId: GYM, lidId: SANNE_ID, code: CODE, codeGemaaktOp: new Date().toISOString(), actief: true,
  email: 'sanne@voorbeeld.nl', wachtwoordHash: 's2:x', pinHash: null, codeGebruiktOp: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null,
}
const WW = 'Paars-fietsje-op-de-dijk-7'
const SESSIE = { token: 'geheim', verlooptOp: new Date('2027-01-15T00:00:00Z') }

const zelf = { 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }
const req = (pad: string, body: unknown, koppen: Record<string, string> = zelf, method = 'POST') =>
  new NextRequest(`https://fitfactorypt.nl${pad}`, { method, body: method === 'GET' ? undefined : JSON.stringify(body), headers: koppen })

beforeEach(() => {
  vi.clearAllMocks()
  stand.aan = true
  stand.geremd = false
  stand.cookies = new Map([[lidCookie(), 'token']])
  mocks.clubToegang.mockResolvedValue(null)
  mocks.lidVanSessie.mockResolvedValue({ toegang: toegangRij, tokenHash: 'h' })
  mocks.haalEigenOrganisatie.mockResolvedValue({ organisatie: ORG, eigenaarId: null })
  mocks.hostPastBij.mockResolvedValue(true)
  mocks.haalLid.mockImplementation(async (_a: unknown, userId: string, id: string) => (userId === GYM ? lid(id) : null))
  mocks.vindLidToegang.mockResolvedValue(toegangRij)
  mocks.vindInlogKandidaten.mockResolvedValue([toegangRij])
  mocks.controleerWachtwoord.mockResolvedValue({ staat: 'goed' })
  mocks.maakSessie.mockResolvedValue(SESSIE)
  mocks.boekLesVoorLid.mockResolvedValue(NextResponse.json({ ok: true }))
})

describe('lidToegang', () => {
  it('het lid komt uit de sessie, binnen de sportschool van de sessie', async () => {
    const l = await lidToegang(null)
    expect(l?.lid.id).toBe(SANNE_ID)
    expect(l?.userId).toBe(GYM)
    expect(l?.voorvertoning).toBe(false)
    expect(mocks.haalLid).toHaveBeenCalledWith(expect.anything(), GYM, SANNE_ID)
  })
  it('een gewoon lid kan niet met ?lid= of ?voor= als een ander lid binnenkomen', async () => {
    expect((await lidToegang(PIET_ID))?.lid.id).toBe(SANNE_ID)
    stand.cookies.clear()
    expect(await lidToegang(PIET_ID)).toBeNull()
  })
  it('een lid dat niet mag trainen, of een uitgezette ledenapp: geen toegang', async () => {
    mocks.haalLid.mockResolvedValue(lid(SANNE_ID, { status: 'gestopt' }))
    expect(await lidToegang(null)).toBeNull()
    mocks.haalLid.mockResolvedValue(lid(SANNE_ID))
    mocks.haalEigenOrganisatie.mockResolvedValue({ organisatie: { ...ORG, uit: ['app'] }, eigenaarId: null })
    expect(await lidToegang(null)).toBeNull()
  })
  it('op het subdomein van een andere sportschool telt de sessie niet', async () => {
    mocks.hostPastBij.mockResolvedValue(false)
    expect(await lidToegang(null)).toBeNull()
  })
  it('schakelaar uit: een ledensessie telt niet, Kane kijkt wel mee', async () => {
    stand.aan = false
    expect(await lidToegang(null)).toBeNull()
    expect(mocks.lidVanSessie).not.toHaveBeenCalled()
    mocks.clubToegang.mockResolvedValue({ admin: db.admin, userId: GYM, organisatie: ORG, isPlatformEigenaar: true, vestigingen: [{ sleutel: 'budel', naam: 'Budel', standaard: true }], naam: 'Kane' })
    const l = await lidToegang(PIET_ID)
    expect(l?.lid.id).toBe(PIET_ID)
    expect(l?.voorvertoning).toBe(true)
  })
  it('een eigenaar of clubmanager is geen Kane: geen voorvertoning', async () => {
    stand.aan = false
    mocks.clubToegang.mockResolvedValue({ admin: db.admin, userId: GYM, organisatie: ORG, isPlatformEigenaar: false, vestigingen: [], naam: 'X' })
    expect(await lidToegang(PIET_ID)).toBeNull()
  })
})

describe('leden-API', () => {
  it('een lidId in de body wordt genegeerd: boeken gebeurt voor het lid uit de sessie', async () => {
    const r = await reserveer(req('/api/club/lid/reserveringen', { lesId: '44444444-4444-4444-8444-444444444444', lidId: PIET_ID }))
    expect(r.status).toBe(200)
    expect(mocks.boekLesVoorLid).toHaveBeenCalledWith(expect.objectContaining({ userId: GYM }), expect.objectContaining({ id: SANNE_ID }), '44444444-4444-4444-8444-444444444444')
  })
  it('niemand binnen: gewone 404', async () => {
    stand.cookies.clear()
    expect((await reserveer(req('/api/club/lid/reserveringen', { lesId: 'x' }))).status).toBe(404)
  })
  it('van een andere site: 403 zonder iets te doen', async () => {
    const r = await reserveer(req('/api/club/lid/reserveringen', { lesId: 'x' }, { 'sec-fetch-site': 'cross-site' }))
    expect(r.status).toBe(403)
    expect(mocks.boekLesVoorLid).not.toHaveBeenCalled()
  })
  it('tabblad Lessen uit bij de sportschool: 404', async () => {
    mocks.haalEigenOrganisatie.mockResolvedValue({ organisatie: { ...ORG, uit: ['rooster'] }, eigenaarId: null })
    expect((await reserveer(req('/api/club/lid/reserveringen', { lesId: 'x' }))).status).toBe(404)
  })
  it('te veel verzoeken: 429', async () => {
    stand.geremd = true
    expect((await reserveer(req('/api/club/lid/reserveringen', { lesId: 'x' }))).status).toBe(429)
  })
  it('vereisLidToegang met de schakelaar uit en zonder Kane: 404', async () => {
    stand.aan = false
    const r = await vereisLidToegang(req(`/api/club/lid/ik?voor=${SANNE_ID}`, null, zelf, 'GET'))
    expect((r as NextResponse).status).toBe(404)
  })
})

describe('meldingen gelezen', () => {
  it('zet de meldingen van het lid uit de sessie op gelezen', async () => {
    mocks.markeerMeldingenGelezen.mockResolvedValue(true)
    const r = await meldingenGelezen(req(`/api/club/lid/meldingen/gelezen?voor=${PIET_ID}`, null))
    expect(r.status).toBe(200)
    expect(mocks.markeerMeldingenGelezen).toHaveBeenCalledWith(expect.anything(), GYM, SANNE_ID)
  })
  it('niemand binnen of van een andere site: niets gewijzigd', async () => {
    expect((await meldingenGelezen(req('/api/club/lid/meldingen/gelezen', null, { 'sec-fetch-site': 'cross-site' }))).status).toBe(403)
    stand.cookies.clear()
    expect((await meldingenGelezen(req('/api/club/lid/meldingen/gelezen', null))).status).toBe(404)
    expect(mocks.markeerMeldingenGelezen).not.toHaveBeenCalled()
  })
  it('in de voorvertoning van Kane verandert er niets voor het lid', async () => {
    stand.cookies.clear()
    mocks.clubToegang.mockResolvedValue({ admin: db.admin, userId: GYM, organisatie: ORG, isPlatformEigenaar: true, vestigingen: [{ sleutel: 'budel', naam: 'Budel', standaard: true }], naam: 'Kane' })
    const r = await meldingenGelezen(req(`/api/club/lid/meldingen/gelezen?voor=${PIET_ID}`, null))
    expect(r.status).toBe(200)
    expect(mocks.markeerMeldingenGelezen).not.toHaveBeenCalled()
  })
  it('een databasefout geeft een nette 500', async () => {
    mocks.markeerMeldingenGelezen.mockResolvedValue(false)
    expect((await meldingenGelezen(req('/api/club/lid/meldingen/gelezen', null))).status).toBe(500)
  })
})

describe('inloggen met e-mail en wachtwoord', () => {
  const inlog = (body: unknown, koppen: Record<string, string> = zelf) => inloggen(req('/api/club/lid/inloggen', body, koppen))
  it('schakelaar uit: 404 zonder iets op te zoeken', async () => {
    stand.aan = false
    expect((await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: WW })).status).toBe(404)
    expect(mocks.vindInlogKandidaten).not.toHaveBeenCalled()
  })
  it('van een andere site: 403; te veel pogingen: 429', async () => {
    expect((await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: WW }, { 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    stand.geremd = true
    expect((await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: WW })).status).toBe(429)
    expect(mocks.controleerWachtwoord).not.toHaveBeenCalled()
  })
  it('een pincode of een code werkt niet meer: alleen e-mail en wachtwoord', async () => {
    expect((await inlog({ code: CODE, pin: '482915' })).status).toBe(400)
    expect(mocks.vindLidToegang).not.toHaveBeenCalled()
    expect(mocks.vindInlogKandidaten).not.toHaveBeenCalled()
  })
  it('goed: httpOnly-sessiecookie, een oude onthouden link wordt gewist', async () => {
    const r = (await inlog({ email: ' Sanne@Voorbeeld.nl ', wachtwoord: WW })) as NextResponse
    expect(r.status).toBe(200)
    expect(mocks.vindInlogKandidaten).toHaveBeenCalledWith(expect.anything(), 'sanne@voorbeeld.nl', null)
    expect(mocks.maakSessie).toHaveBeenCalledWith(expect.anything(), toegangRij, expect.any(Date))
    expect(r.cookies.get(lidCookie())).toMatchObject({ value: 'geheim', httpOnly: true, sameSite: 'lax', path: '/' })
    expect(r.cookies.get(lidApparaatCookie())).toMatchObject({ value: '', maxAge: 0 })
  })
  it('onbekend adres en fout wachtwoord geven precies hetzelfde antwoord', async () => {
    mocks.vindInlogKandidaten.mockResolvedValue([])
    const a = await inlog({ email: 'onbekend@voorbeeld.nl', wachtwoord: WW })
    mocks.vindInlogKandidaten.mockResolvedValue([toegangRij])
    mocks.controleerWachtwoord.mockResolvedValue({ staat: 'fout', over: 3 })
    const b = await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: 'Fout-wachtwoord-123' })
    expect([a.status, b.status]).toEqual([401, 401])
    expect(await a.json()).toEqual({ fout: INLOG_FOUT })
    expect(await b.json()).toEqual({ fout: INLOG_FOUT })
    expect(mocks.maakSessie).not.toHaveBeenCalled()
  })
  it('een lid dat de app niet (meer) mag gebruiken komt er niet in, ook met het goede wachtwoord', async () => {
    mocks.haalLid.mockResolvedValue(lid(SANNE_ID, { status: 'gestopt' }))
    expect((await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: WW })).status).toBe(401)
    expect(mocks.controleerWachtwoord).not.toHaveBeenCalled()
  })
  it('op het subdomein van een andere sportschool bestaat het account niet', async () => {
    mocks.hostPastBij.mockResolvedValue(false)
    expect((await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: WW })).status).toBe(401)
    expect(mocks.controleerWachtwoord).not.toHaveBeenCalled()
  })
  it('lid bij twee sportscholen met dit wachtwoord: eerst kiezen, dan inloggen bij de gekozen', async () => {
    const tweede = { ...toegangRij, id: '55555555-5555-4555-8555-555555555555', userId: ANDER }
    mocks.vindInlogKandidaten.mockResolvedValue([toegangRij, tweede])
    mocks.haalEigenOrganisatie.mockImplementation(async (_a: unknown, id: string) => ({ organisatie: { ...ORG, id, naam: id === GYM ? 'Gym A' : 'Gym B' }, eigenaarId: null }))
    mocks.haalLid.mockImplementation(async (_a: unknown, _u: string, id: string) => lid(id))
    const r = await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: WW })
    expect(await r.json()).toEqual({ staat: 'kies', sportscholen: [{ id: GYM, naam: 'Gym A' }, { id: ANDER, naam: 'Gym B' }] })
    expect(mocks.maakSessie).not.toHaveBeenCalled()

    mocks.vindInlogKandidaten.mockResolvedValue([tweede])
    const k = await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: WW, sportschool: ANDER })
    expect(k.status).toBe(200)
    expect(mocks.vindInlogKandidaten).toHaveBeenLastCalledWith(expect.anything(), 'sanne@voorbeeld.nl', ANDER)
    expect(mocks.maakSessie).toHaveBeenCalledWith(expect.anything(), tweede, expect.any(Date))
  })
  it('blokkade en dicht account: een duidelijke melding', async () => {
    mocks.controleerWachtwoord.mockResolvedValue({ staat: 'geblokkeerd', totOp: '2026-10-23T12:15:00Z' })
    expect((await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: WW })).status).toBe(429)
    mocks.controleerWachtwoord.mockResolvedValue({ staat: 'dicht' })
    const r = await inlog({ email: 'sanne@voorbeeld.nl', wachtwoord: WW })
    expect(r.status).toBe(429)
    expect(((await r.json()) as { fout: string }).fout).toMatch(/nieuwe link/)
  })
})

describe('uitnodiging gebruiken (wachtwoord kiezen)', () => {
  const vers = { ...toegangRij, email: null, wachtwoordHash: null }
  const activeer = (body: unknown) => activeren(req('/api/club/lid/activeren', body))
  it('onbekende, gebruikte en verlopen link geven precies hetzelfde antwoord', async () => {
    mocks.vindLidToegang.mockResolvedValue(null)
    const a = await activeer({ code: CODE, email: 'sanne@voorbeeld.nl', wachtwoord: WW })
    mocks.vindLidToegang.mockResolvedValue({ ...vers, codeGebruiktOp: new Date().toISOString() })
    const b = await activeer({ code: CODE, email: 'sanne@voorbeeld.nl', wachtwoord: WW })
    mocks.vindLidToegang.mockResolvedValue({ ...vers, codeGemaaktOp: '2020-01-01T00:00:00Z' })
    const c = await activeer({ code: CODE, email: 'sanne@voorbeeld.nl', wachtwoord: WW })
    for (const r of [a, b, c]) {
      expect(r.status).toBe(404)
      expect(await r.json()).toEqual({ fout: LINK_WERKT_NIET })
    }
    expect(mocks.activeerLid).not.toHaveBeenCalled()
  })
  it('een zwak wachtwoord of een wachtwoord met de eigen naam wordt geweigerd', async () => {
    mocks.vindLidToegang.mockResolvedValue(vers)
    for (const wachtwoord of ['kort', 'wachtwoord12345678', 'SanneJansen-2026!', '123456']) {
      expect((await activeer({ code: CODE, email: 'sanne@voorbeeld.nl', wachtwoord })).status).toBe(400)
    }
    expect((await activeer({ code: CODE, email: 'geen-adres', wachtwoord: WW })).status).toBe(400)
    expect(mocks.activeerLid).not.toHaveBeenCalled()
  })
  it('goed: e-mailadres genormaliseerd, meteen ingelogd', async () => {
    mocks.vindLidToegang.mockResolvedValue(vers)
    mocks.activeerLid.mockResolvedValue({ staat: 'ok', sessie: SESSIE })
    const r = (await activeer({ code: CODE, email: ' Sanne@Voorbeeld.NL', wachtwoord: WW })) as NextResponse
    expect(r.status).toBe(200)
    expect(mocks.activeerLid).toHaveBeenCalledWith(expect.anything(), vers, 'sanne@voorbeeld.nl', WW, expect.any(Date))
    expect(r.cookies.get(lidCookie())?.value).toBe('geheim')
  })
  it('adres al in gebruik bij een ander lid: 409 met uitleg', async () => {
    mocks.vindLidToegang.mockResolvedValue(vers)
    mocks.activeerLid.mockResolvedValue({ staat: 'email_bezet' })
    expect((await activeer({ code: CODE, email: 'sanne@voorbeeld.nl', wachtwoord: WW })).status).toBe(409)
  })
  it('schakelaar uit of van een andere site: niets', async () => {
    expect((await activeren(req('/api/club/lid/activeren', { code: CODE }, { 'sec-fetch-site': 'cross-site' }))).status).toBe(403)
    stand.aan = false
    expect((await activeer({ code: CODE, email: 'sanne@voorbeeld.nl', wachtwoord: WW })).status).toBe(404)
    expect(mocks.vindLidToegang).not.toHaveBeenCalled()
  })
})

describe('wachtwoord kiezen in de app (oude pincode-sessie)', () => {
  const metPin = { ...toegangRij, wachtwoordHash: null, pinHash: 'x' }
  it('een lid met een pincode-sessie kiest een wachtwoord voor zijn eigen account', async () => {
    mocks.lidVanSessie.mockResolvedValue({ toegang: metPin, tokenHash: 'h' })
    mocks.kiesWachtwoordInApp.mockResolvedValue({ staat: 'ok' })
    const r = await kiesWachtwoord(req(`/api/club/lid/wachtwoord?voor=${PIET_ID}`, { email: 'sanne@voorbeeld.nl', wachtwoord: WW, lidId: PIET_ID }))
    expect(r.status).toBe(200)
    expect(mocks.kiesWachtwoordInApp).toHaveBeenCalledWith(expect.anything(), metPin, 'sanne@voorbeeld.nl', WW, expect.any(Date))
  })
  it('al een wachtwoord, voorvertoning of niemand binnen: niets', async () => {
    expect((await kiesWachtwoord(req('/api/club/lid/wachtwoord', { email: 'sanne@voorbeeld.nl', wachtwoord: WW }))).status).toBe(409)
    stand.cookies.clear()
    expect((await kiesWachtwoord(req('/api/club/lid/wachtwoord', { email: 'sanne@voorbeeld.nl', wachtwoord: WW }))).status).toBe(404)
    mocks.clubToegang.mockResolvedValue({ admin: db.admin, userId: GYM, organisatie: ORG, isPlatformEigenaar: true, vestigingen: [{ sleutel: 'budel', naam: 'Budel', standaard: true }], naam: 'Kane' })
    expect((await kiesWachtwoord(req(`/api/club/lid/wachtwoord?voor=${SANNE_ID}`, { email: 'sanne@voorbeeld.nl', wachtwoord: WW }))).status).toBe(403)
    expect(mocks.kiesWachtwoordInApp).not.toHaveBeenCalled()
  })
})

describe('tenant-scheiding', () => {
  it('een lid van een andere sportschool bestaat niet', async () => {
    mocks.lidVanSessie.mockResolvedValue({ toegang: { ...toegangRij, userId: ANDER }, tokenHash: 'h' })
    mocks.haalEigenOrganisatie.mockResolvedValue({ organisatie: { ...ORG, id: GYM }, eigenaarId: null })
    expect(await lidToegang(null)).toBeNull()
  })
})
