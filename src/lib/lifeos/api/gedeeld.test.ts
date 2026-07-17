// Tests voor de in-flight coalescing van `haalJsonGedeeld`. De invariant die telt:
// gelijktijdige vluchten delen één fetch, maar er blijft NIETS in cache — een
// latere aanroep doet een verse fetch. Zou dat tweede niet kloppen, dan zag een
// kaart die na een schrijf herlaadt stille oude data.
//
// We mocken `authFetch` (de netwerkkant) zodat we de fetch-teller kunnen zien.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const authFetch = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auth/auth-fetch', () => ({ authFetch }))

import { haalJsonGedeeld } from '@/lib/lifeos/api/http'

function jsonRespons(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const leesGetal = (ruw: unknown): number | null =>
  typeof ruw === 'object' && ruw !== null && typeof (ruw as { n?: unknown }).n === 'number'
    ? (ruw as { n: number }).n
    : null

beforeEach(() => {
  authFetch.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('haalJsonGedeeld — in-flight coalescing', () => {
  it('deelt één fetch tussen twee gelijktijdige aanroepen op hetzelfde pad', async () => {
    authFetch.mockImplementation(() => Promise.resolve(jsonRespons({ n: 42 })))

    // Twee kaarten die op dezelfde tick hetzelfde endpoint opvragen.
    const [a, b] = await Promise.all([
      haalJsonGedeeld('/api/pijlers', leesGetal),
      haalJsonGedeeld('/api/pijlers', leesGetal),
    ])

    expect(a).toEqual({ ok: true, waarde: 42 })
    expect(b).toEqual({ ok: true, waarde: 42 })
    // De kern: de server is één keer geraakt, niet twee.
    expect(authFetch).toHaveBeenCalledTimes(1)
  })

  it('laat elke aanroeper zelf narrowen op dezelfde ruwe respons', async () => {
    authFetch.mockImplementation(() => Promise.resolve(jsonRespons({ n: 7, m: 'x' })))

    const leesM = (ruw: unknown): string | null =>
      typeof ruw === 'object' && ruw !== null && typeof (ruw as { m?: unknown }).m === 'string'
        ? (ruw as { m: string }).m
        : null

    const [getal, tekst] = await Promise.all([
      haalJsonGedeeld('/api/gedeeld-narrow', leesGetal),
      haalJsonGedeeld('/api/gedeeld-narrow', leesM),
    ])

    // Zelfde respons, verschillende narrowers — precies het /api/pijlers-geval.
    expect(getal).toEqual({ ok: true, waarde: 7 })
    expect(tekst).toEqual({ ok: true, waarde: 'x' })
    expect(authFetch).toHaveBeenCalledTimes(1)
  })

  it('doet een VERSE fetch voor een aanroep ná afronding — geen cache', async () => {
    authFetch.mockImplementation(() => Promise.resolve(jsonRespons({ n: 1 })))

    await haalJsonGedeeld('/api/na-elkaar', leesGetal)
    // De eerste vlucht is klaar en opgeruimd; de tweede mag niet meeliften.
    await haalJsonGedeeld('/api/na-elkaar', leesGetal)

    expect(authFetch).toHaveBeenCalledTimes(2)
  })

  it('deelt niet tussen verschillende paden', async () => {
    authFetch.mockImplementation(() => Promise.resolve(jsonRespons({ n: 1 })))

    await Promise.all([
      haalJsonGedeeld('/api/een', leesGetal),
      haalJsonGedeeld('/api/twee', leesGetal),
    ])

    expect(authFetch).toHaveBeenCalledTimes(2)
  })

  it('ruimt de vlucht ook op na een netwerkfout, zodat opnieuw vers begint', async () => {
    authFetch.mockRejectedValueOnce(new Error('offline'))

    const eerste = await haalJsonGedeeld('/api/valt-om', leesGetal)
    expect(eerste.ok).toBe(false)

    // De volgende poging mag niet de gefaalde vlucht delen.
    authFetch.mockResolvedValueOnce(jsonRespons({ n: 99 }))
    const tweede = await haalJsonGedeeld('/api/valt-om', leesGetal)

    expect(tweede).toEqual({ ok: true, waarde: 99 })
    expect(authFetch).toHaveBeenCalledTimes(2)
  })

  it('geeft een HTTP-fout net zo door als haalJson (fout ≠ leeg)', async () => {
    authFetch.mockResolvedValueOnce(jsonRespons({ fout: 'Nog geen data.' }, 503))

    const uit = await haalJsonGedeeld('/api/http-fout', leesGetal)

    expect(uit).toEqual({ ok: false, fout: 'Nog geen data.', status: 503 })
  })
})
