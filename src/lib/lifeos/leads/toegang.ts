// ─── LifeOS — lead tracker: het slot op de publieke API (SERVER-ONLY) ───────
// Link bestaat + dit toestel heeft een geldige sessie (pincode). Anders 404/401,
// zonder te vertellen wát er mist.

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { sessieGeldig, vindLink, type LeadLink } from './opslag'
import { sessieCookieNaam } from './pin'

export const GEEN_CACHE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } as const

export function foutAntwoord(fout: string, status: number): NextResponse {
  return NextResponse.json({ fout }, { status, headers: GEEN_CACHE })
}

/** De link achter de code, of een 404. */
export async function linkVoor(code: string): Promise<{ admin: SupabaseClient; link: LeadLink } | NextResponse> {
  const admin = createLifeosAdminClient()
  const link = await vindLink(admin, code)
  return link ? { admin, link } : foutAntwoord('Deze link werkt niet (meer).', 404)
}

/** Als `linkVoor`, maar ook ingelogd met de pincode. */
export async function ingelogdeLink(req: NextRequest, code: string): Promise<{ admin: SupabaseClient; link: LeadLink } | NextResponse> {
  const r = await linkVoor(code)
  if (r instanceof NextResponse) return r
  const ok = await sessieGeldig(r.admin, r.link, req.cookies.get(sessieCookieNaam(r.link.code))?.value, new Date())
  return ok ? r : foutAntwoord('Je bent uitgelogd. Vernieuw de pagina en vul je pincode in.', 401)
}

/** De `pin` uit de body, als die 6 cijfers is. */
export function leesPin(body: unknown): string | null {
  const pin = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).pin : null
  return typeof pin === 'string' && /^\d{6}$/.test(pin) ? pin : null
}
