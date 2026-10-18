// GET /api/status: gezondheidscontrole voor een gratis uptime-dienst
// (bijv. cron-job.org). Antwoordt { ok, db } en verder niets: geen gegevens,
// geen versie, geen foutdetails. 200 als alles werkt, 503 als de database niet
// (op tijd) antwoordt. Nooit gecachet. (/api/gezondheid is al van MentaForce.)
// Uitleg voor het instellen: docs/club/LIVEGANG.md.

import { NextResponse, type NextRequest } from 'next/server'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { meetDatabase } from '@/lib/club/betrouwbaarheid/database'
import { statusAntwoord, type DbStand } from '@/lib/club/betrouwbaarheid/status'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEEN_CACHE = { 'Cache-Control': 'no-store, max-age=0', 'X-Robots-Tag': 'noindex' } as const

async function dbStand(): Promise<DbStand> {
  try {
    return (await meetDatabase(createLifeosAdminClient())).stand
  } catch {
    return 'fout'
  }
}

export async function GET(req: NextRequest) {
  // Een uptime-dienst vraagt hooguit een paar keer per minuut; dit remt misbruik.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'onbekend'
  // Het IP uit X-Forwarded-For is te vervalsen: daarom ook een grens voor iedereen samen.
  if (isRateLimited(`status:${ip}`, 30, 60_000) || isRateLimited('status:alles', 120, 60_000)) {
    return NextResponse.json({ ok: false, db: 'onbekend' }, { status: 429, headers: GEEN_CACHE })
  }
  const { body, status } = statusAntwoord(await dbStand())
  return NextResponse.json(body, { status, headers: GEEN_CACHE })
}

export async function HEAD(req: NextRequest) {
  const antwoord = await GET(req)
  return new NextResponse(null, { status: antwoord.status, headers: GEEN_CACHE })
}
