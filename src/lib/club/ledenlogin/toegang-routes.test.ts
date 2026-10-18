// De poort van de ledenapp: de schakelaar, de voorvertoning voor Kane, het lid
// altijd uit de sessie (nooit uit body of vraag), tenant-scheiding, en de
// inlogroutes (404 zonder verraad, cookies, CSRF, zwakke pincode).

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
vi.mock('@/lib/lifeos/admin', () => ({ createLifeosAdminClient: () => db.admin }))

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const ANDER = 'be000000-0000-4000-8000-0000000000b2'
const SANNE_ID = '11111111-1111-4111-8111-111111111111'
const PIET_ID = '33333333-3333-4333-8333-333333333333'
const CODE = 'abcdefghijklmnopqrstuvwx'

const mocks = vi.hoisted(() => ({
  clubToegang: vi.fn(), haalEigenOrganisatie: vi.fn(), hostPastBij: vi.fn(), haalLid: vi.fn(),
  lidVanSessie: vi.fn(), vindLidToegang: vi.fn(), logInLid: vi.fn(), kiesLidPin: vi.fn(), boekLesVoorLid: vi.fn(),
}))
vi.mock('@/lib/club/toegang', async (orig) => ({
  ...(await orig<typeof import('@/lib/club/toegang')>()),
  clubToegang: mocks.clubToegang, haalEigenOrganisatie: mocks.haalEigenOrganisatie, hostPastBij: mocks.hostPastBij,
}))
vi.mock('@/lib/club/kern/lid', async (orig) => ({ ...(await orig<typeof import('@/lib/club/kern/lid')>()), haalLid: mocks.haalLid }))
vi.mock('./opslag', async (orig) => ({
  ...(await orig<typeof import('./opslag')>()),
  lidVanSessie: mocks.lidVanSessie, vindLidToegang: mocks.vindLidToegang, logInLid: mocks.logInLid, kiesLidPin: mocks.kiesLidPin,
}))
vi.mock('@/lib/club/app/acties-training', async (orig) => ({ ...(await orig<typeof import('@/lib/club/app/acties-training')>()), boekLesVoorLid: mocks.boekLesVoorLid }))

import { nepSupabase } from '@/lib/club/beheerders/nep-supabase'
db.admin = nepSupabase((v) => (v.tabel === 'club_vestigingen' ? { data: [{ vestiging: 'budel', naam: 'Budel', volgorde: 1, standaard: true }], error: null } : { data: null, error: null })).admin

import { lidToegang, vereisLidToegang } from './toegang'
import { lidApparaatCookie, lidCookie } from './regels'
import { LINK_WERKT_NIET } from './inlog-api'
import { POST as reserveer } from '@/app/api/club/lid/reserveringen/route'
import { POST as inloggen } from '@/app/api/club/lid/inloggen/route'
import { POST as kiesPin } from '@/app/api/club/lid/pin/route'

const ORG = {
  id: GYM, naam: 'Gym A', slogan: null, logo: null, kleurAccent: '#B58E5C', thema: 'donker', uit: [], demo: false, slug: 'gyma',
  instellingen: { ledenapp: { welkom: null, tabsUit: [], qr: true }, rechten: { manager: [] } },
}
const lid = (id: string, extra: Record<string, unknown> = {}) => ({
  id, vestiging: 'budel', voornaam: id === SANNE_ID ? 'Sanne' : 'Piet', achternaam: 'Jansen', status: 'actief', demo: false, lidnummer: null, sportivityId: null,
  email: null, telefoon: null, geboortedatum: null, geslacht: null, abonnement: null, lidSinds: null, einddatum: null, tags: [], coachId: null, ...extra,
})
const toegangRij = { id: '22222222-2222-4222-8222-222222222222', userId: GYM, lidId: SANNE_ID, code: CODE, codeGemaaktOp: new Date().toISOString(), actief: true, pinHash: 'x', mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null }

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
    mocks.clubToegang.mockResolvedValue({ admin: db.admin, userId: GYM, organisatie: ORG, isKane: true, vestigingen: [{ sleutel: 'budel', naam: 'Budel', standaard: true }], naam: 'Kane' })
    const l = await lidToegang(PIET_ID)
    expect(l?.lid.id).toBe(PIET_ID)
    expect(l?.voorvertoning).toBe(true)
  })
  it('een eigenaar of clubmanager is geen Kane: geen voorvertoning', async () => {
    stand.aan = false
    mocks.clubToegang.mockResolvedValue({ admin: db.admin, userId: GYM, organisatie: ORG, isKane: false, vestigingen: [], naam: 'X' })
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

describe('inloggen', () => {
  it('schakelaar uit: 404 zonder de link op te zoeken', async () => {
    stand.aan = false
    expect((await inloggen(req('/api/club/lid/inloggen', { code: CODE, pin: '482915' }))).status).toBe(404)
    expect(mocks.vindLidToegang).not.toHaveBeenCalled()
  })
  it('onbekende en verlopen link geven precies hetzelfde antwoord', async () => {
    mocks.vindLidToegang.mockResolvedValue(null)
    const a = await inloggen(req('/api/club/lid/inloggen', { code: CODE, pin: '482915' }))
    mocks.vindLidToegang.mockResolvedValue({ ...toegangRij, pinHash: null, codeGemaaktOp: '2020-01-01T00:00:00Z' })
    const b = await inloggen(req('/api/club/lid/inloggen', { code: CODE, pin: '482915' }))
    expect(a.status).toBe(404)
    expect(b.status).toBe(404)
    expect(await a.json()).toEqual({ fout: LINK_WERKT_NIET })
    expect(await b.json()).toEqual({ fout: LINK_WERKT_NIET })
  })
  it('goed: httpOnly-sessiecookie en de onthouden link', async () => {
    mocks.logInLid.mockResolvedValue({ staat: 'ok', sessie: { token: 'geheim', verlooptOp: new Date('2027-01-15T00:00:00Z') } })
    const r = (await inloggen(req('/api/club/lid/inloggen', { code: CODE, pin: '482915' }))) as NextResponse
    expect(r.status).toBe(200)
    expect(r.cookies.get(lidCookie())).toMatchObject({ value: 'geheim', httpOnly: true, sameSite: 'lax', path: '/' })
    expect(r.cookies.get(lidApparaatCookie())).toMatchObject({ value: CODE, httpOnly: true })
  })
  it('zonder code in de body: de onthouden link van dit toestel', async () => {
    mocks.logInLid.mockResolvedValue({ staat: 'fout', over: 3 })
    stand.cookies.clear()
    const r = await inloggen(new NextRequest('https://fitfactorypt.nl/api/club/lid/inloggen', { method: 'POST', body: JSON.stringify({ pin: '482915' }), headers: { ...zelf, cookie: `${lidApparaatCookie()}=${CODE}` } }))
    expect(r.status).toBe(401)
    expect(mocks.vindLidToegang).toHaveBeenCalledWith(expect.anything(), CODE)
  })
  it('van een andere site: 403', async () => {
    expect((await inloggen(req('/api/club/lid/inloggen', { code: CODE, pin: '482915' }, { 'sec-fetch-site': 'cross-site' }))).status).toBe(403)
  })
})

describe('pincode kiezen', () => {
  it('een te makkelijke pincode wordt geweigerd', async () => {
    mocks.vindLidToegang.mockResolvedValue({ ...toegangRij, pinHash: null })
    const r = await kiesPin(req('/api/club/lid/pin', { code: CODE, pin: '123456' }))
    expect(r.status).toBe(400)
    expect(mocks.kiesLidPin).not.toHaveBeenCalled()
  })
  it('een goede pincode: meteen ingelogd', async () => {
    mocks.vindLidToegang.mockResolvedValue({ ...toegangRij, pinHash: null })
    mocks.kiesLidPin.mockResolvedValue({ staat: 'ok', sessie: { token: 'nieuw', verlooptOp: new Date('2027-01-15T00:00:00Z') } })
    const r = (await kiesPin(req('/api/club/lid/pin', { code: CODE, pin: '482915' }))) as NextResponse
    expect(r.status).toBe(200)
    expect(r.cookies.get(lidCookie())?.value).toBe('nieuw')
  })
})

describe('tenant-scheiding', () => {
  it('een lid van een andere sportschool bestaat niet', async () => {
    mocks.lidVanSessie.mockResolvedValue({ toegang: { ...toegangRij, userId: ANDER }, tokenHash: 'h' })
    mocks.haalEigenOrganisatie.mockResolvedValue({ organisatie: { ...ORG, id: GYM }, eigenaarId: null })
    expect(await lidToegang(null)).toBeNull()
  })
})
