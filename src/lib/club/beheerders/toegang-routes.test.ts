// De poort van Club met de eigen login: de schakelaar, tenant-scheiding in
// clubToegang, de inlogroutes (404, cookie, rate limiting), de routes die
// alleen Kane of de eigenaar mag gebruiken, de rechten van de clubmanager en
// het subdomein per sportschool.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const stand = vi.hoisted(() => ({ aan: true, cookies: new Map<string, string>(), geremd: false, host: 'fitfactorypt.nl' }))
vi.mock('@/lib/club/beheerders/schakelaar', () => ({
  get CLUB_EIGEN_LOGIN() {
    return stand.aan
  },
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (naam: string) => (stand.cookies.has(naam) ? { value: stand.cookies.get(naam) } : undefined) }),
  headers: async () => new Headers({ host: stand.host }),
}))
vi.mock('react', async (orig) => ({ ...(await orig<typeof import('react')>()), cache: <T,>(f: T) => f }))
vi.mock('@/lib/utils/rate-limit', () => ({ isRateLimited: () => stand.geremd }))
vi.mock('@/lib/lifeos/admin', () => ({ createLifeosAdminClient: () => db.admin }))
const opslag = vi.hoisted(() => ({
  beheerderVanSessie: vi.fn(), vindBeheerder: vi.fn(), logInBeheerder: vi.fn(), kiesBeheerderPin: vi.fn(),
  haalBeheerders: vi.fn(), maakBeheerder: vi.fn(), beoordeelBeheerder: vi.fn(),
}))
vi.mock('@/lib/club/beheerders/beheerder-opslag', async (orig) => ({ ...(await orig<typeof import('./beheerder-opslag')>()), ...opslag }))

import { nepSupabase, type Vraag } from './nep-supabase'

const KANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const GYM_A = 'de000000-0000-4000-8000-0000000000c1'
const GYM_B = 'be000000-0000-4000-8000-0000000000b2'
const SANNE = {
  id: '11111111-1111-4111-8111-111111111111', organisatieId: GYM_A, naam: 'Sanne', email: null, rol: 'clubmanager', code: 'abcdefghijklmnopqrstuvwx',
  actief: true, pinStatus: 'actief', pinHash: 'x', mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null,
}
const SANNE_EIGENAAR = { ...SANNE, id: '22222222-2222-4222-8222-222222222222', rol: 'eigenaar' }
// De eigenaar gaf de rol Clubmanager alleen Leden.
const orgRij = (id: string, naam: string, slug: string) => ({
  id, naam, slug, slogan: null, logo: null, kleur_accent: '#B58E5C', thema: 'donker', modules: {}, demo: false, beheerder_id: KANE,
  instellingen: { rechten: { manager: ['leden'] } },
})

// Geen PT-beheerderslink (Kane is niet ingelogd); de organisaties wel.
const db = vi.hoisted(() => ({ admin: null as unknown }))
db.admin = nepSupabase((v: Vraag) => {
  if (v.tabel === 'pt_lead_links') return { data: null, error: null }
  if (v.tabel === 'club_organisaties') {
    const id = v.filters.find(([, k]) => k === 'id')?.[2]
    return { data: id === GYM_A ? orgRij(GYM_A, 'Gym A', 'gyma') : id === GYM_B ? orgRij(GYM_B, 'Gym B', 'gymb') : null, error: null }
  }
  return { data: [], error: null }
}).admin

import { clubToegang, vereisClubToegang } from '@/lib/club/toegang'
import { POST as inloggen } from '@/app/api/club/inloggen/[code]/route'
import { POST as kiesPin } from '@/app/api/club/inloggen/[code]/pin/route'
import { POST as wissel } from '@/app/api/club/organisatie/wissel/route'
import { POST as nieuweSportschool } from '@/app/api/club/organisatie/nieuw/route'
import { POST as nieuweBeheerder } from '@/app/api/club/beheerders/route'
import { PATCH as beoordeel } from '@/app/api/club/beheerders/[id]/route'
import { beheerderCookie } from './beheerder'

const BEHEERDER_COOKIE = beheerderCookie()

const zelf = { 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }
const req = (pad: string, body: unknown, koppen: Record<string, string> = zelf, method = 'POST') =>
  new NextRequest(`https://fitfactorypt.nl${pad}`, { method, body: JSON.stringify(body), headers: koppen })
const ctx = <T,>(p: T) => ({ params: Promise.resolve(p) })
const CODE = 'abcdefghijklmnopqrstuvwx'

beforeEach(() => {
  vi.clearAllMocks()
  stand.aan = true
  stand.geremd = false
  stand.host = 'fitfactorypt.nl'
  delete process.env.CLUB_SUBDOMEINEN_ACTIEF
  opslag.haalBeheerders.mockResolvedValue([])
  opslag.maakBeheerder.mockResolvedValue({ id: 'nieuw' })
  opslag.beoordeelBeheerder.mockResolvedValue('ok')
  stand.cookies = new Map([[BEHEERDER_COOKIE, 'token']])
  opslag.beheerderVanSessie.mockResolvedValue(SANNE)
  opslag.vindBeheerder.mockResolvedValue(SANNE)
})

describe('clubToegang voor een eigenaar of clubmanager', () => {
  it('ziet alleen de eigen sportschool, ook met de wissel-cookie van een andere', async () => {
    stand.cookies.set('club-org', GYM_B)
    const t = await clubToegang()
    expect(t?.userId).toBe(GYM_A)
    expect(t?.organisaties.map((o) => o.id)).toEqual([GYM_A])
    expect(t?.isKane).toBe(false)
    expect(t?.code).toBeNull()
  })
  it('schakelaar uit: niemand behalve Kane, ook niet met een geldige sessie', async () => {
    stand.aan = false
    expect(await clubToegang()).toBeNull()
    expect(opslag.beheerderVanSessie).not.toHaveBeenCalled()
  })
  it('zonder cookie of met een ongeldige sessie: geen toegang', async () => {
    opslag.beheerderVanSessie.mockResolvedValue(null)
    expect(await clubToegang()).toBeNull()
    stand.cookies.clear()
    expect(await clubToegang()).toBeNull()
  })
})

describe('de eigenaar beheert de eigen beheerders, nooit zichzelf', () => {
  beforeEach(() => {
    opslag.beheerderVanSessie.mockResolvedValue(SANNE_EIGENAAR)
  })
  it('zet een clubmanager klaar in de eigen sportschool', async () => {
    const r = await nieuweBeheerder(req('/api/club/beheerders', { naam: 'Tom', rol: 'clubmanager' }))
    expect(r.status).toBe(201)
    expect(opslag.maakBeheerder).toHaveBeenCalledWith(expect.anything(), GYM_A, { naam: 'Tom', email: null, rol: 'clubmanager' })
  })
  it('kan de eigen toegang niet stoppen of resetten', async () => {
    const r = await beoordeel(req(`/api/club/beheerders/${SANNE_EIGENAAR.id}`, { actie: 'stoppen' }, zelf, 'PATCH'), ctx({ id: SANNE_EIGENAAR.id }))
    expect(r.status).toBe(400)
    expect(opslag.beoordeelBeheerder).not.toHaveBeenCalled()
  })
  it('stopt een andere beheerder, altijd binnen de eigen sportschool', async () => {
    const r = await beoordeel(req(`/api/club/beheerders/${SANNE.id}`, { actie: 'stoppen' }, zelf, 'PATCH'), ctx({ id: SANNE.id }))
    expect(r.status).toBe(200)
    expect(opslag.beoordeelBeheerder).toHaveBeenCalledWith(expect.anything(), GYM_A, SANNE.id, { actie: 'stoppen', controle: null })
  })
  it('ziet alles van de eigen sportschool, maar wisselt of maakt geen sportscholen', async () => {
    expect((await clubToegang())?.onderdelen).toBeNull()
    expect((await wissel(req('/api/club/organisatie/wissel', { id: GYM_B }))).status).toBe(404)
    expect((await nieuweSportschool(req('/api/club/organisatie/nieuw', { naam: 'Gym C' }))).status).toBe(404)
  })
})

describe('de clubmanager ziet wat de eigenaar hem geeft', () => {
  it('de API van een toegestaan onderdeel wel, de rest is een 404', async () => {
    expect((await clubToegang())?.onderdelen).toEqual(['vandaag', 'leden'])
    expect(await vereisClubToegang(req('/api/club/leden', {}))).not.toBeInstanceOf(NextResponse)
    const dicht = await vereisClubToegang(req('/api/club/rooster', {}))
    expect(dicht).toBeInstanceOf(NextResponse)
    expect((dicht as NextResponse).status).toBe(404)
  })
})

describe('subdomein per sportschool', () => {
  beforeEach(() => {
    process.env.CLUB_SUBDOMEINEN_ACTIEF = '1'
  })
  it('op het eigen subdomein binnen, op dat van een andere sportschool niet', async () => {
    stand.host = 'gyma.aiyourgym.com'
    expect((await clubToegang())?.userId).toBe(GYM_A)
    stand.host = 'gymb.aiyourgym.com'
    expect(await clubToegang()).toBeNull()
  })
  it('de inloglink werkt alleen op het eigen subdomein', async () => {
    opslag.logInBeheerder.mockResolvedValue({ staat: 'fout', over: 4 })
    stand.host = 'gymb.aiyourgym.com'
    expect((await inloggen(req(`/api/club/inloggen/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(404)
    expect(opslag.logInBeheerder).not.toHaveBeenCalled()
    stand.host = 'gyma.aiyourgym.com'
    expect((await inloggen(req(`/api/club/inloggen/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(401)
  })
})

describe('alleen Kane: sportscholen wisselen en aanmaken; clubmanager ook geen beheerders', () => {
  it('een clubmanager krijgt overal een 404, niets wordt aangemaakt of gewisseld', async () => {
    const w = await wissel(req('/api/club/organisatie/wissel', { id: GYM_B }))
    expect(w.status).toBe(404)
    expect((w as NextResponse).cookies.get('club-org')).toBeUndefined()
    expect((await nieuweSportschool(req('/api/club/organisatie/nieuw', { naam: 'Gym C' }))).status).toBe(404)
    expect((await nieuweBeheerder(req('/api/club/beheerders', { naam: 'X', rol: 'eigenaar' }))).status).toBe(404)
    expect((await beoordeel(req(`/api/club/beheerders/${SANNE.id}`, { actie: 'goedkeuren' }, zelf, 'PATCH'), ctx({ id: SANNE.id }))).status).toBe(404)
  })
})

describe('inloggen', () => {
  it('schakelaar uit: 404, ook met een geldige link', async () => {
    stand.aan = false
    expect((await inloggen(req(`/api/club/inloggen/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(404)
    expect((await kiesPin(req(`/api/club/inloggen/${CODE}/pin`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(404)
    expect(opslag.vindBeheerder).not.toHaveBeenCalled()
  })
  it('onbekende link: 404 (verraadt niets)', async () => {
    opslag.vindBeheerder.mockResolvedValue(null)
    expect((await inloggen(req('/api/club/inloggen/onbekend', { pin: '482915' }), ctx({ code: 'onbekend' }))).status).toBe(404)
  })
  it('goed: httpOnly-cookie met het token', async () => {
    opslag.logInBeheerder.mockResolvedValue({ staat: 'ok', token: 'geheim', verlooptOp: new Date('2026-11-17T00:00:00Z') })
    const r = await inloggen(req(`/api/club/inloggen/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))
    expect(r.status).toBe(200)
    expect((r as NextResponse).cookies.get(BEHEERDER_COOKIE)).toMatchObject({ value: 'geheim', httpOnly: true, sameSite: 'lax', path: '/' })
  })
  it('te veel pogingen per IP: 429 zonder pincheck', async () => {
    stand.geremd = true
    expect((await inloggen(req(`/api/club/inloggen/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(429)
    expect(opslag.logInBeheerder).not.toHaveBeenCalled()
  })
  it('van een andere site: 403 zonder pincheck', async () => {
    const r = await inloggen(req(`/api/club/inloggen/${CODE}`, { pin: '482915' }, { 'sec-fetch-site': 'cross-site' }), ctx({ code: CODE }))
    expect(r.status).toBe(403)
    expect(opslag.logInBeheerder).not.toHaveBeenCalled()
  })
  it('pincode kiezen geeft de controlecode', async () => {
    opslag.kiesBeheerderPin.mockResolvedValue({ staat: 'ok', controle: '1234' })
    const r = await kiesPin(req(`/api/club/inloggen/${CODE}/pin`, { pin: '482915' }), ctx({ code: CODE }))
    expect(await r.json()).toEqual({ staat: 'wacht', controle: '1234' })
  })
})
