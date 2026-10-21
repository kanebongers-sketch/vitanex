// ─── AI Your Gym: gedeelde stukjes voor de API (SERVER-ONLY) ────────────────

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubDatabase } from '@/lib/club/kern/database'
import { clubToegang } from '@/lib/club/toegang'
import { siteActief } from './schakelaar'

/** Antwoorden van de API nooit cachen en nooit in zoekmachines. */
const GEEN_CACHE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } as const

export function aygJson(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: GEEN_CACHE })
}

export function aygFout(fout: string, status: number): NextResponse {
  return aygJson({ fout }, status)
}

/** Zolang de website uit staat bestaat de API alleen voor Kane (anders een gewone 404). */
export async function poortOpen(): Promise<boolean> {
  if (siteActief()) return true
  const t = await clubToegang()
  return t?.isPlatformEigenaar === true
}

export function adminOfNull(): SupabaseClient | null {
  try {
    return clubDatabase()
  } catch {
    return null
  }
}

/** De host zoals de bezoeker hem ziet (achter Render in X-Forwarded-Host). */
export function publiekeHost(req: NextRequest): string {
  return (req.headers.get('x-forwarded-host')?.split(',')[0] ?? req.headers.get('host') ?? '').trim().toLowerCase()
}
