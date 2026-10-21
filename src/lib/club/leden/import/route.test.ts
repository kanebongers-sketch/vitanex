// De importroute weigert een te groot bericht met 413, ook als de opgegeven
// lengte al te groot is (dan wordt het bericht niet eens ingelezen).

import { describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/club/toegang', () => ({
  vereisClubToegang: vi.fn(async () => ({ userId: 'u', vestigingen: [] })),
  clubFout: (fout: string, status: number) => NextResponse.json({ fout }, { status }),
  clubJson: (data: unknown) => NextResponse.json(data),
  logActie: vi.fn(),
}))

import { POST } from '@/app/(aiyourgym)/api/club/leden/import/route'
import { MAX_IMPORT_BYTES } from './verzoek'

const verzoek = (body: string, lengte?: number) =>
  new NextRequest('https://aiyourgym.com/api/club/leden/import', {
    method: 'POST',
    body,
    headers: lengte === undefined ? {} : { 'content-length': String(lengte) },
  })

describe('POST /api/club/leden/import', () => {
  it('opgegeven lengte te groot: 413 zonder inlezen', async () => {
    const req = verzoek('{}', MAX_IMPORT_BYTES + 1)
    const lees = vi.spyOn(req, 'text')
    expect((await POST(req)).status).toBe(413)
    expect(lees).not.toHaveBeenCalled()
  })
  it('bericht groter dan de grens: 413', async () => {
    expect((await POST(verzoek('x'.repeat(MAX_IMPORT_BYTES + 1)))).status).toBe(413)
  })
  it('telt bytes, niet tekens', async () => {
    expect((await POST(verzoek('é'.repeat(MAX_IMPORT_BYTES / 2 + 1)))).status).toBe(413)
  })
})
