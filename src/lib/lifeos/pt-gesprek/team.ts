// ─── LifeOS — PT-team: je coachgesprekken van dichtbij (puur) ──────────────
// Per teamlid, uit je agenda + de laatste evaluatie:
//   - `nuBezigOp`: het coachgesprek loopt nu (of eindigde < 1 uur geleden) en is
//     nog niet verslagen → het dashboard opent het formulier vanzelf;
//   - `teVerslaan`: het laatste gesprek is geweest, maar er is nog geen verslag;
//   - `vorige`: wat jullie vorige keer bespraken (scores, notitie, aandachtspunt);
//   - `voorstelVolgende`: het volgende gesprek, een week (ritme.ts) na het laatste op
//     hetzelfde tijdstip — een dag opgeschoven als dat botst. Een voorstel dat je
//     goedkeurt, geen afspraak die LifeOS zelf zet.
// PUUR: geen fetch, geen Date.now() — `nu` komt erin.

import { matchtCoachgesprek } from './pt-gesprek'
import type { OpenPunt } from '@/lib/lifeos/pt-coaching/aandachtspunten'
import { GESPREK_DUUR_MIN, RITME_DAGEN } from './ritme'
import type { LeadSamenvatting, PinStatus } from '@/lib/lifeos/leads/leads'
import type { Checkin } from '@/lib/lifeos/pt-dashboard/checkin'

export interface AgendaBlok {
  titel: string | null
  startOp: Date
  eindOp: Date | null
  heleDag: boolean
}

export interface VorigeEvaluatie {
  /** Id van het verslag (voor de pdf-download). */
  id: string
  /** ISO-moment waarop het verslag werd opgeslagen. */
  op: string
  scores: { algemeen: number; energie: number; voortgang: number }
  notitie: string | null
  aandachtspunt: string | null
}

/** Eén punt in het scoreverloop van een PT'er (oudste eerst in de lijst). */
export interface VerloopPunt {
  op: string
  scores: { algemeen: number; energie: number; voortgang: number }
}

export interface TeamExtra {
  laatsteGesprekOp: string | null
  nuBezigOp: string | null
  teVerslaan: boolean
  vorige: VorigeEvaluatie | null
  voorstelVolgende: string | null
  /** Open aandachtspunten uit eerdere gesprekken (leeg als er geen zijn). */
  openPunten?: OpenPunt[]
  /** De scores van de laatste gesprekken, oudste eerst. */
  verloop?: VerloopPunt[]
  /** De lead-link van deze PT'er (/lead/<code>) en de stand van zijn pincode. */
  leadLink?: LeadLinkInfo | null
  /** Leads sinds het vorige gesprek (of de afgelopen week). */
  leads?: LeadSamenvatting | null
  /** Eén regel over de lopende PT-abonnementen van deze PT'er (zie `klantRegel`). */
  klanten?: string | null
  /** De weekcheck-in die de PT'er deze week op zijn dashboard invulde, of null. */
  checkin?: Checkin | null
}

export interface LeadLinkInfo {
  code: string
  pinStatus: PinStatus
  pinAangevraagdOp: string | null
  /** Bij een wachtende pin: de controlecode om na te vragen. */
  controle?: string
}

const MIN = 60_000
const DAG = 24 * 60 * MIN
const GESPREK_MIN = GESPREK_DUUR_MIN
/** Zo lang na het einde springt het formulier nog vanzelf open. */
const NA_AFLOOP_MS = 60 * MIN
/** Een gesprek ouder dan dit vraagt geen verslag meer. */
const VERSLAG_VENSTER_MS = 21 * DAG

function eind(b: AgendaBlok): number {
  return b.eindOp ? b.eindOp.getTime() : b.startOp.getTime() + GESPREK_MIN * MIN
}

function isVrij(start: number, agenda: readonly AgendaBlok[]): boolean {
  const tot = start + GESPREK_MIN * MIN
  return !agenda.some((b) => !b.heleDag && b.startOp.getTime() < tot && eind(b) > start)
}

/** Datum-verschuiving in kalenderdagen (lokale tijd blijft gelijk, ook over zomertijd). */
function plusDagen(ms: number, dagen: number): number {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dagen, d.getHours(), d.getMinutes()).getTime()
}

/** Eén ritme (een week) na `basis`, op hetzelfde tijdstip; bij een botsing de dichtstbijzijnde vrije dag. */
export function voorstelNa(basis: Date, agenda: readonly AgendaBlok[], nu: Date): Date {
  const vroegst = nu.getTime() + 60 * MIN
  let doel = plusDagen(basis.getTime(), RITME_DAGEN)
  // Al te laat? Dan dezelfde weekdag + tijd, eerstvolgende keer.
  while (doel < vroegst) doel = plusDagen(doel, 7)
  for (const offset of [0, 1, -1, 2, -2, 3]) {
    const s = plusDagen(doel, offset)
    if (s < vroegst || new Date(s).getDay() === 0) continue
    if (isVrij(s, agenda)) return new Date(s)
  }
  return new Date(doel)
}

export function teamExtra(
  naam: string,
  agenda: readonly AgendaBlok[],
  vorige: VorigeEvaluatie | null,
  nu: Date,
): TeamExtra {
  const nuMs = nu.getTime()
  const gesprekken = agenda
    .filter((b) => !b.heleDag && matchtCoachgesprek(b.titel, naam))
    .sort((a, b) => a.startOp.getTime() - b.startOp.getTime())
  const verleden = gesprekken.filter((b) => b.startOp.getTime() <= nuMs)
  const laatste = verleden[verleden.length - 1] ?? null
  const komend = gesprekken.some((b) => b.startOp.getTime() > nuMs)

  // Een verslag telt voor het gesprek als het ná de start van dat gesprek werd opgeslagen.
  const verslagen = (b: AgendaBlok) => vorige !== null && new Date(vorige.op).getTime() >= b.startOp.getTime()

  const teVerslaan = laatste !== null && nuMs - laatste.startOp.getTime() <= VERSLAG_VENSTER_MS && !verslagen(laatste)
  const bezig = laatste !== null && nuMs <= eind(laatste) + NA_AFLOOP_MS && !verslagen(laatste)

  let voorstel: string | null = null
  if (!komend) {
    const basis = laatste ? laatste.startOp : null
    if (basis) voorstel = voorstelNa(basis, agenda, nu).toISOString()
  }

  return {
    laatsteGesprekOp: laatste ? laatste.startOp.toISOString() : null,
    nuBezigOp: bezig && laatste ? laatste.startOp.toISOString() : null,
    teVerslaan,
    vorige,
    voorstelVolgende: voorstel,
  }
}


