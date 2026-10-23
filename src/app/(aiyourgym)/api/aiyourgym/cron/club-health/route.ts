// ─── GET/POST /api/aiyourgym/cron/club-health: koppelingen bijwerken ───────
// Elke 15 minuten via cron-job.org. Haalt per koppeling die aan de beurt is
// (volgende_sync_op voorbij, of net gemeld door een webhook) de nieuwe gegevens
// op. Slot: het gedeelde CRON_SECRET in de kop x-cron-secret (nooit in de URL).
// Doet niets zonder CLUB_HEALTH_ACTIEF=1 en een geldige CLUB_HEALTH_SLEUTEL.

import { type NextRequest, NextResponse } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { geheimGelijk } from '@/lib/club/kern/pin'
import { healthKlaar } from '@/lib/club/health/schakelaar'
import { koppelingenTeSyncen } from '@/lib/club/health/opslag-cron'
import { echteHttp, supabaseSyncOpslag } from '@/lib/club/health/opslag'
import { bronContext } from '@/lib/club/health/server'
import { synchroniseer, type SyncStatus } from '@/lib/club/health/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_PER_RUN = 25

function antwoord(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function verwerk(req: NextRequest): Promise<NextResponse> {
  if (!geheimGelijk(process.env.CRON_SECRET ?? '', req.headers.get('x-cron-secret'))) return antwoord({ fout: 'Unauthorized' }, 401)
  if (!healthKlaar()) return antwoord({ aan: false })
  try {
    const admin = clubDatabase()
    const lijst = await koppelingenTeSyncen(admin, new Date(), MAX_PER_RUN)
    if (!lijst) return antwoord({ fout: 'Lezen mislukt.' }, 500)
    const telling: Partial<Record<SyncStatus | 'overgeslagen', number>> = {}
    const opslag = supabaseSyncOpslag(admin)
    // Na elkaar: zo blijven we ruim binnen de limieten van de leveranciers.
    for (const k of lijst) {
      const ctx = bronContext(k.bron)
      const status = ctx ? (await synchroniseer({ adapter: ctx.adapter, sleutels: ctx.sleutels, hoofdsleutel: ctx.hoofdsleutel, opslag, http: echteHttp, nu: new Date() }, k)).status : 'overgeslagen'
      telling[status] = (telling[status] ?? 0) + 1
    }
    return antwoord({ aan: true, verwerkt: lijst.length, ...telling })
  } catch (err) {
    console.error('[club-health] cron mislukt', err instanceof Error ? err.name : 'onbekend')
    return antwoord({ fout: 'Verwerken mislukt.' }, 500)
  }
}

export const GET = verwerk
export const POST = verwerk
