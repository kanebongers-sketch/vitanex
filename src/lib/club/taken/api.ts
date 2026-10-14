// ─── Fit Factory Club, taken: hulp voor de API-routes (SERVER) ──────────────

import type { NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { nlDelen } from '@/lib/club/rooster/tijd'
import type { Resultaat } from './opslag'

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

/** Vandaag als Nederlandse kalenderdag ("2026-10-14"). */
export function vandaagNl(): string {
  return nlDelen(new Date()).datum
}
