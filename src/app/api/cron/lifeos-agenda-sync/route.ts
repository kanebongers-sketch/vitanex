// ─── LifeOS — GET /api/cron/lifeos-agenda-sync ──────────────────────────────
// Houdt de agenda-cache (`agenda_events`) warm zonder dat Kane een pagina hoeft
// te openen. De briefing ververst de agenda ook zelf, maar die draait één keer
// per ochtend; deze cron dekt de rest van de dag, zodat de agenda-kaart en een
// tussentijdse Vita-vraag óók op verse afspraken draaien.
//
// De sync-logica zelf staat in `@/lib/lifeos/agenda/sync`. Deze route is enkel de
// server-to-server ingang: geen sessie, dus geen founder-gate — het slot is het
// gedeelde `CRON_SECRET`, fail-closed, precies als `cron/dagplanning-mail`.
//
// ─── INPLANNEN ──────────────────────────────────────────────────────────────
//   Primair: de database-klok (pg_cron, migratie 270), elk half uur 05–21 UTC op
//   de minuut. Back-up: `.github/workflows/lifeos-agenda-sync.yml` (GitHub-cron
//   alléén liep maar ± 4× per dag). Beide sturen `CRON_SECRET` mee; het geheim
//   staat in Vault als `lifeos_cron_secret`.
//
//   Idempotent: twee runs leveren dezelfde rijen op (unieke index uit migratie
//   020). Een dubbele of late run kan dus geen kwaad.

import { type NextRequest } from 'next/server'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'
import { syncAgenda } from '@/lib/lifeos/agenda/sync'
import { hernoemAfspraken } from '@/lib/lifeos/agenda/hernoem'
import { voerAutomatischeActiesUit } from '@/lib/lifeos/automatisch/uitvoeren'
import { kleurAfspraken } from '@/lib/lifeos/agenda/kleuren'
import { verwerkMail } from '@/lib/lifeos/mail-taken/uitvoeren'
import { planAgendaBlokken } from '@/lib/lifeos/blokken/uitvoeren'
import { haalOverzicht } from '@/lib/lifeos/beleggen/dienst'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function fout(melding: string, status: number): Response {
  return Response.json({ fout: melding }, { status, headers: { 'Cache-Control': 'no-store' } })
}

function klaar(body: Record<string, unknown>): Response {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Fail-closed, gespiegeld aan `cron/dagplanning-mail`: zonder geconfigureerd
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
    case 'ok': {
      // De cache is vers — hernoem nu de kale-naam-afspraken in je PERSOONLIJKE
      // agenda naar de volledige naam + rol-tag ("Kevin" → "Kevin Cranenbroeck PT").
      // Best-effort: een fout hierin mag de geslaagde sync niet omkeren; hij wordt
      // gelogd en de volgende ronde probeert het opnieuw (idempotent).
      // Eerst de automatische acties (status → actief, typfouten, nieuwe PT-namen),
      // zodat een net toegevoegde naam in dezelfde ronde al hernoemd kan worden.
      // Best-effort, net als het hernoemen: een fout keert de sync niet om.
      let automatisch = 0
      try {
        automatisch = (await voerAutomatischeActiesUit(admin, userId)).uitgevoerd
      } catch (oorzaak) {
        console.error('[lifeos/cron-agenda-sync] automatische acties wierpen een fout', oorzaak)
      }
      let hernoemd = 0
      let geblokkeerd = 0
      try {
        const h = await hernoemAfspraken(admin, userId)
        if (h.staat === 'ok') {
          hernoemd = h.hernoemd
          geblokkeerd = h.geblokkeerd
        } else {
          console.warn(`[lifeos/cron-agenda-sync] hernoemen niet ok (${h.staat}).`)
        }
      } catch (oorzaak) {
        console.error('[lifeos/cron-agenda-sync] hernoemen wierp een fout', oorzaak)
      }
      // Tot slot de kleuren per categorie (na het hernoemen: de titel bepaalt de
      // categorie). Best-effort, zoals de rest.
      let gekleurd = 0
      try {
        const k = await kleurAfspraken(admin, userId)
        if (k.staat === 'ok') gekleurd = k.gekleurd
      } catch (oorzaak) {
        console.error('[lifeos/cron-agenda-sync] kleuren wierp een fout', oorzaak)
      }
      // Mail → to-do (en afvinken wat je al beantwoordde), dán de blokken: zo komt
      // een net binnengekomen mail in dezelfde ronde al in het mail-blok.
      let mail: Record<string, unknown> = { nieuw: 0, afgevinkt: 0 }
      try {
        const m = await verwerkMail(admin, userId)
        mail = {
          nieuw: m.nieuw.length,
          afgevinkt: m.afgevinkt.length,
          wachtend: m.wachtend ?? 0,
          kandidaten: m.kandidaten ?? 0,
          redenen: m.redenen ?? {},
          ...(m.fout ? { fout: m.fout } : {}),
        }
      } catch (oorzaak) {
        console.error('[lifeos/cron-agenda-sync] mail verwerken wierp een fout', oorzaak)
      }
      let blokken = { gepland: 0, opgeruimd: 0, hersteld: 0 }
      try {
        const b = await planAgendaBlokken(admin, userId)
        blokken = { gepland: b.gepland.length, opgeruimd: b.opgeruimd, hersteld: b.hersteld }
      } catch (oorzaak) {
        console.error('[lifeos/cron-agenda-sync] blokken plannen wierp een fout', oorzaak)
      }
      // Beleggingen: koersen verversen en de dagwaarde vastleggen, ook als je het
      // dashboard niet opent — anders krijgt het verloop gaten. Best-effort.
      const beleggingen = await haalOverzicht(admin, userId)
        .then((o) => (o ? o.totaal.waardeEur : null))
        .catch(() => null)
      return klaar({
        gesynct: uitkomst.gesynct,
        beleggingen,
        mail,
        blokken,
        gekleurd,
        hernoemd,
        geblokkeerd,
        automatisch,
        van: uitkomst.van.toISOString(),
        tot: uitkomst.tot.toISOString(),
      })
    }
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
