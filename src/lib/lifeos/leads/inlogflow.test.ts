// Routetests voor de inlogflows van de PT-app: pincode kiezen (met controlecode),
// inloggen met pincode, en de beheerder via zijn hoofdaccount. De logica eronder
// (pin, blokkades, sessies) staat in links.test.ts; hier gaat het om wat de
// routes doen: statuscodes, de controlecode, de cookie en de herkomstcontrole.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const links = vi.hoisted(() => ({ vindLink: vi.fn(), kiesPin: vi.fn(), logIn: vi.fn(), startBeheerSessie: vi.fn() }))
vi.mock('@/lib/lifeos/leads/links', async (importOriginal) => ({ ...(await importOriginal<typeof import('./links')>()), ...links }))
const admin = vi.hoisted(() => ({ vereisLifeosToegang: vi.fn() }))
vi.mock('@/lib/lifeos/admin', () => ({ createLifeosAdminClient: () => ({}), vereisLifeosToegang: admin.vereisLifeosToegang }))
vi.mock('@/lib/utils/rate-limit', () => ({ isRateLimited: () => false }))

import { POST as kiesPinRoute } from '@/app/api/pt/[code]/pin/route'
import { POST as inloggenRoute } from '@/app/api/pt/[code]/inloggen/route'
import { POST as beheerSessieRoute } from '@/app/api/lifeos/pt-app/sessie/route'
import { sessieCookieNaam } from './pin'

const JOEY = { rol: 'pt', userId: 'u', persoonId: 'p', code: 'joey', naam: 'Joey', pinStatus: 'geen', pinHash: null, mislukt: 0, geblokkeerdTot: null, blokkades: 0, clubs: [] }
const zelf = { 'sec-fetch-site': 'same-origin' }
const req = (pad: string, body: unknown, koppen: Record<string, string> = zelf) =>
  new NextRequest(`https://fitfactorypt.nl${pad}`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...koppen } })
const ctx = (code: string) => ({ params: Promise.resolve({ code }) })
const json = async (r: Response) => (await r.json()) as Record<string, unknown>

beforeEach(() => {
  vi.clearAllMocks()
  links.vindLink.mockResolvedValue(JOEY)
})

describe('pincode kiezen', () => {
  it('geeft de controlecode terug aan wie de pin net koos', async () => {
    links.kiesPin.mockResolvedValue({ staat: 'ok', controle: '4821' })
    const r = await kiesPinRoute(req('/api/pt/joey/pin', { pin: '482915' }), ctx('joey'))
    expect(r.status).toBe(200)
    expect(await json(r)).toEqual({ staat: 'wacht', controle: '4821' })
  })
  it('al gekozen → 409; geen 6 cijfers → 400; vreemde site → 403 (en geen pin gezet)', async () => {
    links.kiesPin.mockResolvedValue({ staat: 'al_gekozen' })
    expect((await kiesPinRoute(req('/api/pt/joey/pin', { pin: '482915' }), ctx('joey'))).status).toBe(409)
    expect((await kiesPinRoute(req('/api/pt/joey/pin', { pin: '12' }), ctx('joey'))).status).toBe(400)
    links.kiesPin.mockClear()
    expect((await kiesPinRoute(req('/api/pt/joey/pin', { pin: '482915' }, { 'sec-fetch-site': 'cross-site' }), ctx('joey'))).status).toBe(403)
    expect(links.kiesPin).not.toHaveBeenCalled()
  })
  it('onbekende link → 404', async () => {
    links.vindLink.mockResolvedValue(null)
    expect((await kiesPinRoute(req('/api/pt/niemand/pin', { pin: '482915' }), ctx('niemand'))).status).toBe(404)
  })
})

describe('inloggen met pincode', () => {
  it('goed → httpOnly-cookie op naam van deze link, pad /', async () => {
    const verlooptOp = new Date('2027-01-01T00:00:00Z')
    links.logIn.mockResolvedValue({ staat: 'ok', token: 'geheim-token', verlooptOp })
    const r = await inloggenRoute(req('/api/pt/joey/inloggen', { pin: '482915' }), ctx('joey'))
    expect(r.status).toBe(200)
    const cookie = (r as NextResponse).cookies.get(sessieCookieNaam('joey'))
    expect(cookie).toMatchObject({ value: 'geheim-token', httpOnly: true, sameSite: 'lax', path: '/' })
  })
  it('fout, geblokkeerd, dicht, niet goedgekeurd, beheerderslink: geen cookie en de juiste status', async () => {
    const gevallen: [unknown, number][] = [
      [{ staat: 'fout', over: 3 }, 401],
      [{ staat: 'geblokkeerd', totOp: '2026-10-13T10:00:00Z' }, 429],
      [{ staat: 'gesloten' }, 429],
      [{ staat: 'niet_actief' }, 403],
      [{ staat: 'geen_pincode' }, 403],
    ]
    for (const [uitkomst, status] of gevallen) {
      links.logIn.mockResolvedValue(uitkomst)
      const r = await inloggenRoute(req('/api/pt/joey/inloggen', { pin: '482915' }), ctx('joey'))
      expect(r.status).toBe(status)
      expect((r as NextResponse).cookies.get(sessieCookieNaam('joey'))).toBeUndefined()
    }
  })
})

describe('beheerder via hoofdaccount', () => {
  it('zonder founder-login: geen sessie (de gate beslist)', async () => {
    admin.vereisLifeosToegang.mockResolvedValue(NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 }))
    const r = await beheerSessieRoute(req('/api/lifeos/pt-app/sessie', {}))
    expect(r.status).toBe(401)
    expect(links.startBeheerSessie).not.toHaveBeenCalled()
  })
  it('founder: sessie op de beheerderslink, cookie gezet, code terug', async () => {
    admin.vereisLifeosToegang.mockResolvedValue({ admin: {}, userId: 'u', email: 'kane@x' })
    links.startBeheerSessie.mockResolvedValue({ code: 'kane', token: 'beheer-token', verlooptOp: new Date('2026-10-13T22:00:00Z') })
    const r = await beheerSessieRoute(req('/api/lifeos/pt-app/sessie', {}))
    expect(await json(r)).toEqual({ code: 'kane' })
    expect((r as NextResponse).cookies.get(sessieCookieNaam('kane'))).toMatchObject({ value: 'beheer-token', httpOnly: true })
  })
  it('vanaf een vreemde site: geweigerd vóór de founder-check', async () => {
    const r = await beheerSessieRoute(req('/api/lifeos/pt-app/sessie', {}, { 'sec-fetch-site': 'cross-site' }))
    expect(r.status).toBe(403)
    expect(admin.vereisLifeosToegang).not.toHaveBeenCalled()
  })
})
