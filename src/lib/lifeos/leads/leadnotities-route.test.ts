// Routetest: notities bij een lead. De PT'er bij zijn eigen lead en Kane bij
// elke lead van het team; een eigenaar of clubmanager kijkt alleen mee.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const links = vi.hoisted(() => ({ vindLink: vi.fn(), sessieGeldig: vi.fn() }))
vi.mock('@/lib/lifeos/leads/links', async (importOriginal) => ({ ...(await importOriginal<typeof import('./links')>()), ...links }))
vi.mock('@/lib/lifeos/admin', () => ({ createLifeosAdminClient: () => ({}) }))
const opslag = vi.hoisted(() => ({ voegLeadNotitieToe: vi.fn(), verwijderLeadNotitie: vi.fn() }))
vi.mock('./opslag', async (importOriginal) => ({ ...(await importOriginal<typeof import('./opslag')>()), ...opslag }))

import { POST } from '@/app/api/pt/[code]/leads/[id]/notities/route'

const LEAD = '11111111-1111-4111-8111-111111111111'
const link = (rol: string) => ({ rol, userId: 'u', persoonId: 'p', code: 'joey', naam: 'Joey', clubs: [] })
const req = (body: unknown, site = 'same-origin') =>
  new NextRequest(`https://fitfactorypt.nl/api/pt/joey/leads/${LEAD}/notities`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'sec-fetch-site': site } })
const ctx = { params: Promise.resolve({ code: 'joey', id: LEAD }) }

beforeEach(() => {
  vi.clearAllMocks()
  links.sessieGeldig.mockResolvedValue(true)
  opslag.voegLeadNotitieToe.mockResolvedValue({ ok: true, waarde: { id: 'n', datum: '2026-10-15', tekst: 'gebeld', door: 'Joey', aangemaaktOp: 'x' } })
})

describe('POST notitie bij een lead', () => {
  it('PT\'er → 201, op zijn naam en met de datum van vandaag', async () => {
    links.vindLink.mockResolvedValue(link('pt'))
    const r = await POST(req({ tekst: 'gebeld' }), ctx)
    expect(r.status).toBe(201)
    expect(opslag.voegLeadNotitieToe).toHaveBeenCalledWith({}, expect.objectContaining({ userId: 'u', persoonId: 'p' }), LEAD, 'gebeld', expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), 'Joey')
  })
  it.each(['eigenaar', 'clubmanager'])('%s → 403', async (rol) => {
    links.vindLink.mockResolvedValue(link(rol))
    expect((await POST(req({ tekst: 'gebeld' }), ctx)).status).toBe(403)
    expect(opslag.voegLeadNotitieToe).not.toHaveBeenCalled()
  })
  it('lege tekst → 400; vreemde site → 403; niet de eigen lead → 404', async () => {
    links.vindLink.mockResolvedValue(link('pt'))
    expect((await POST(req({ tekst: ' ' }), ctx)).status).toBe(400)
    expect((await POST(req({ tekst: 'x' }, 'cross-site'), ctx)).status).toBe(403)
    opslag.voegLeadNotitieToe.mockResolvedValue({ ok: false, reden: 'niet_gevonden' })
    expect((await POST(req({ tekst: 'x' }), ctx)).status).toBe(404)
  })
})
