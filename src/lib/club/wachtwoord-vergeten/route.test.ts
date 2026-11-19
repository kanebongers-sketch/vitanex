// De route POST /api/club/inloggen/vergeten: alleen van de eigen pagina, een
// rem per netwerk, en voor elk geldig adres precies hetzelfde antwoord. Het
// zoekwerk gebeurt pas na het antwoord (after).

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const stand = vi.hoisted(() => ({
  geremd: false,
  taal: undefined as string | undefined,
  na: [] as (() => unknown)[],
  aanvraag: vi.fn(async () => 'verstuurd'),
  rem: vi.fn(),
  database: vi.fn(() => ({ nep: true })),
}))
vi.mock('next/server', async (orig) => ({ ...(await orig<typeof import('next/server')>()), after: (f: () => unknown) => void stand.na.push(f) }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (naam: string) => (naam === 'ayg-taal' && stand.taal ? { value: stand.taal } : undefined) }),
  headers: async () => new Headers(),
}))
vi.mock('react', async (orig) => ({ ...(await orig<typeof import('react')>()), cache: <T,>(f: T) => f }))
vi.mock('@/lib/club/kern/database', () => ({ clubDatabase: stand.database }))
vi.mock('@/lib/club/kern/rem-db', async (orig) => ({
  ...(await orig<typeof import('@/lib/club/kern/rem-db')>()),
  isGeremd: async (...args: unknown[]) => {
    stand.rem(...args)
    return stand.geremd
  },
}))
vi.mock('@/lib/club/wachtwoord-vergeten/aanvraag', () => ({ vraagNieuweLinkAan: stand.aanvraag }))

import { POST } from '@/app/(aiyourgym)/api/club/inloggen/vergeten/route'
import { NEUTRAAL, REM_IP, VERGETEN_MAX_BODY, VERGETEN_ROUTE } from './regels'

const zelf = { 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7' }
const req = (body: unknown, koppen: Record<string, string> = zelf) =>
  new NextRequest(`https://aiyourgym.com${VERGETEN_ROUTE}`, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: koppen })

beforeEach(() => {
  vi.clearAllMocks()
  stand.geremd = false
  stand.taal = undefined
  stand.na = []
})

describe('POST /api/club/inloggen/vergeten', () => {
  it('een geldig adres: het neutrale antwoord, en het werk pas na het antwoord', async () => {
    // Act
    const r = await POST(req({ email: ' Sanne@GymA.nl ' }))
    // Assert
    expect(r.status).toBe(200)
    expect(await r.json()).toEqual(NEUTRAAL)
    expect(stand.aanvraag).not.toHaveBeenCalled()
    expect(stand.database).not.toHaveBeenCalled()
    expect(stand.na).toHaveLength(1)
    await stand.na[0]()
    expect(stand.aanvraag).toHaveBeenCalledWith({ nep: true }, 'sanne@gyma.nl', 'nl', expect.any(Date))
  })
  it('bekend of onbekend adres: precies hetzelfde antwoord (status, inhoud en koppen)', async () => {
    const antwoorden = []
    for (const uitkomst of ['verstuurd', 'geen_account', 'geremd', 'niet_ingesteld', 'db']) {
      stand.aanvraag.mockResolvedValueOnce(uitkomst)
      const r = await POST(req({ email: 'iemand@gym.nl' }))
      await stand.na.at(-1)?.()
      antwoorden.push({ status: r.status, body: await r.text(), koppen: [...r.headers.entries()].sort() })
    }
    for (const a of antwoorden) expect(a).toEqual(antwoorden[0])
    expect(antwoorden[0].body).not.toContain('gym.nl')
  })
  it('de mail komt in de taal van de pagina', async () => {
    stand.taal = 'en'
    await POST(req({ email: 'sanne@gyma.nl' }))
    await stand.na[0]()
    expect(stand.aanvraag).toHaveBeenCalledWith(expect.anything(), 'sanne@gyma.nl', 'en', expect.any(Date))
  })
  it('niet van onze eigen pagina: 403, er gebeurt niets', async () => {
    const r = await POST(req({ email: 'sanne@gyma.nl' }, { ...zelf, 'sec-fetch-site': 'cross-site' }))
    expect(r.status).toBe(403)
    expect(stand.rem).not.toHaveBeenCalled()
    expect(stand.na).toHaveLength(0)
  })
  it('te veel aanvragen vanaf een netwerk: 429, geteld op het IP via de rem (HMAC)', async () => {
    stand.geremd = true
    const r = await POST(req({ email: 'sanne@gyma.nl' }))
    expect(r.status).toBe(429)
    expect(stand.rem).toHaveBeenCalledWith(REM_IP, '203.0.113.7')
    expect(stand.na).toHaveLength(0)
  })
  it('geen e-mailadres: 400; een te groot verzoek: 413; nooit zoekwerk', async () => {
    for (const body of [{}, { email: 'geen adres' }, { email: 5 }, 'geen json']) expect((await POST(req(body))).status, JSON.stringify(body)).toBe(400)
    expect((await POST(req({ email: 'sanne@gyma.nl', vulling: 'x'.repeat(VERGETEN_MAX_BODY) }))).status).toBe(413)
    expect(stand.na).toHaveLength(0)
  })
})
