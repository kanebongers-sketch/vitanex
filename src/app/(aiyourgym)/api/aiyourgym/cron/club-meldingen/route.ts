// ─── GET/POST /api/cron/club-meldingen: de wachtrij met meldingen aan leden ──
// Elke 5 minuten via cron-job.org. Slot: het gedeelde CRON_SECRET in de header
// x-cron-secret (fail-closed: leeg = niemand komt binnen; nooit in de URL).
// Verstuurt wat aan de beurt is (zie src/lib/club/meldingen/versturen.ts).
// Mailen alleen met CLUB_MAILS_ACTIEF=1 plus CLUB_RESEND_API_KEY en
// CLUB_RESEND_FROM; zonder die worden mails overgeslagen en verschijnen de
// meldingen alleen in de ledenapp. Push (web push naar de toestellen van een
// lid) alleen met CLUB_PUSH_ACTIEF=1 plus de CLUB_VAPID_-sleutels, nooit voor
// demo. Twee runs tegelijk versturen nooit dubbel (claim per rij).

import { type NextRequest, NextResponse } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { geheimGelijk } from '@/lib/club/kern/pin'
import { verwerkWachtrij } from '@/lib/club/meldingen/versturen'
import { pushActief } from '@/lib/club/push/sleutels'
import { ruimProfielfotosOp } from '@/lib/club/profielfoto/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function antwoord(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function verwerk(req: NextRequest): Promise<NextResponse> {
  if (!geheimGelijk(process.env.CRON_SECRET ?? '', req.headers.get('x-cron-secret'))) return antwoord({ fout: 'Unauthorized' }, 401)
  try {
    const admin = clubDatabase()
    const verslag = await verwerkWachtrij(admin)
    // Vervallen profielfoto's (weggehaald, lid verwijderd, uit dienst, bewaartermijn): bestanden weg.
    await ruimProfielfotosOp(admin)
    if (!verslag) return antwoord({ fout: 'De wachtrij kon niet gelezen worden.' }, 502)
    return antwoord({ ...verslag, mailsActief: process.env.CLUB_MAILS_ACTIEF === '1', pushActief: pushActief(process.env) })
  } catch (err) {
    console.error('[club-meldingen] cron mislukt', err instanceof Error ? err.message : 'onbekend')
    return antwoord({ fout: 'Verwerken mislukt.' }, 500)
  }
}

export const GET = verwerk
export const POST = verwerk
