// De poort van Club met de eigen login: de schakelaar, tenant-scheiding in
// clubToegang, de inlogroutes (404, cookie, rate limiting) en de routes die
// alleen Kane mag gebruiken.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const stand = vi.hoisted(() => ({ aan: true, cookies: new Map<string, string>(), geremd: false }))
vi.mock('@/lib/club/beheerders/schakelaar', () => ({
  get CLUB_EIGEN_LOGIN() {
    return stand.aan
  },
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (naam: string) => (stand.cookies.has(naam) ? { value: stand.cookies.get(naam) } : undefined) }),
}))
vi.mock('react', async (orig) => ({ ...(await orig<typeof import('react')>()), cache: <T,>(f: T) => f }))
vi.mock('@/lib/utils/rate-limit', () => ({ isRateLimited: () => stand.geremd }))
vi.mock('@/lib/lifeos/admin', () => ({ createLifeosAdminClient: () => db.admin }))
const opslag = vi.hoisted(() => ({ beheerderVanSessie: vi.fn(), vindBeheerder: vi.fn(), logInBeheerder: vi.fn(), kiesBeheerderPin: vi.fn() }))
vi.mock('@/lib/club/beheerders/beheerder-opslag', async (orig) => ({ ...(await orig<typeof import('./beheerder-opslag')>()), ...opslag }))

import { nepSupabase, type Vraag } from './nep-supabase'

const KANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const GYM_A = 'de000000-0000-4000-8000-0000000000c1'
const GYM_B = 'be000000-0000-4000-8000-0000000000b2'
const SANNE = {
  id: '11111111-1111-4111-8111-111111111111', organisatieId: GYM_A, naam: 'Sanne', email: null, rol: 'clubmanager', code: 'abcdefghijklmnopqrstuvwx',
  actief: true, pinStatus: 'actief', pinHash: 'x', mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null,
}
const orgRij = (id: string, naam: string) => ({ id, naam, slogan: null, logo: null, kleur_accent: '#B58E5C', thema: 'donker', modules: {}, demo: false, beheerder_id: KANE })

// Geen PT-beheerderslink (Kane is niet ingelogd); de organisaties wel.
const db = vi.hoisted(() => ({ admin: null as unknown }))
db.admin = nepSupabase((v: Vraag) => {
  if (v.tabel === 'pt_lead_links') return { data: null, error: null }
  if (v.tabel === 'club_organisaties') {
    const id = v.filters.find(([, k]) => k === 'id')?.[2]
    return { data: id === GYM_A ? orgRij(GYM_A, 'Gym A') : id === GYM_B ? orgRij(GYM_B, 'Gym B') : null, error: null }
  }
  return { data: [], error: null }
}).admin

import { clubToegang } from '@/lib/club/toegang'
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

describe('alleen Kane: sportscholen wisselen, aanmaken en beheerders', () => {
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
