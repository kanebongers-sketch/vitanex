// ─── LifeOS — GET /api/cron/lifeos-agenda-sync ──────────────────────────────
// Houdt de agenda-cache (`agenda_events`) warm zonder dat Kane een pagina hoeft
// te openen. De briefing ververst de agenda ook zelf, maar die draait één keer
// per ochtend; deze cron dekt de rest van de dag, zodat de agenda-kaart en een
// tussentijdse Vita-vraag óók op verse afspraken draaien.
//
// De sync-logica zelf staat in `@/lib/lifeos/agenda/sync`. Deze route is enkel de
// server-to-server ingang: geen sessie, dus geen founder-gate — het slot is het
// gedeelde `CRON_SECRET`, fail-closed, precies als `cron/lifeos-briefing`.
//
// ─── INPLANNEN (dit doet zichzelf niet) ─────────────────────────────────────
//   Render kent geen cron-veld in de repo en er is geen vercel.json. De planner
//   staat daarom buiten de app, in `.github/workflows/lifeos-agenda-sync.yml`,
//   net als de briefing. Zet `CRON_SECRET` in de repo-secrets (zelfde waarde als
//   in Render) en draai de workflow één keer handmatig om te zien dát hij werkt.
//
//   Idempotent: twee runs leveren dezelfde rijen op (unieke index uit migratie
//   020). Een dubbele of late run kan dus geen kwaad.

import { type NextRequest } from 'next/server'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'
import { syncAgenda } from '@/lib/lifeos/agenda/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fout(melding: string, status: number): Response {
  return Response.json({ fout: melding }, { status, headers: { 'Cache-Control': 'no-store' } })
}

function klaar(body: Record<string, unknown>): Response {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Fail-closed, gespiegeld aan `cron/lifeos-briefing`: zonder geconfigureerd
 * `CRON_SECRET` is deze route niet aanroepbaar. Constant-tijd-vergelijking, want
 * een gedeeld geheim in een header hoort niet met een kale `===` vergeleken te
 * worden.
 */
function secretGeldig(req: NextRequest): boolean {
  const gegeven = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  return geheimGelijk(process.env.CRON_SECRET ?? '', gegeven)
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!secretGeldig(req)) return fout('Unauthorized', 401)

  let admin: ReturnType<typeof createLifeosAdminClient>
  let userId: string
  try {
    admin = createLifeosAdminClient()
    userId = lifeosUserId()
  } catch (oorzaak) {
    const melding = oorzaak instanceof Error ? oorzaak.message : 'Configuratie ontbreekt.'
    console.error('[lifeos/cron-agenda-sync] configuratiefout:', melding)
    return fout(melding, 503)
  }

  let uitkomst: Awaited<ReturnType<typeof syncAgenda>>
  try {
    uitkomst = await syncAgenda(admin, userId)
  } catch (oorzaak) {
    console.error('[lifeos/cron-agenda-sync] sync wierp een fout', oorzaak)
    return fout('Kon de agenda niet synchroniseren.', 503)
  }

  switch (uitkomst.staat) {
    case 'ok':
      return klaar({ gesynct: uitkomst.gesynct, van: uitkomst.van.toISOString(), tot: uitkomst.tot.toISOString() })
    case 'niet_gekoppeld':
      // Geen fout: er is simpelweg niets te syncen. 200 zodat de workflow niet
      // elke keer als "mislukt" oplicht terwijl er niets aan de hand is.
      return klaar({ gesynct: 0, reden: 'niet_gekoppeld' })
    case 'verlopen':
      return fout('De agendakoppeling is verlopen. Koppel opnieuw.', 409)
    case 'onbereikbaar':
      return fout('Google is niet bereikbaar.', 502)
    case 'opslag_fout':
      return fout(uitkomst.melding, 502)
  }
}
