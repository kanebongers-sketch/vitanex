// POST /api/gezondheid/verwijderen — wist alle gezondheidsdata die je telefoon
// of horloge aanleverde (dagwaarden, trainingen, sync-status). Je eigen
// handmatige invoer (slaap, stappen, gewicht) blijft staan. Via je eigen sessie
// (RLS): je kunt alleen je eigen rijen wissen.
//
// Daarna stopt de app pas met syncen als je ook in Health Connect / Apple
// Health de toegang intrekt; dat zegt de UI erbij.

import { NextResponse, type NextRequest } from 'next/server'
import { gebruikerSessie } from '@/lib/supabase/gebruiker'
import { isRateLimited } from '@/lib/utils/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TABELLEN = ['health_workouts', 'health_sync_status', 'health_native_logs'] as const

export async function POST(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  if (isRateLimited(`gezondheid-wissen:${sessie.user.id}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ fout: 'Even te vaak geprobeerd. Probeer het later opnieuw.' }, { status: 429 })
  }

  const body: unknown = await req.json().catch(() => null)
  const bevestigd = typeof body === 'object' && body !== null && (body as Record<string, unknown>).bevestig === 'VERWIJDER'
  if (!bevestigd) return NextResponse.json({ fout: 'Bevestiging ontbreekt.' }, { status: 400 })

  for (const tabel of TABELLEN) {
    const { error } = await sessie.db.from(tabel).delete().eq('user_id', sessie.user.id)
    if (error) {
      console.error(`[gezondheid/verwijderen] ${tabel}`, error)
      return NextResponse.json({ fout: 'Verwijderen is niet volledig gelukt. Probeer het opnieuw.' }, { status: 502 })
    }
  }
  return NextResponse.json({ ok: true })
}
