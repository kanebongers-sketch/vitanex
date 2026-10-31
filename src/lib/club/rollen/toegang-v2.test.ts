// Rollen v2 in de echte poort: clubToegang en vereisClubToegang met een
// nep-database, en de API's voor Team en Rechten per rol (geen escalatie, de
// laatste eigenaar). Met de schakelaar aan (Voorbeeld Gym staat in de lijst)
// en uit (een sportschool buiten de lijst werkt zoals voor 29-10-2026). Sinds
// 30-10-2026 staat v2 overal aan; hier staat CLUB_ROLLEN_V2_OVERAL uit, zodat
// ook het terugdraaipad getest blijft.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const stand = vi.hoisted(() => ({ cookies: new Map<string, string>(), host: 'fitfactorypt.nl' }))
vi.mock('@/lib/club/beheerders/schakelaar', () => ({ CLUB_EIGEN_LOGIN: true }))
vi.mock('@/lib/club/rollen/schakelaar', async (orig) => {
  const echt = await orig<typeof import('@/lib/club/rollen/schakelaar')>()
  return { ...echt, CLUB_ROLLEN_V2_OVERAL: false, rollenV2Aan: (id: string) => echt.CLUB_ROLLEN_V2_ORGS.includes(id) }
})
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (naam: string) => (stand.cookies.has(naam) ? { value: stand.cookies.get(naam) } : undefined) }),
  headers: async () => new Headers({ host: stand.host }),
}))
vi.mock('react', async (orig) => ({ ...(await orig<typeof import('react')>()), cache: <T,>(f: T) => f }))
vi.mock('@/lib/utils/rate-limit', () => ({ isRateLimited: () => false }))
vi.mock('@/lib/club/kern/database', () => ({ clubDatabase: () => db.admin }))
const beheer = vi.hoisted(() => ({ beheerderVanSessie: vi.fn() }))
vi.mock('@/lib/club/beheerders/beheerder-opslag', async (orig) => ({ ...(await orig<typeof import('@/lib/club/beheerders/beheerder-opslag')>()), ...beheer }))
const mwOpslag = vi.hoisted(() => ({ medewerkerVanSessie: vi.fn() }))
vi.mock('@/lib/club/medewerker-login/opslag', async (orig) => ({ ...(await orig<typeof import('@/lib/club/medewerker-login/opslag')>()), ...mwOpslag }))

import { nepSupabase, type Vraag } from '@/lib/club/beheerders/nep-supabase'

const KANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const DEMO = 'de000000-0000-4000-8000-0000000000c1' // rollen v2 aan
const OUD = 'be000000-0000-4000-8000-0000000000b2' // rollen v2 uit
const P_EIGENAAR = '10000000-0000-4000-8000-000000000001'
const P_MANAGER = '10000000-0000-4000-8000-000000000002'
const P_TRAINER = '10000000-0000-4000-8000-000000000003'
const P_LEEG = '10000000-0000-4000-8000-000000000004'

const beheerder = (org: string, id: string, rol: 'eigenaar' | 'clubmanager') => ({
  id, organisatieId: org, naam: 'Beheerder', email: 'b@gym.nl', rol, code: 'abcdefghijklmnopqrstuvwx', actief: true, pinStatus: 'geen', pinHash: null,
  wachtwoordHash: 's2:x', mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null,
})
const B_EIGENAAR = '20000000-0000-4000-8000-000000000001'
const B_MANAGER = '20000000-0000-4000-8000-000000000002'
const B_LEEG = '20000000-0000-4000-8000-000000000004'
const PROFIEL_VAN: Record<string, string> = { [B_EIGENAAR]: P_EIGENAAR, [B_MANAGER]: P_MANAGER, [B_LEEG]: P_LEEG }

const data = vi.hoisted(() => ({ rollen: new Map<string, string[]>(), alle: new Map<string, boolean>(), instellingen: {} as Record<string, unknown> }))
const orgRij = (id: string) => ({ id, naam: 'Gym', slug: id === DEMO ? 'voorbeeldgym' : 'oud', slogan: null, logo: null, kleur_accent: '#B58E5C', thema: 'donker', modules: {}, demo: false, beheerder_id: KANE, instellingen: data.instellingen })
const filter = (v: Vraag, k: string) => v.filters.find(([op, kolom]) => op === 'eq' && kolom === k)?.[2]

const db = vi.hoisted(() => ({ admin: null as unknown, vragen: [] as Vraag[] }))
const nep = nepSupabase((v: Vraag) => {
  if (v.tabel === 'club_organisaties') {
    const id = filter(v, 'id')
    return { data: id === DEMO || id === OUD ? orgRij(id) : null, error: null }
  }
  if (v.tabel === 'club_vestigingen') return { data: [{ vestiging: 'budel', naam: 'Budel', volgorde: 1, standaard: true }, { vestiging: 'eersel', naam: 'Eersel', volgorde: 2, standaard: false }], error: null }
  if (v.tabel === 'club_beheerders') {
    const id = filter(v, 'id')
    // Een beheerder op id (profiel van de login), of alle actieve beheerders (eigenaren tellen).
    return id ? { data: { profiel_id: PROFIEL_VAN[String(id)] ?? null }, error: null } : { data: Object.values(PROFIEL_VAN).map((profiel_id) => ({ profiel_id })), error: null }
  }
  if (v.tabel === 'club_profiel_rollen' && v.actie === 'select') {
    const mw = filter(v, 'medewerker_id')
    if (mw) return { data: (data.rollen.get(String(mw)) ?? []).map((rol) => ({ rol })), error: null }
    const rol = filter(v, 'rol')
    return { data: [...data.rollen].filter(([, r]) => !rol || r.includes(String(rol))).map(([id]) => ({ medewerker_id: id })), error: null }
  }
  if (v.tabel === 'club_medewerkers' && v.actie === 'select') {
    const id = filter(v, 'id')
    if (id) return { data: data.rollen.has(String(id)) ? { id, alle_vestigingen: data.alle.get(String(id)) ?? false } : null, error: null }
    const lijst = v.filters.find(([op, k]) => op === 'in' && k === 'id')?.[2] as string[] | undefined
    return { data: (lijst ?? []).map((x) => ({ id: x })), error: null }
  }
  return { data: [], error: null }
})
db.admin = nep.admin
db.vragen = nep.vragen

import { clubToegang, vereisClubToegang } from '@/lib/club/toegang'
import { beheerderCookie } from '@/lib/club/beheerders/beheerder'
import { medewerkerCookie } from '@/lib/club/medewerker-login/medewerker-login'
import { PATCH as zetTeam } from '@/app/(aiyourgym)/api/club/team/[id]/route'
import { PATCH as zetRechten } from '@/app/(aiyourgym)/api/club/team/rechten/route'

const zelf = { 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }
const req = (pad: string, method = 'GET', body?: unknown) => new NextRequest(`https://fitfactorypt.nl${pad}`, { method, body: body === undefined ? undefined : JSON.stringify(body), headers: zelf })
const ctx = <T,>(p: T) => ({ params: Promise.resolve(p) })

function alsBeheerder(org: string, id: string, rol: 'eigenaar' | 'clubmanager') {
  stand.cookies = new Map([[beheerderCookie(), 'token']])
  beheer.beheerderVanSessie.mockResolvedValue(beheerder(org, id, rol))
}

beforeEach(() => {
  vi.clearAllMocks()
  db.vragen.length = 0
  stand.cookies = new Map()
  data.instellingen = {}
  data.rollen = new Map([[P_EIGENAAR, ['eigenaar']], [P_MANAGER, ['manager']], [P_TRAINER, ['trainer']], [P_LEEG, []]])
  data.alle = new Map([[P_EIGENAAR, true], [P_MANAGER, true]])
  beheer.beheerderVanSessie.mockResolvedValue(null)
  mwOpslag.medewerkerVanSessie.mockResolvedValue(null)
})

describe('clubToegang met rollen v2', () => {
  it('eigenaar: mag alles binnen de eigen sportschool, start op Vandaag', async () => {
    alsBeheerder(DEMO, B_EIGENAAR, 'eigenaar')
    const t = await clubToegang()
    expect(t?.profiel?.rollen).toEqual(['eigenaar'])
    expect(t?.profiel?.start).toBe('/club')
    expect(t?.onderdelen).toEqual(expect.arrayContaining(['vandaag', 'cijfers', 'rapporten', 'leden', 'rooster', 'schemas', 'huisstijl', 'team']))
  })

  it('opgeslagen rolrechten van de sportschool gaan voor de standaard', async () => {
    data.instellingen = { rolrechten: { rollen: { eigenaar: { cijfers: 'beheren', leden: 'zien' } }, start: { eigenaar: 'cijfers' } } }
    alsBeheerder(DEMO, B_EIGENAAR, 'eigenaar')
    const t = await clubToegang()
    expect(t?.profiel?.start).toBe('/club/cijfers')
    expect(t?.onderdelen).not.toContain('vandaag')
    expect(t?.onderdelen).not.toContain('schemas')
  })

  it('een profiel zonder rollen heeft niets, ook al is de login van een eigenaar', async () => {
    alsBeheerder(DEMO, B_LEEG, 'eigenaar')
    const t = await clubToegang()
    expect(t?.profiel?.rollen).toEqual([])
    // Alleen Hulp blijft (magOnderdeel: Hulp heeft iedereen die binnen is).
    expect(t?.onderdelen).toEqual([])
  })

  it('schakelaar uit (sportschool buiten de lijst): precies het oude model', async () => {
    alsBeheerder(OUD, B_EIGENAAR, 'eigenaar')
    const t = await clubToegang()
    expect(t?.profiel ?? null).toBeNull()
    expect(t?.onderdelen).toBeNull()
    expect(db.vragen.some((v) => v.tabel === 'club_profiel_rollen')).toBe(false)
  })

  it('medewerker: de eigen vestigingen, of alle met "alle vestigingen"', async () => {
    stand.cookies = new Map([[medewerkerCookie(), 'token']])
    const sessie = {
      toegang: { id: 't', userId: DEMO, medewerkerId: P_TRAINER, code: 'abcdefghijklmnopqrstuvwx', actief: true, email: 'x@gym.nl', pinStatus: 'geen', pinHash: null, wachtwoordHash: 's2:x', uitnodigingVerlooptOp: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null },
      medewerker: { id: P_TRAINER, userId: DEMO, naam: 'Tom', email: null, rollen: ['trainer'], vestigingen: ['eersel'], actief: true },
    }
    mwOpslag.medewerkerVanSessie.mockResolvedValue(sessie)
    let t = await clubToegang()
    expect(t?.vestigingen.map((v) => v.sleutel)).toEqual(['eersel'])
    expect(t?.onderdelen).toEqual(expect.arrayContaining(['vandaag', 'leden', 'schemas']))
    data.alle.set(P_TRAINER, true)
    t = await clubToegang()
    expect(t?.vestigingen.map((v) => v.sleutel)).toEqual(['budel', 'eersel'])
  })
})

describe('de API-poort met rollen v2', () => {
  it('zien is lezen: met alleen zien leest de eigenaar leden maar wijzigt ze niet', async () => {
    data.instellingen = { rolrechten: { rollen: { eigenaar: { cijfers: 'beheren', leden: 'zien' } } } }
    alsBeheerder(DEMO, B_EIGENAAR, 'eigenaar')
    expect(await vereisClubToegang(req('/api/club/leden'))).not.toBeInstanceOf(NextResponse)
    expect(((await vereisClubToegang(req('/api/club/leden', 'POST', {}))) as NextResponse).status).toBe(404)
    expect(((await vereisClubToegang(req('/api/club/training'))) as NextResponse).status).toBe(404)
  })
})

describe('Team: geen escalatie en altijd een eigenaar', () => {
  it('een clubmanager geeft werkrollen, nooit clubmanager of eigenaar', async () => {
    alsBeheerder(DEMO, B_MANAGER, 'clubmanager')
    expect((await zetTeam(req(`/api/club/team/${P_TRAINER}`, 'PATCH', { rollen: ['trainer', 'roosteraar'] }), ctx({ id: P_TRAINER }))).status).toBe(200)
    expect((await zetTeam(req(`/api/club/team/${P_TRAINER}`, 'PATCH', { rollen: ['trainer', 'manager'] }), ctx({ id: P_TRAINER }))).status).toBe(403)
    expect((await zetTeam(req(`/api/club/team/${P_TRAINER}`, 'PATCH', { rollen: ['eigenaar'] }), ctx({ id: P_TRAINER }))).status).toBe(403)
    expect((await zetTeam(req(`/api/club/team/${P_EIGENAAR}`, 'PATCH', { rollen: [] }), ctx({ id: P_EIGENAAR }))).status).toBe(403)
  })

  it('de laatste eigenaar houdt zijn rol; met een tweede eigenaar mag het', async () => {
    alsBeheerder(DEMO, B_EIGENAAR, 'eigenaar')
    expect((await zetTeam(req(`/api/club/team/${P_EIGENAAR}`, 'PATCH', { rollen: ['trainer'] }), ctx({ id: P_EIGENAAR }))).status).toBe(409)
    data.rollen.set(P_MANAGER, ['manager', 'eigenaar'])
    expect((await zetTeam(req(`/api/club/team/${P_EIGENAAR}`, 'PATCH', { rollen: ['trainer'] }), ctx({ id: P_EIGENAAR }))).status).toBe(200)
  })

  it('een trainer komt niet bij Team; onzin wordt geweigerd', async () => {
    alsBeheerder(DEMO, B_EIGENAAR, 'eigenaar')
    expect((await zetTeam(req(`/api/club/team/${P_TRAINER}`, 'PATCH', { rollen: ['baas'] }), ctx({ id: P_TRAINER }))).status).toBe(400)
    data.rollen.set(P_EIGENAAR, ['trainer'])
    expect((await zetTeam(req(`/api/club/team/${P_TRAINER}`, 'PATCH', { rollen: ['trainer'] }), ctx({ id: P_TRAINER }))).status).toBe(404)
  })

  it('schakelaar uit: Team bestaat niet', async () => {
    alsBeheerder(OUD, B_EIGENAAR, 'eigenaar')
    expect((await zetTeam(req(`/api/club/team/${P_TRAINER}`, 'PATCH', { rollen: ['trainer'] }), ctx({ id: P_TRAINER }))).status).toBe(404)
  })
})

describe('Rechten per rol: alleen de eigenaar, het slot blijft', () => {
  it('een clubmanager krijgt een 404', async () => {
    alsBeheerder(DEMO, B_MANAGER, 'clubmanager')
    expect((await zetRechten(req('/api/club/team/rechten', 'PATCH', { rollen: { manager: { abonnement: 'beheren' } } }))).status).toBe(404)
  })

  it('de eigenaar slaat op; wat van de eigenaar is, blijft dicht voor de rest', async () => {
    alsBeheerder(DEMO, B_EIGENAAR, 'eigenaar')
    const res = await zetRechten(req('/api/club/team/rechten', 'PATCH', { rollen: { manager: { abonnement: 'beheren', leden: 'zien' } }, start: { trainer: 'leden' } }))
    expect(res.status).toBe(200)
    const update = db.vragen.find((v) => v.tabel === 'club_organisaties' && v.actie === 'update')
    const opgeslagen = (update?.waarde as { instellingen: { rolrechten: { rollen: Record<string, Record<string, string>>; start: Record<string, string> } } }).instellingen.rolrechten
    expect(opgeslagen.rollen.manager).toEqual({ leden: 'zien' })
    expect(opgeslagen.start.trainer).toBe('leden')
    expect(opgeslagen.rollen.eigenaar.abonnement).toBe('beheren')
  })
})
