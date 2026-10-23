// De poort van Club voor medewerkers: schakelaar, tenant- en vestigingscheiding
// in clubToegang, de API-poort, het subdomein, inloggen met e-mailadres en
// wachtwoord, de uitnodiging, en het uitnodigen (alleen eigenaar of
// clubmanager met Instellingen, nooit een medewerker).

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
vi.mock('@/lib/club/kern/database', () => ({ clubDatabase: () => db.admin }))
const beheer = vi.hoisted(() => ({ beheerderVanSessie: vi.fn(), vindBeheerderOpEmail: vi.fn(), logInMetWachtwoord: vi.fn() }))
vi.mock('@/lib/club/beheerders/beheerder-opslag', async (orig) => ({ ...(await orig<typeof import('@/lib/club/beheerders/beheerder-opslag')>()), ...beheer }))
const opslag = vi.hoisted(() => ({
  medewerkerVanSessie: vi.fn(), vindUitnodiging: vi.fn(), kiesWachtwoord: vi.fn(), vindMedewerkerOpEmail: vi.fn(), logInMedewerkerMetWachtwoord: vi.fn(), beheerMedewerkerLogin: vi.fn(),
}))
vi.mock('./opslag', async (orig) => ({ ...(await orig<typeof import('./opslag')>()), ...opslag }))

import { nepSupabase, type Vraag } from '@/lib/club/beheerders/nep-supabase'

const KANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const GYM_A = 'de000000-0000-4000-8000-0000000000c1'
const GYM_B = 'be000000-0000-4000-8000-0000000000b2'
const MW = '33333333-3333-4333-8333-333333333333'
const CODE = 'abcdefghijklmnopqrstuvwx'
const TOKEN = 'T'.repeat(43)
const WW = 'paars-fietsen-langs-de-dijk'
const LOTTE = {
  toegang: {
    id: '44444444-4444-4444-8444-444444444444', userId: GYM_A, medewerkerId: MW, code: CODE, actief: true, email: 'lotte@gym.nl', pinStatus: 'geen', pinHash: null,
    wachtwoordHash: 's2:x', uitnodigingVerlooptOp: '2026-10-30T12:00:00Z', mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null,
  },
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
import { POST as inloggen } from '@/app/(aiyourgym)/api/club/inloggen/route'
import { POST as kiesWachtwoord } from '@/app/(aiyourgym)/api/club/inloggen/medewerker/[code]/route'
import { PATCH as beheerLink } from '@/app/(aiyourgym)/api/club/medewerker-toegang/[id]/route'
import { POST as uitloggen } from '@/app/(aiyourgym)/api/club/uitloggen/route'
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
  beheer.vindBeheerderOpEmail.mockResolvedValue(null)
  opslag.medewerkerVanSessie.mockResolvedValue(LOTTE)
  opslag.vindUitnodiging.mockResolvedValue(LOTTE)
  opslag.vindMedewerkerOpEmail.mockResolvedValue(LOTTE)
  opslag.beheerMedewerkerLogin.mockResolvedValue({ staat: 'ok', token: TOKEN })
})

describe('clubToegang voor een medewerker', () => {
  it('alleen de eigen sportschool, de eigen vestigingen en de rechten van de rol', async () => {
    stand.cookies.set('club-org', GYM_B)
    const t = await clubToegang()
    expect(t).toMatchObject({ userId: GYM_A, rol: 'medewerker', isPlatformEigenaar: false, persoonId: MW, naam: 'Lotte de Vries' })
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
  it('vestigingen wijzigen en collega\'s uitnodigen: 404, ook met Instellingen', async () => {
    expect(((await vereisClubToegang(req('/api/club/vestigingen', {}))) as NextResponse).status).toBe(404)
    const r = await beheerLink(req(`/api/club/medewerker-toegang/${MW}`, { actie: 'uitnodigen', email: 'x@gym.nl' }, zelf, 'PATCH'), ctx({ id: MW }))
    expect(r.status).toBe(404)
    expect(opslag.beheerMedewerkerLogin).not.toHaveBeenCalled()
  })
})

describe('medewerkers uitnodigen door de clubmanager', () => {
  beforeEach(() => {
    stand.cookies = new Map([[beheerderCookie(), 'b-token']])
    beheer.beheerderVanSessie.mockResolvedValue(SANNE)
  })
  const uitnodigen = (body: unknown = { actie: 'uitnodigen', email: ' Lotte@Gym.NL ' }) =>
    beheerLink(req(`/api/club/medewerker-toegang/${MW}`, body, zelf, 'PATCH'), ctx({ id: MW }))

  it('nodigt uit binnen de eigen sportschool, geeft het pad van de link en logt zonder adres of link', async () => {
    const r = await uitnodigen()
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ ok: true, pad: `/clubinloggen/medewerker/${TOKEN}`, gemaild: null })
    expect(opslag.beheerMedewerkerLogin).toHaveBeenCalledWith(expect.anything(), GYM_A, MW, { actie: 'uitnodigen', email: 'lotte@gym.nl' }, expect.any(Date))
    expect(logboek[0]?.waarde).toMatchObject({ actie: 'Medewerker uitgenodigd', onderwerp: 'Lotte de Vries' })
    expect(JSON.stringify(logboek)).not.toContain('lotte@gym.nl')
    expect(JSON.stringify(logboek)).not.toContain(TOKEN)
  })
  it('zonder geldig adres of met een oude pincode-actie: 400; kapot id: 404', async () => {
    expect((await uitnodigen({ actie: 'uitnodigen', email: 'geen' })).status).toBe(400)
    expect((await uitnodigen({ actie: 'goedkeuren', controle: '1234' })).status).toBe(400)
    expect((await beheerLink(req('/api/club/medewerker-toegang/x', { actie: 'intrekken' }, zelf, 'PATCH'), ctx({ id: 'x' }))).status).toBe(404)
    expect(opslag.beheerMedewerkerLogin).not.toHaveBeenCalled()
  })
  it('adres al in gebruik: 409; te veel uitnodigingen: 429', async () => {
    opslag.beheerMedewerkerLogin.mockResolvedValue({ staat: 'email_bezet' })
    expect((await uitnodigen()).status).toBe(409)
    stand.geremd = true
    expect((await uitnodigen()).status).toBe(429)
  })
  it('intrekken geeft geen link', async () => {
    opslag.beheerMedewerkerLogin.mockResolvedValue({ staat: 'ok', token: null })
    const r = await uitnodigen({ actie: 'intrekken' })
    expect(await r.json()).toEqual({ ok: true, pad: null, gemaild: null })
    expect(logboek[0]?.waarde).toMatchObject({ actie: 'Login medewerker ingetrokken' })
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
  it('inloggen en de uitnodiging werken alleen op het eigen subdomein', async () => {
    opslag.logInMedewerkerMetWachtwoord.mockResolvedValue({ staat: 'fout', over: 4 })
    stand.host = 'gymb.aiyourgym.com'
    expect((await inloggen(req('/api/club/inloggen', { email: 'lotte@gym.nl', wachtwoord: WW }))).status).toBe(401)
    expect((await kiesWachtwoord(req(`/api/club/inloggen/medewerker/${TOKEN}`, { wachtwoord: WW }), ctx({ code: TOKEN }))).status).toBe(404)
    expect(opslag.logInMedewerkerMetWachtwoord).not.toHaveBeenCalled()
    expect(opslag.kiesWachtwoord).not.toHaveBeenCalled()
    stand.host = 'gyma.aiyourgym.com'
    expect((await inloggen(req('/api/club/inloggen', { email: 'lotte@gym.nl', wachtwoord: WW }))).status).toBe(401)
    expect(opslag.logInMedewerkerMetWachtwoord).toHaveBeenCalledTimes(1)
  })
})

describe('inloggen als medewerker met e-mailadres en wachtwoord', () => {
  const login = (body: unknown = { email: 'lotte@gym.nl', wachtwoord: WW }, koppen: Record<string, string> = zelf) => inloggen(req('/api/club/inloggen', body, koppen))

  it('schakelaar uit: geen medewerker opzoeken (de route blijft open voor het master account, dus 401)', async () => {
    stand.aan = false
    expect((await login()).status).toBe(401)
    expect(opslag.vindMedewerkerOpEmail).not.toHaveBeenCalled()
  })
  it('eerst de beheerders; zonder beheerder de medewerker, met de medewerkercookie', async () => {
    opslag.logInMedewerkerMetWachtwoord.mockResolvedValue({ staat: 'ok', token: 'geheim', verlooptOp: new Date('2026-11-22T00:00:00Z') })
    const r = await login()
    expect(r.status).toBe(200)
    expect(beheer.vindBeheerderOpEmail.mock.invocationCallOrder[0]).toBeLessThan(opslag.vindMedewerkerOpEmail.mock.invocationCallOrder[0])
    expect((r as NextResponse).cookies.get(MW_COOKIE)).toMatchObject({ value: 'geheim', httpOnly: true, sameSite: 'lax', path: '/' })
    // Een eventuele eigenaarssessie in deze browser vervalt (een sessie per browser).
    expect((r as NextResponse).cookies.get(beheerderCookie())).toMatchObject({ value: '', maxAge: 0 })
  })
  it('een beheerder met dit adres gaat voor: de medewerkers worden niet bekeken', async () => {
    beheer.vindBeheerderOpEmail.mockResolvedValue({ ...SANNE, wachtwoordHash: 's2:x' })
    beheer.logInMetWachtwoord.mockResolvedValue({ staat: 'fout', over: 4 })
    expect((await login()).status).toBe(401)
    expect(opslag.vindMedewerkerOpEmail).not.toHaveBeenCalled()
  })
  it('onbekend adres en fout wachtwoord: precies hetzelfde antwoord', async () => {
    opslag.logInMedewerkerMetWachtwoord.mockResolvedValue({ staat: 'fout', over: 4 })
    const fout = await login()
    opslag.vindMedewerkerOpEmail.mockResolvedValue(null)
    const onbekend = await login()
    expect([fout.status, onbekend.status]).toEqual([401, 401])
    expect(await onbekend.json()).toEqual(await fout.json())
  })
  it('dicht na te veel foute pogingen: 429 met uitleg', async () => {
    opslag.logInMedewerkerMetWachtwoord.mockResolvedValue({ staat: 'gesloten' })
    const r = await login()
    expect(r.status).toBe(429)
    expect(((await r.json()) as { fout: string }).fout).toContain('nieuwe uitnodiging')
  })
  it('te veel pogingen per IP of van een andere site: geen controle', async () => {
    stand.geremd = true
    expect((await login()).status).toBe(429)
    stand.geremd = false
    expect((await login(undefined, { 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    expect(opslag.logInMedewerkerMetWachtwoord).not.toHaveBeenCalled()
  })
  it('uitloggen wist ook de medewerkercookie', async () => {
    const r = await uitloggen(new NextRequest('https://fitfactorypt.nl/api/club/uitloggen', { method: 'POST', headers: { ...zelf, cookie: `${MW_COOKIE}=token` } }))
    expect((r as NextResponse).cookies.get(MW_COOKIE)?.value).toBe('')
  })
})

describe('de uitnodiging aannemen: wachtwoord kiezen', () => {
  const kies = (wachtwoord: unknown = WW, koppen: Record<string, string> = zelf) => kiesWachtwoord(req(`/api/club/inloggen/medewerker/${TOKEN}`, { wachtwoord }, koppen), ctx({ code: TOKEN }))

  it('sterk wachtwoord: meteen binnen met de medewerkercookie', async () => {
    opslag.kiesWachtwoord.mockResolvedValue({ staat: 'ok', token: 'geheim', verlooptOp: new Date('2026-11-22T00:00:00Z') })
    const r = await kies()
    expect(r.status).toBe(200)
    expect(opslag.kiesWachtwoord).toHaveBeenCalledWith(expect.anything(), LOTTE, TOKEN, WW, expect.any(Date))
    expect((r as NextResponse).cookies.get(MW_COOKIE)).toMatchObject({ value: 'geheim', httpOnly: true })
  })
  it('zwak, met de eigen naam, te kort of geen tekst: 400 zonder opslaan', async () => {
    for (const w of ['kort', 'wachtwoord-wachtwoord', 'lotte-de-vries-sport-2026', 123]) expect((await kies(w)).status).toBe(400)
    expect(opslag.kiesWachtwoord).not.toHaveBeenCalled()
  })
  it('onbekende, gebruikte of verlopen uitnodiging: 404; tussendoor gebruikt: 410', async () => {
    opslag.vindUitnodiging.mockResolvedValue(null)
    expect((await kies()).status).toBe(404)
    opslag.vindUitnodiging.mockResolvedValue(LOTTE)
    opslag.kiesWachtwoord.mockResolvedValue({ staat: 'verlopen' })
    expect((await kies()).status).toBe(410)
  })
  it('adres hoort al bij een ander account: 409', async () => {
    opslag.kiesWachtwoord.mockResolvedValue({ staat: 'email_bezet' })
    expect((await kies()).status).toBe(409)
  })
  it('schakelaar uit, andere site of geremd: niets opgezocht', async () => {
    stand.aan = false
    expect((await kies()).status).toBe(404)
    stand.aan = true
    expect((await kies(WW, { 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    stand.geremd = true
    expect((await kies()).status).toBe(429)
    expect(opslag.vindUitnodiging).not.toHaveBeenCalled()
  })
})
