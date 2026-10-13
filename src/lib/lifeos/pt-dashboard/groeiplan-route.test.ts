// Routetest: wie mag het groeiplan aanpassen? Kane en de eigenaren wel, PT'ers
// en clubmanagers niet (die lezen het alleen).

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { START_PLAN } from './groeiplan'

const links = vi.hoisted(() => ({ vindLink: vi.fn(), sessieGeldig: vi.fn() }))
vi.mock('@/lib/lifeos/leads/links', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/lifeos/leads/links')>()), ...links }))
vi.mock('@/lib/lifeos/admin', () => ({ createLifeosAdminClient: () => ({}) }))
const opslag = vi.hoisted(() => ({ slaGroeiplanOp: vi.fn() }))
vi.mock('./groeiplan-opslag', () => opslag)

import { PUT } from '@/app/api/pt/[code]/groeiplan/route'

const link = (rol: string) => ({ rol, userId: 'u', persoonId: 'p', code: 'x', naam: 'Ruben', clubs: [] })
const req = (body: unknown, site = 'same-origin') =>
  new NextRequest('https://fitfactorypt.nl/api/pt/x/groeiplan', { method: 'PUT', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'sec-fetch-site': site } })
const ctx = { params: Promise.resolve({ code: 'x' }) }

beforeEach(() => {
  vi.clearAllMocks()
  links.sessieGeldig.mockResolvedValue(true)
  opslag.slaGroeiplanOp.mockResolvedValue(true)
})

describe('PUT groeiplan', () => {
  it.each(['eigenaar', 'beheerder'])('%s mag opslaan (op eigen naam)', async (rol) => {
    links.vindLink.mockResolvedValue(link(rol))
    expect((await PUT(req(START_PLAN), ctx)).status).toBe(204)
    expect(opslag.slaGroeiplanOp).toHaveBeenCalledWith({}, 'u', START_PLAN, 'Ruben')
  })
  it.each(['pt', 'clubmanager'])('%s krijgt 403 en er wordt niets opgeslagen', async (rol) => {
    links.vindLink.mockResolvedValue(link(rol))
    expect((await PUT(req(START_PLAN), ctx)).status).toBe(403)
    expect(opslag.slaGroeiplanOp).not.toHaveBeenCalled()
  })
  it('uitgelogd → 401; vreemde site → 403; ongeldig plan → 400', async () => {
    links.vindLink.mockResolvedValue(link('eigenaar'))
    expect((await PUT(req(START_PLAN, 'cross-site'), ctx)).status).toBe(403)
    expect((await PUT(req({ focus: '' }), ctx)).status).toBe(400)
    links.sessieGeldig.mockResolvedValue(false)
    expect((await PUT(req(START_PLAN), ctx)).status).toBe(401)
    expect(opslag.slaGroeiplanOp).not.toHaveBeenCalled()
  })
})
