// ─── LifeOS — PT-dashboard: het slot op de publieke API (SERVER-ONLY) ───────
// Link bestaat + dit toestel heeft een geldige sessie (pincode). Anders 404/401,
// zonder te vertellen wát er mist.

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { kijktMee, sessieGeldig, vindLink, type LeadLink } from './links'
import { sessieCookieNaam } from './pin'

export const GEEN_CACHE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } as const

export function foutAntwoord(fout: string, status: number): NextResponse {
  return NextResponse.json({ fout }, { status, headers: GEEN_CACHE })
}

export interface PtToegang {
  admin: SupabaseClient
  link: LeadLink
}

/** De link achter de code, of een 404. */
export async function linkVoor(code: string): Promise<PtToegang | NextResponse> {
  const admin = createLifeosAdminClient()
  const link = await vindLink(admin, code)
  return link ? { admin, link } : foutAntwoord('Deze link werkt niet (meer).', 404)
}

/**
 * Als `linkVoor`, maar ook ingelogd met de pincode. Standaard alleen voor een
 * PT'er: een eigenaar kijkt mee maar schrijft geen leads, klanten of check-ins
 * (anders zouden die op zijn naam belanden). `eigenaarMag` voor wat hij wél mag
 * (bv. een document openen).
 */
export async function ingelogdeLink(req: NextRequest, code: string, { eigenaarMag = false } = {}): Promise<PtToegang | NextResponse> {
  const r = await linkVoor(code)
  if (r instanceof NextResponse) return r
  const ok = await sessieGeldig(r.admin, r.link, req.cookies.get(sessieCookieNaam(r.link.code))?.value, new Date())
  if (!ok) return foutAntwoord('Je bent uitgelogd. Vernieuw de pagina en vul je pincode in.', 401)
  if (kijktMee(r.link.rol) && !eigenaarMag) return foutAntwoord('Als eigenaar kijk je mee; aanpassen doet de PT\'er zelf.', 403)
  return r
}

/** De `pin` uit de body, als die 6 cijfers is. */
export function leesPin(body: unknown): string | null {
  const pin = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).pin : null
  return typeof pin === 'string' && /^\d{6}$/.test(pin) ? pin : null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(v: string): boolean {
  return UUID.test(v)
}
