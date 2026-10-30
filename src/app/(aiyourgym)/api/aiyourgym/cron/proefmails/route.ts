// ─── GET/POST /api/aiyourgym/cron/proefmails: startmails na het aanmelden ───
// Drie tips in de eerste dagen (dag 1, 3 en 7). Er is geen proefperiode meer
// (besluit Kane 30-10-2026); het pad heet nog proefmails zodat een bestaande
// cron-taak blijft werken.
// Bijvoorbeeld elk uur via cron-job.org. Slot: het gedeelde CRON_SECRET in de
// header x-cron-secret (fail-closed: leeg = niemand komt binnen; nooit in de URL).
// Er gaat alleen iets weg met AIYOURGYM_PROEFMAILS=1 plus AIYOURGYM_RESEND_FROM
// en RESEND_API_KEY; anders antwoordt de route met aan: false en doet niets.
// Zie src/lib/aiyourgym/proefmails/.

import { type NextRequest, NextResponse } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { geheimGelijk } from '@/lib/club/kern/pin'
import { verstuurProefmails } from '@/lib/aiyourgym/proefmails/versturen'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function antwoord(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function verwerk(req: NextRequest): Promise<NextResponse> {
  if (!geheimGelijk(process.env.CRON_SECRET ?? '', req.headers.get('x-cron-secret'))) return antwoord({ fout: 'Unauthorized' }, 401)
  try {
    const verslag = await verstuurProefmails(clubDatabase(), new Date())
    return verslag ? antwoord({ ...verslag }) : antwoord({ fout: 'De aanmeldingen konden niet gelezen worden.' }, 502)
  } catch (err) {
    console.error('[aiyourgym] proefmails cron mislukt', err instanceof Error ? err.message : 'onbekend')
    return antwoord({ fout: 'Verwerken mislukt.' }, 500)
  }
}

export const GET = verwerk
export const POST = verwerk
