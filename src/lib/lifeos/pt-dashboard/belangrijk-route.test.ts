// Routetest: "Belangrijk". Beheren alleen Kane (beheerder); afvinken en
// kledingmaten alleen een PT'er, voor zichzelf (persoon_id uit de sessie).
// Eigenaren (Ruben) en clubmanagers kunnen niets wijzigen.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const links = vi.hoisted(() => ({ vindLink: vi.fn(), sessieGeldig: vi.fn() }))
vi.mock('@/lib/lifeos/leads/links', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/lifeos/leads/links')>()), ...links }))
vi.mock('@/lib/lifeos/admin', () => ({ createLifeosAdminClient: () => ({}) }))
const opslag = vi.hoisted(() => ({ voerBeheerUit: vi.fn(), zetGedaan: vi.fn(), slaKledingmatenOp: vi.fn() }))
vi.mock('./belangrijk-opslag', () => opslag)

import { POST } from '@/app/api/pt/[code]/belangrijk/route'

const ID = '11111111-1111-4111-8111-111111111111'
const link = (rol: string) => ({ rol, userId: 'u', persoonId: 'eigen-persoon', code: 'x', naam: 'Joey', clubs: [] })
const req = (body: unknown, site = 'same-origin') =>
  new NextRequest('https://fitfactorypt.nl/api/pt/x/belangrijk', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'sec-fetch-site': site } })
const ctx = { params: Promise.resolve({ code: 'x' }) }

const TOEVOEGEN = { actie: 'toevoegen', titel: 'Vraag om referrals' }
const GEDAAN = { actie: 'gedaan', id: ID, gedaan: true, persoonId: 'iemand-anders' }
const MATEN = { actie: 'kledingmaten', maten: { boven: 'M', onder: 'L' } }

beforeEach(() => {
  vi.clearAllMocks()
  links.sessieGeldig.mockResolvedValue(true)
  for (const f of Object.values(opslag)) f.mockResolvedValue({ ok: true })
})

describe('POST belangrijk', () => {
  it('de beheerder beheert de punten', async () => {
    links.vindLink.mockResolvedValue(link('beheerder'))
    expect((await POST(req(TOEVOEGEN), ctx)).status).toBe(204)
    expect(opslag.voerBeheerUit).toHaveBeenCalledWith({}, 'u', { actie: 'toevoegen', titel: 'Vraag om referrals', uitleg: null, link: null })
  })
  it.each(['pt', 'eigenaar', 'clubmanager'])('%s mag niet beheren (403)', async (rol) => {
    links.vindLink.mockResolvedValue(link(rol))
    expect((await POST(req(TOEVOEGEN), ctx)).status).toBe(403)
    expect(opslag.voerBeheerUit).not.toHaveBeenCalled()
  })
  it('een PT\'er vinkt af en geeft maten door, altijd voor zichzelf', async () => {
    links.vindLink.mockResolvedValue(link('pt'))
    expect((await POST(req(GEDAAN), ctx)).status).toBe(204)
    expect(opslag.zetGedaan).toHaveBeenCalledWith({}, 'u', 'eigen-persoon', ID, true)
    expect((await POST(req(MATEN), ctx)).status).toBe(204)
    expect(opslag.slaKledingmatenOp).toHaveBeenCalledWith({}, 'u', 'eigen-persoon', { boven: 'M', onder: 'L' })
  })
  it.each(['beheerder', 'eigenaar', 'clubmanager'])('%s vinkt niet af en geeft geen maten door (403)', async (rol) => {
    links.vindLink.mockResolvedValue(link(rol))
    expect((await POST(req(GEDAAN), ctx)).status).toBe(403)
    expect((await POST(req(MATEN), ctx)).status).toBe(403)
    expect(opslag.zetGedaan).not.toHaveBeenCalled()
    expect(opslag.slaKledingmatenOp).not.toHaveBeenCalled()
  })
  it('uitgelogd → 401; vreemde site → 403; ongeldige invoer → 400; opslagfout doorgegeven', async () => {
    links.vindLink.mockResolvedValue(link('beheerder'))
    expect((await POST(req(TOEVOEGEN, 'cross-site'), ctx)).status).toBe(403)
    expect((await POST(req({ actie: 'toevoegen', titel: '' }), ctx)).status).toBe(400)
    opslag.voerBeheerUit.mockResolvedValueOnce({ ok: false, fout: 'Dit punt bestaat niet (meer).', status: 404 })
    expect((await POST(req({ actie: 'verwijderen', id: ID }), ctx)).status).toBe(404)
    links.sessieGeldig.mockResolvedValue(false)
    expect((await POST(req(TOEVOEGEN), ctx)).status).toBe(401)
  })
})
