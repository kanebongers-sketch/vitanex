// De poort van Club voor medewerkers: schakelaar, tenant- en vestigingscheiding
// in clubToegang, de API-poort, het subdomein, de inlogroutes en het beheer van
// inloglinks (alleen eigenaar of clubmanager, nooit een medewerker).

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
const beheer = vi.hoisted(() => ({ beheerderVanSessie: vi.fn() }))
vi.mock('@/lib/club/beheerders/beheerder-opslag', async (orig) => ({ ...(await orig<typeof import('@/lib/club/beheerders/beheerder-opslag')>()), ...beheer }))
const opslag = vi.hoisted(() => ({ medewerkerVanSessie: vi.fn(), vindMedewerkerLink: vi.fn(), logInMedewerker: vi.fn(), kiesMedewerkerPin: vi.fn(), beheerMedewerkerLogin: vi.fn() }))
vi.mock('./opslag', async (orig) => ({ ...(await orig<typeof import('./opslag')>()), ...opslag }))

import { nepSupabase, type Vraag } from '@/lib/club/beheerders/nep-supabase'

const KANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const GYM_A = 'de000000-0000-4000-8000-0000000000c1'
const GYM_B = 'be000000-0000-4000-8000-0000000000b2'
const MW = '33333333-3333-4333-8333-333333333333'
const CODE = 'abcdefghijklmnopqrstuvwx'
const LOTTE = {
  toegang: { id: '44444444-4444-4444-8444-444444444444', userId: GYM_A, medewerkerId: MW, code: CODE, actief: true, pinStatus: 'actief', pinHash: 'x', mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null },
  medewerker: { id: MW, userId: GYM_A, naam: 'Lotte de Vries', email: null, rollen: ['instructeur'], vestigingen: ['eersel'], actief: true },
}
const SANNE = {
  id: '11111111-1111-4111-8111-111111111111', organisatieId: GYM_A, naam: 'Sanne', email: null, rol: 'clubmanager', code: 'zyxwvutsrqponmlkjihgfedc',
  actief: true, pinStatus: 'actief', pinHash: 'x', mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null,
}
// De eigenaar gaf de rol Groepslesinstructeur het rooster en (per ongeluk) Beheer.
const orgRij = (id: string, slug: string) => ({
  id, naam: `Gym ${slug}`, slug, slogan: null, logo: null, kleur_accent: '#B58E5C', thema: 'donker', modules: {}, demo: false, beheerder_id: KANE,
  instellingen: { rechten: { instructeur: ['rooster', 'beheer', 'instellingen'], manager: ['instellingen'] } },
})
const logboek: Vraag[] = []

const db = vi.hoisted(() => ({ admin: null as unknown }))
db.admin = nepSupabase((v: Vraag) => {
  if (v.tabel === 'pt_lead_links') return { data: null, error: null }
  if (v.tabel === 'club_organisaties') {
    const id = v.filters.find(([, k]) => k === 'id')?.[2]
    return { data: id === GYM_A ? orgRij(GYM_A, 'gyma') : id === GYM_B ? orgRij(GYM_B, 'gymb') : null, error: null }
  }
  if (v.tabel === 'club_vestigingen') {
    return { data: [{ vestiging: 'budel', naam: 'Budel', volgorde: 1, standaard: true }, { vestiging: 'eersel', naam: 'Eersel', volgorde: 2, standaard: false }], error: null }
  }
  if (v.tabel === 'club_medewerkers') return { data: { naam: 'Lotte de Vries', vestigingen: ['eersel'] }, error: null }
  if (v.tabel === 'club_logboek') logboek.push(v)
  return { data: [], error: null }
}).admin

import { clubToegang, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { POST as inloggen } from '@/app/api/club/inloggen/medewerker/[code]/route'
import { POST as kiesPin } from '@/app/api/club/inloggen/medewerker/[code]/pin/route'
import { PATCH as beheerLink } from '@/app/api/club/medewerker-toegang/[id]/route'
import { POST as uitloggen } from '@/app/api/club/uitloggen/route'
import { beheerderCookie } from '@/lib/club/beheerders/beheerder'
import { medewerkerCookie } from './medewerker-login'

const MW_COOKIE = medewerkerCookie()
const zelf = { 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }
const req = (pad: string, body: unknown, koppen: Record<string, string> = zelf, method = 'POST') =>
  new NextRequest(`https://fitfactorypt.nl${pad}`, { method, body: method === 'GET' ? undefined : JSON.stringify(body), headers: koppen })
const ctx = <T,>(p: T) => ({ params: Promise.resolve(p) })

beforeEach(() => {
  vi.clearAllMocks()
  logboek.length = 0
  stand.aan = true
  stand.geremd = false
  stand.host = 'fitfactorypt.nl'
  delete process.env.CLUB_SUBDOMEINEN_ACTIEF
  stand.cookies = new Map([[MW_COOKIE, 'token']])
  beheer.beheerderVanSessie.mockResolvedValue(null)
  opslag.medewerkerVanSessie.mockResolvedValue(LOTTE)
  opslag.vindMedewerkerLink.mockResolvedValue(LOTTE)
  opslag.beheerMedewerkerLogin.mockResolvedValue('ok')
})

describe('clubToegang voor een medewerker', () => {
  it('alleen de eigen sportschool, de eigen vestigingen en de rechten van de rol', async () => {
    stand.cookies.set('club-org', GYM_B)
    const t = await clubToegang()
    expect(t).toMatchObject({ userId: GYM_A, rol: 'medewerker', isKane: false, persoonId: MW, code: null, naam: 'Lotte de Vries' })
    expect(t?.organisaties.map((o) => o.id)).toEqual([GYM_A])
    expect(t?.vestigingen.map((v) => v.sleutel)).toEqual(['eersel'])
    // Beheer valt eraf, ook al vinkte de eigenaar het aan.
    expect(t?.onderdelen).toEqual(['vandaag', 'rooster', 'instellingen'])
  })
  it('schakelaar uit: een medewerkersessie telt niet', async () => {
    stand.aan = false
    expect(await clubToegang()).toBeNull()
    expect(opslag.medewerkerVanSessie).not.toHaveBeenCalled()
  })
  it('zonder cookie of met een ongeldige sessie: geen toegang', async () => {
    opslag.medewerkerVanSessie.mockResolvedValue(null)
    expect(await clubToegang()).toBeNull()
    stand.cookies.clear()
    expect(await clubToegang()).toBeNull()
  })
  it('een beheerdersessie gaat voor', async () => {
    stand.cookies.set(beheerderCookie(), 'b-token')
    beheer.beheerderVanSessie.mockResolvedValue(SANNE)
    expect((await clubToegang())?.rol).toBe('clubmanager')
  })
  it('het logboek krijgt de naam van de medewerker', async () => {
    const t = await clubToegang()
    if (!t) throw new Error('geen toegang')
    await logActie(t, 'Les aangemaakt', null, 'eersel')
    expect(logboek[0]?.waarde).toMatchObject({ user_id: GYM_A, wie: 'Lotte de Vries' })
  })
})

describe('de API-poort voor een medewerker', () => {
  it('onderdelen van zijn rol wel, de rest een 404', async () => {
    expect(await vereisClubToegang(req('/api/club/rooster', {}))).not.toBeInstanceOf(NextResponse)
    expect(((await vereisClubToegang(req('/api/club/leden', {}))) as NextResponse).status).toBe(404)
    expect(((await vereisClubToegang(req('/api/club/organisatie/instellingen', {}))) as NextResponse).status).toBe(404)
  })
  it('vestigingen wijzigen en inloglinks beheren: 404, ook met Instellingen', async () => {
    expect(((await vereisClubToegang(req('/api/club/vestigingen', {}))) as NextResponse).status).toBe(404)
    const r = await beheerLink(req(`/api/club/medewerker-toegang/${MW}`, { actie: 'maken' }, zelf, 'PATCH'), ctx({ id: MW }))
    expect(r.status).toBe(404)
    expect(opslag.beheerMedewerkerLogin).not.toHaveBeenCalled()
  })
})

describe('inloglinks beheren door de clubmanager', () => {
  beforeEach(() => {
    stand.cookies = new Map([[beheerderCookie(), 'b-token']])
    beheer.beheerderVanSessie.mockResolvedValue(SANNE)
  })
  it('maakt een link binnen de eigen sportschool en logt het', async () => {
    const r = await beheerLink(req(`/api/club/medewerker-toegang/${MW}`, { actie: 'maken' }, zelf, 'PATCH'), ctx({ id: MW }))
    expect(r.status).toBe(200)
    expect(opslag.beheerMedewerkerLogin).toHaveBeenCalledWith(expect.anything(), GYM_A, MW, { actie: 'maken', controle: null }, expect.any(Date))
    expect(logboek[0]?.waarde).toMatchObject({ actie: 'Inloglink medewerker gemaakt', onderwerp: 'Lotte de Vries' })
  })
  it('foute controlecode: 400; kapot id: 404', async () => {
    opslag.beheerMedewerkerLogin.mockResolvedValue('controle_fout')
    expect((await beheerLink(req(`/api/club/medewerker-toegang/${MW}`, { actie: 'goedkeuren', controle: '1234' }, zelf, 'PATCH'), ctx({ id: MW }))).status).toBe(400)
    expect((await beheerLink(req('/api/club/medewerker-toegang/x', { actie: 'maken' }, zelf, 'PATCH'), ctx({ id: 'x' }))).status).toBe(404)
  })
})

describe('subdomein per sportschool', () => {
  beforeEach(() => {
    process.env.CLUB_SUBDOMEINEN_ACTIEF = '1'
  })
  it('sessie alleen geldig op het eigen subdomein', async () => {
    stand.host = 'gyma.aiyourgym.com'
    expect((await clubToegang())?.userId).toBe(GYM_A)
    stand.host = 'gymb.aiyourgym.com'
    expect(await clubToegang()).toBeNull()
  })
  it('de inloglink werkt alleen op het eigen subdomein', async () => {
    opslag.logInMedewerker.mockResolvedValue({ staat: 'fout', over: 4 })
    stand.host = 'gymb.aiyourgym.com'
    expect((await inloggen(req(`/api/club/inloggen/medewerker/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(404)
    expect(opslag.logInMedewerker).not.toHaveBeenCalled()
    stand.host = 'gyma.aiyourgym.com'
    expect((await inloggen(req(`/api/club/inloggen/medewerker/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(401)
  })
})

describe('inloggen als medewerker', () => {
  it('schakelaar uit: 404, ook met een geldige link', async () => {
    stand.aan = false
    expect((await inloggen(req(`/api/club/inloggen/medewerker/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(404)
    expect((await kiesPin(req(`/api/club/inloggen/medewerker/${CODE}/pin`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(404)
    expect(opslag.vindMedewerkerLink).not.toHaveBeenCalled()
  })
  it('onbekende link: 404', async () => {
    opslag.vindMedewerkerLink.mockResolvedValue(null)
    expect((await inloggen(req('/api/club/inloggen/medewerker/onbekend', { pin: '482915' }), ctx({ code: 'onbekend' }))).status).toBe(404)
  })
  it('goed: httpOnly-cookie van de medewerker', async () => {
    opslag.logInMedewerker.mockResolvedValue({ staat: 'ok', token: 'geheim', verlooptOp: new Date('2026-11-17T00:00:00Z') })
    const r = await inloggen(req(`/api/club/inloggen/medewerker/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))
    expect(r.status).toBe(200)
    expect((r as NextResponse).cookies.get(MW_COOKIE)).toMatchObject({ value: 'geheim', httpOnly: true, sameSite: 'lax', path: '/' })
  })
  it('te veel pogingen per IP of van een andere site: geen pincheck', async () => {
    stand.geremd = true
    expect((await inloggen(req(`/api/club/inloggen/medewerker/${CODE}`, { pin: '482915' }), ctx({ code: CODE }))).status).toBe(429)
    stand.geremd = false
    expect((await inloggen(req(`/api/club/inloggen/medewerker/${CODE}`, { pin: '482915' }, { 'sec-fetch-site': 'cross-site' }), ctx({ code: CODE }))).status).toBe(403)
    expect(opslag.logInMedewerker).not.toHaveBeenCalled()
  })
  it('pincode kiezen geeft de controlecode voor de leidinggevende', async () => {
    opslag.kiesMedewerkerPin.mockResolvedValue({ staat: 'ok', controle: '0420' })
    const r = await kiesPin(req(`/api/club/inloggen/medewerker/${CODE}/pin`, { pin: '482915' }), ctx({ code: CODE }))
    expect(await r.json()).toEqual({ staat: 'wacht', controle: '0420' })
  })
  it('uitloggen wist ook de medewerkercookie', async () => {
    const r = await uitloggen(new NextRequest('https://fitfactorypt.nl/api/club/uitloggen', { method: 'POST', headers: { ...zelf, cookie: `${MW_COOKIE}=token` } }))
    expect((r as NextResponse).cookies.get(MW_COOKIE)?.value).toBe('')
  })
})
