// ─── GET/POST /api/aiyourgym/cron/club-outbox: opdrachten aan Stripe ───────
// Elke minuut via cron-job.org. Slot: het gedeelde CRON_SECRET in de header
// x-cron-secret (fail-closed: leeg = niemand komt binnen; nooit in de URL).
// Doet niets zonder CLUB_BETALEN_ACTIEF=1 en CLUB_LIDGELD_ACTIEF=1 plus de
// Stripe-sleutel. Twee runs tegelijk voeren nooit dubbel uit (skip locked en
// een vaste idempotentiesleutel per opdracht). Zie src/lib/club/betalen/outbox/.

import { type NextRequest, NextResponse } from 'next/server'
import { betalenActief, clubStripeSleutel, lidgeldActief } from '@/lib/club/betalen/config'
import { supabaseOutbox } from '@/lib/club/betalen/outbox/opslag-supabase'
import { echteStripe } from '@/lib/club/betalen/outbox/stripe-client'
import { werkOutboxAf } from '@/lib/club/betalen/outbox/werker'
import { clubDatabase } from '@/lib/club/kern/database'
import { geheimGelijk } from '@/lib/club/kern/pin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_PER_RUN = 25

function antwoord(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function verwerk(req: NextRequest): Promise<NextResponse> {
  if (!geheimGelijk(process.env.CRON_SECRET ?? '', req.headers.get('x-cron-secret'))) return antwoord({ fout: 'Unauthorized' }, 401)
  const sleutel = clubStripeSleutel()
  if (!betalenActief() || !lidgeldActief() || !sleutel) return antwoord({ aan: false })
  try {
    const verslag = await werkOutboxAf({ opslag: supabaseOutbox(clubDatabase()), stripe: echteStripe(sleutel), nu: () => new Date() }, { max: MAX_PER_RUN })
    return antwoord({ aan: true, ...verslag })
  } catch (err) {
    console.error('[club-outbox] cron mislukt', err instanceof Error ? err.name : 'onbekend')
    return antwoord({ fout: 'Verwerken mislukt.' }, 500)
  }
}

export const GET = verwerk
export const POST = verwerk
