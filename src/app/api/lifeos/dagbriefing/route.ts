// ─── LifeOS — GET /api/lifeos/dagbriefing ───────────────────────────────────
// De Orchestrator-dagbriefing: één AI-geschreven ochtendbriefing die de échte
// data van de founder samenvat tot prioriteiten, risico's en kansen. Deze route
// doet het vieze werk — data verzamelen achter de founder-gate — en reikt een
// COMPACT feiten-object aan de pure logica (`lib/lifeos/dagbriefing`).
//
// ─── TWEE DATABRONNEN ───────────────────────────────────────────────────────
// Taken/CRM/agenda komen uit het EIGEN LifeOS-Supabase-project (`toegang.admin`).
// Welzijn (de 6 pijlers) leeft in de MentaForce-B2B-database: dat is waar Kane's
// stress/stemming/slaap écht gelogd worden (zie de /home-merge). Die halen we
// best-effort met de MentaForce-admin + Kane's B2B-user-id op.
//
// ─── EERLIJK ────────────────────────────────────────────────────────────────
// Alleen échte data. Een domein zonder data → "geen data"/weglaten, nooit een
// verzonnen getal. Een LEES-fout op de kern-LifeOS-data → 502 (ik kan het niet
// lezen, en dat zeg ik). Een model-/configfout → de deterministische fallback,
// 200 — de kaart breekt nooit.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { haalTaken } from '@/lib/lifeos/taken/opslag'
import { groepeerTaken } from '@/lib/lifeos/taken/taken'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { verdeelRitme } from '@/components/lifeos/crm/ritme'
import { haalEventsUitCache } from '@/lib/lifeos/agenda/opslag'
import { eerstvolgendeAfspraak, type Afspraak } from '@/lib/lifeos/agenda/vrije-blokken'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import { berekenPijlerOverzicht, type PijlerOverzicht } from '@/lib/pijlers/pijlers-server'
import { pijlerDef } from '@/lib/pijlers/pijlers'
import { haalTransacties, haalFacturen } from '@/lib/lifeos/finance/opslag'
import { bouwOverzicht, type Factuur, type Transactie } from '@/lib/lifeos/finance/finance'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  stelDagbriefingSamen,
  type AgendaFeiten,
  type BriefingModel,
  type CrmFeiten,
  type DagbriefingFeiten,
  type FinanceFeiten,
  type TakenFeiten,
  type WelzijnFeiten,
} from '@/lib/lifeos/dagbriefing/dagbriefing'
import { maakAnthropicBriefingModel } from '@/lib/lifeos/dagbriefing/dagbriefing-model'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Persoonlijke data: nooit in een gedeelde cache. `Vary: Authorization`
// voorkomt dat een gedeelde cache het antwoord tussen sessies hergebruikt.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

const TIJD_FMT = new Intl.DateTimeFormat('nl-NL', {
  timeZone: 'Europe/Amsterdam',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Eén nette 502 voor elke kern-leesfout, zodat de tak niet uiteenloopt. */
function foutAntwoord(): Response {
  return NextResponse.json(
    { fout: 'Kon je gegevens niet ophalen.' },
    { status: 502, headers: CACHE_HEADERS },
  )
}

export async function GET(req: NextRequest): Promise<Response> {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const nu = new Date()
  const vandaag = datumSleutel(nu)

  // ── Kern-data uit het LifeOS-project: taken, CRM, agenda-vandaag ────────────
  const dagStart = new Date(nu)
  dagStart.setHours(0, 0, 0, 0)
  const dagEind = new Date(dagStart)
  dagEind.setDate(dagEind.getDate() + 1)

  let takenUit: Awaited<ReturnType<typeof haalTaken>>
  let personenUit: Awaited<ReturnType<typeof haalPersonen>>
  let agendaUit: Awaited<ReturnType<typeof haalEventsUitCache>>
  try {
    ;[takenUit, personenUit, agendaUit] = await Promise.all([
      haalTaken(toegang.admin, toegang.userId, { alleenOpen: true }),
      haalPersonen(toegang.admin, toegang.userId),
      haalEventsUitCache(toegang.admin, toegang.userId, dagStart, dagEind),
    ])
  } catch {
    // Een netwerk-/timeout-worp (geen nette Uitkomst) is óók een leesfout.
    return foutAntwoord()
  }

  // Een LEES-fout op de kern is geen leeg dashboard maar een storing: 502, niet
  // stil "je hebt niets". Fout ≠ leeg — dezelfde regel als overal in LifeOS.
  if (!takenUit.ok || !personenUit.ok || !agendaUit.ok) {
    return foutAntwoord()
  }

  const taken = naarTakenFeiten(takenUit.waarde, vandaag)
  const crm = naarCrmFeiten(personenUit.waarde, nu)
  const agenda = naarAgendaFeiten(agendaUit.waarde, nu)

  // ── Best-effort: welzijn (andere database) én finance (eigen project) ───────
  // Beide mogen falen zonder de briefing op te blazen: dan zijn ze gewoon null.
  const maand = vandaag.slice(0, 7)
  const [welzijn, finance] = await Promise.all([
    haalWelzijn(req),
    haalFinance(toegang.admin, toegang.userId, maand, vandaag),
  ])

  const feiten: DagbriefingFeiten = { taken, crm, agenda, welzijn, finance, nu }

  // Het model is optioneel: mist de sleutel of valt de config weg, dan blijft
  // `model` null en levert `stelDagbriefingSamen` de deterministische briefing.
  let model: BriefingModel | null = null
  try {
    model = maakAnthropicBriefingModel()
  } catch {
    model = null
  }

  const briefing = await stelDagbriefingSamen(feiten, model)
  return NextResponse.json(briefing, { headers: CACHE_HEADERS })
}

// ─── Feiten bouwen ──────────────────────────────────────────────────────────

/** Titels van open taken; `groepeerTaken` houdt de top-3 vooraan bij 'vandaag'. */
function naarTakenFeiten(
  taken: Parameters<typeof groepeerTaken>[0],
  vandaag: string,
): TakenFeiten {
  const groep = groepeerTaken(taken, vandaag)
  return {
    vandaagAantal: groep.vandaag.length,
    vandaagTitels: groep.vandaag.map((t) => t.titel),
    teLaatAantal: groep.teLaat.length,
    teLaatTitels: groep.teLaat.map((t) => t.titel),
  }
}

/** Wie moet deze week (nog) gesproken worden? `verdeelRitme` is puur en getest. */
function naarCrmFeiten(
  personen: Parameters<typeof verdeelRitme>[0],
  nu: Date,
): CrmFeiten {
  const { teSpreken } = verdeelRitme(personen, nu)
  return {
    teSprekenAantal: teSpreken.length,
    teSprekenNamen: teSpreken.map((p) => p.naam),
  }
}

function naarAgendaFeiten(events: readonly Afspraak[], nu: Date): AgendaFeiten {
  const volgende = eerstvolgendeAfspraak(events, nu)
  return {
    aantal: events.length,
    eerstvolgende: volgende
      ? { titel: volgende.titel ?? '(zonder titel)', tijd: TIJD_FMT.format(volgende.startOp) }
      : null,
  }
}

// ─── Welzijn (best-effort) ──────────────────────────────────────────────────
// De pijlers leven in de MentaForce-B2B-database, niet in het LifeOS-project.
// Alles hier is best-effort: mist de env, faalt de query of is er niets gemeten,
// dan is `welzijn` gewoon null en zwijgt de briefing er eerlijk over.

async function haalWelzijn(req: NextRequest): Promise<WelzijnFeiten | null> {
  try {
    // De founder-gate liet ons hier; dezelfde (gecachete) user levert het B2B-id.
    const user = await getAuthenticatedUser(req)
    if (!user) return null
    const mfAdmin = createAdminClient()
    const overzicht = await berekenPijlerOverzicht(mfAdmin, user.id)
    return naarWelzijnFeiten(overzicht)
  } catch {
    return null
  }
}

/** Overzicht → feiten. `null` als er geen enkele pijler data heeft (dan: weglaten). */
function naarWelzijnFeiten(overzicht: PijlerOverzicht): WelzijnFeiten | null {
  const metData = overzicht.pijlers.filter(
    (p): p is typeof p & { score: number } => p.score !== null,
  )
  if (metData.length === 0) return null

  const laagste = metData.reduce((laag, p) => (p.score < laag.score ? p : laag))
  return {
    wellbeingScore: overzicht.wellbeing.score,
    laagstePijler: {
      label: pijlerDef(laagste.key)?.label ?? laagste.key,
      score: laagste.score,
    },
  }
}

// ─── Finance (best-effort, eigen LifeOS-project) ────────────────────────────
// Omzet/kosten/winst deze maand + openstaand + verlopen facturen. Alles hier is
// best-effort: faalt een lees → finance = null en de briefing zwijgt er eerlijk
// over. Nooit een 502 op finance — de kern-tak hierboven bewaakt dat al.

/** De maand vóór `maand` ('YYYY-MM'), voor de "is finance in gebruik?"-check. */
function vorigeMaandVan(maand: string): string {
  const jaar = Number(maand.slice(0, 4))
  const m = Number(maand.slice(5, 7))
  const pj = m === 1 ? jaar - 1 : jaar
  const pm = m === 1 ? 12 : m - 1
  return `${pj}-${String(pm).padStart(2, '0')}`
}

async function haalFinance(
  admin: SupabaseClient,
  userId: string,
  maand: string,
  vandaag: string,
): Promise<FinanceFeiten | null> {
  try {
    const [transactiesUit, facturenUit] = await Promise.all([
      haalTransacties(admin, userId),
      haalFacturen(admin, userId),
    ])
    if (!transactiesUit.ok || !facturenUit.ok) return null
    return naarFinanceFeiten(transactiesUit.waarde, facturenUit.waarde, maand, vandaag)
  } catch {
    return null
  }
}

/**
 * Overzicht → feiten. `null` als er deze én vorige maand geen transactie is én
 * geen enkele factuur: dan is finance niet in gebruik en zwijgt de briefing.
 */
function naarFinanceFeiten(
  transacties: readonly Transactie[],
  facturen: readonly Factuur[],
  maand: string,
  vandaag: string,
): FinanceFeiten | null {
  const vorige = vorigeMaandVan(maand)
  const heeftData =
    facturen.length > 0 ||
    transacties.some((t) => t.datum.slice(0, 7) === maand || t.datum.slice(0, 7) === vorige)
  if (!heeftData) return null

  const overzicht = bouwOverzicht(transacties, facturen, maand, vandaag)
  return {
    omzet: overzicht.omzet,
    kosten: overzicht.kosten,
    winst: overzicht.winst,
    openstaand: overzicht.openstaand,
    verlopenAantal: overzicht.verlopenAantal,
  }
}
