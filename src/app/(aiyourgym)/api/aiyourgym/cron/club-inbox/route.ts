// ─── GET/POST /api/aiyourgym/cron/club-inbox: Stripe-events inhalen ─────────
// Elke minuut via cron-job.org. Verwerkt wat de webhook niet meteen afkreeg
// (time-out, herhaling na een fout, of een werker die wegviel). Slot: het
// gedeelde CRON_SECRET in de header x-cron-secret (fail-closed; nooit in de
// URL). Doet niets zonder CLUB_BETALEN_ACTIEF=1 en CLUB_LIDGELD_ACTIEF=1 plus
// de Stripe-sleutel. Zie src/lib/club/betalen/inbox/.

import { type NextRequest, NextResponse } from 'next/server'
import { betalenActief, clubStripeSleutel, lidgeldActief, sleutelIsLive } from '@/lib/club/betalen/config'
import { supabaseInbox } from '@/lib/club/betalen/inbox/opslag-supabase'
import { werkInboxAf } from '@/lib/club/betalen/inbox/verwerk'
import { echteStripe } from '@/lib/club/betalen/outbox/stripe-client'
import { clubDatabase } from '@/lib/club/kern/database'
import { geheimGelijk } from '@/lib/club/kern/pin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_PER_RUN = 50

function antwoord(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function verwerk(req: NextRequest): Promise<NextResponse> {
  if (!geheimGelijk(process.env.CRON_SECRET ?? '', req.headers.get('x-cron-secret'))) return antwoord({ fout: 'Unauthorized' }, 401)
  const sleutel = clubStripeSleutel()
  if (!betalenActief() || !lidgeldActief() || !sleutel) return antwoord({ aan: false })
  try {
    const live = sleutelIsLive(sleutel)
    const deps = { opslag: supabaseInbox(clubDatabase(), live), stripe: echteStripe(sleutel), liveVerwacht: live, nu: () => new Date() }
    const verslag = await werkInboxAf(deps, { max: MAX_PER_RUN })
    return antwoord({ aan: true, ...verslag })
  } catch (err) {
    console.error('[club-inbox] cron mislukt', err instanceof Error ? err.name : 'onbekend')
    return antwoord({ fout: 'Verwerken mislukt.' }, 500)
  }
}

export const GET = verwerk
export const POST = verwerk
