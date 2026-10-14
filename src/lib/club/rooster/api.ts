// ─── Fit Factory Club, rooster: hulp voor de API-routes (SERVER) ────────────

import type { NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import type { Resultaat } from './basis-opslag'

/** De JSON-body van een verzoek, of undefined als die geen geldige JSON is. */
export async function leesJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

/** Een Resultaat als antwoord: de waarde als JSON, of de fout met zijn status. */
export function alsAntwoord<T>(r: Resultaat<T>): NextResponse {
  return r.ok ? clubJson(r.waarde) : clubFout(r.fout, r.status)
}
