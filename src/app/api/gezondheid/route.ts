// GET /api/gezondheid?dagen=40 — je samengevoegde gezondheidsdata per dag
// (native bronnen + eigen invoer), je trainingen en de sync-status per bron.
// Loopt via je eigen sessie (RLS); nooit de service-role.

import { NextResponse, type NextRequest } from 'next/server'
import { gebruikerSessie } from '@/lib/supabase/gebruiker'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { haalGezondheidOp, GezondheidLeesFout } from '@/lib/gezondheid/ophalen-server'
import { verschuifDatum } from '@/lib/gezondheid/statistiek'
import { TIJDZONE } from '@/lib/gezondheid/samenvoegen'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEEN_CACHE = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } as const
const MIN_DAGEN = 7
const MAX_DAGEN = 400
const STANDAARD_DAGEN = 40

function leesDagen(ruw: string | null): number {
  const n = ruw === null ? STANDAARD_DAGEN : Number.parseInt(ruw, 10)
  if (!Number.isFinite(n)) return STANDAARD_DAGEN
  return Math.min(Math.max(n, MIN_DAGEN), MAX_DAGEN)
}

export async function GET(req: NextRequest) {
  const sessie = await gebruikerSessie(req)
  if (!sessie) return NextResponse.json({ fout: 'Niet ingelogd.' }, { status: 401 })
  if (isRateLimited(`gezondheid:${sessie.user.id}`, 60, 60_000)) {
    return NextResponse.json({ fout: 'Even te vaak ververst. Probeer het zo opnieuw.' }, { status: 429 })
  }

  const dagen = leesDagen(req.nextUrl.searchParams.get('dagen'))
  const vandaag = new Intl.DateTimeFormat('sv-SE', { timeZone: TIJDZONE }).format(new Date())
  const vanaf = verschuifDatum(vandaag, -(dagen - 1))

  try {
    const antwoord = await haalGezondheidOp(sessie.db, sessie.user.id, vanaf, vandaag)
    return NextResponse.json(antwoord, { headers: GEEN_CACHE })
  } catch (fout) {
    const detail = fout instanceof GezondheidLeesFout ? fout.message : String(fout)
    console.error('[api/gezondheid] ophalen mislukt', detail)
    return NextResponse.json({ fout: 'Je gezondheidsdata kon niet worden geladen.' }, { status: 502 })
  }
}
