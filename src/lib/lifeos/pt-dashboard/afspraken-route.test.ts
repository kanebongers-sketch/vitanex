// Routetest: checkup-afspraken legt alleen Kane (beheerder) vast, en alleen
// voor een trainer uit zijn eigen team.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const links = vi.hoisted(() => ({ vindLink: vi.fn(), sessieGeldig: vi.fn() }))
vi.mock('@/lib/lifeos/leads/links', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/lifeos/leads/links')>()), ...links }))
vi.mock('@/lib/lifeos/admin', () => ({ createLifeosAdminClient: () => ({}) }))
const opslag = vi.hoisted(() => ({ maakAfspraak: vi.fn() }))
vi.mock('./afspraken-opslag', () => opslag)
const team = vi.hoisted(() => ({ haalTrainers: vi.fn() }))
vi.mock('./team-opslag', () => team)

import { POST } from '@/app/api/pt/[code]/afspraken/route'

const JOEY = '11111111-1111-4111-8111-111111111111'
const link = (rol: string) => ({ rol, userId: 'u', persoonId: 'p', code: 'x', naam: 'Kane', clubs: [] })
const req = (body: unknown) =>
  new NextRequest('https://fitfactorypt.nl/api/pt/x/afspraken', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' } })
const ctx = { params: Promise.resolve({ code: 'x' }) }

beforeEach(() => {
  vi.clearAllMocks()
  links.sessieGeldig.mockResolvedValue(true)
  team.haalTrainers.mockResolvedValue([{ id: JOEY, naam: 'Joey' }])
  opslag.maakAfspraak.mockResolvedValue(true)
})

describe('POST afspraken', () => {
  it('beheerder → 204, op zijn naam', async () => {
    links.vindLink.mockResolvedValue(link('beheerder'))
    expect((await POST(req({ persoonId: JOEY, gesprekken: 5 }), ctx)).status).toBe(204)
    expect(opslag.maakAfspraak).toHaveBeenCalledWith({}, 'u', JOEY, expect.objectContaining({ gesprekken: 5 }), expect.any(String), 'Kane')
  })
  it.each(['eigenaar', 'clubmanager', 'pt'])('%s → 403', async (rol) => {
    links.vindLink.mockResolvedValue(link(rol))
    expect((await POST(req({ persoonId: JOEY, gesprekken: 5 }), ctx)).status).toBe(403)
    expect(opslag.maakAfspraak).not.toHaveBeenCalled()
  })
  it('onbekende trainer → 404; geen afspraak → 400', async () => {
    links.vindLink.mockResolvedValue(link('beheerder'))
    expect((await POST(req({ persoonId: '22222222-2222-4222-8222-222222222222', gesprekken: 5 }), ctx)).status).toBe(404)
    expect((await POST(req({ persoonId: JOEY }), ctx)).status).toBe(400)
    expect(opslag.maakAfspraak).not.toHaveBeenCalled()
  })
})
