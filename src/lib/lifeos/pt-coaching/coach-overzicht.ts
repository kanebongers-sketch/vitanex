// ─── PT-coaching — het coach-overzicht voor eigenaar en beheerder (PUUR) ────
// Geen fetch, geen DB. Per PT'er: wanneer het laatste coachgesprek was, wanneer
// het volgende staat, of er nog een verslag open staat, de check-in van deze
// week en welke leads eerst opgepakt moeten worden. Plus de telling bovenaan en
// de volgorde (wat af moet, bovenaan). De data komt uit `coach-team.ts`.

import type { EvaluatieJson } from './pt-coaching'
import type { OpenPunt } from './aandachtspunten'
import type { Checkin } from '@/lib/lifeos/pt-dashboard/checkin'
import { STATUS_LABEL, type Lead } from '@/lib/lifeos/leads/leads'

/** Welke open leads eerst aandacht vragen (uit `ptOverzicht`): te laat, vandaag, zonder plan. */
export interface OpTePakken {
  teLaat: Lead[]
  vandaag: Lead[]
  zonderPlan: Lead[]
}

export interface CoachRij {
  id: string
  naam: string
  /** Eerstvolgende coachgesprek in de agenda (ISO), of null als er niets staat. */
  volgendeOp: string | null
  /** Laatste coachgesprek dat al geweest is (ISO, uit de agenda), of null. */
  laatsteGesprekOp: string | null
  /** Alle verslagen, nieuwste eerst. */
  verslagen: EvaluatieJson[]
  openPunten: OpenPunt[]
  /** De weekcheck-in van deze week, of null. */
  checkin: Checkin | null
  opTePakken: OpTePakken
}

/** Wat er voor deze PT'er nu te doen is. */
export type CoachFase = 'verslag' | 'inplannen' | 'geregeld'

const DAG_MS = 24 * 60 * 60 * 1000
/** "Gesprek gehad" telt binnen deze periode — twee weken, zodat één gemiste week niet meteen rood is. */
export const RONDE_DAGEN = 14
/** Een gesprek ouder dan dit vraagt geen verslag meer (zelfde venster als `team.ts`). */
const VERSLAG_VENSTER_DAGEN = 21

/** Het laatste contactmoment: het laatste gesprek in de agenda óf het nieuwste verslag, wat later is. */
export function laatsteContactOp(r: Pick<CoachRij, 'laatsteGesprekOp' | 'verslagen'>): string | null {
  const verslag = r.verslagen[0]?.aangemaaktOp ?? null
  if (!r.laatsteGesprekOp) return verslag
  if (!verslag) return r.laatsteGesprekOp
  return verslag > r.laatsteGesprekOp ? verslag : r.laatsteGesprekOp
}

/** Had deze PT'er de afgelopen `RONDE_DAGEN` een coachgesprek (agenda of verslag)? */
export function gesprekGehad(r: Pick<CoachRij, 'laatsteGesprekOp' | 'verslagen'>, nu: Date): boolean {
  const op = laatsteContactOp(r)
  return op !== null && nu.getTime() - new Date(op).getTime() <= RONDE_DAGEN * DAG_MS
}

/** Is het laatste gesprek geweest zonder dat er daarna een verslag is opgeslagen? */
export function verslagOpen(r: Pick<CoachRij, 'laatsteGesprekOp' | 'verslagen'>, nu: Date): boolean {
  if (!r.laatsteGesprekOp) return false
  const ms = new Date(r.laatsteGesprekOp).getTime()
  if (nu.getTime() - ms > VERSLAG_VENSTER_DAGEN * DAG_MS) return false
  const verslag = r.verslagen[0]?.aangemaaktOp
  return !verslag || new Date(verslag).getTime() < ms
}

export function coachFase(r: CoachRij, nu: Date): CoachFase {
  if (verslagOpen(r, nu)) return 'verslag'
  if (!r.volgendeOp) return 'inplannen'
  return 'geregeld'
}

const FASE_VOLGORDE: Record<CoachFase, number> = { verslag: 0, inplannen: 1, geregeld: 2 }

/**
 * Wat af moet bovenaan: eerst wie een verslag nodig heeft, dan wie nog geen
 * volgende afspraak heeft (nooit gesproken eerst, dan langst geleden), dan wie
 * geregeld is op volgorde van de volgende afspraak.
 */
export function sorteerCoachRijen(rijen: readonly CoachRij[], nu: Date): CoachRij[] {
  return [...rijen].sort((a, b) => {
    const fa = coachFase(a, nu), fb = coachFase(b, nu)
    if (fa !== fb) return FASE_VOLGORDE[fa] - FASE_VOLGORDE[fb]
    if (fa === 'geregeld') return (a.volgendeOp ?? '').localeCompare(b.volgendeOp ?? '') || a.naam.localeCompare(b.naam, 'nl')
    const ca = laatsteContactOp(a), cb = laatsteContactOp(b)
    if (ca === null || cb === null) return ca === cb ? a.naam.localeCompare(b.naam, 'nl') : ca === null ? -1 : 1
    return ca.localeCompare(cb) || a.naam.localeCompare(b.naam, 'nl')
  })
}

export interface CoachTelling {
  totaal: number
  /** Gesprek gehad in de afgelopen `RONDE_DAGEN`. */
  gehad: number
  /** Een volgende afspraak staat in de agenda. */
  ingepland: number
  /** De check-in van deze week is ingevuld. */
  checkins: number
  /** Gesprek geweest, verslag nog niet opgeslagen. */
  teVerslaan: number
}

export function telCoach(rijen: readonly CoachRij[], nu: Date): CoachTelling {
  return {
    totaal: rijen.length,
    gehad: rijen.filter((r) => gesprekGehad(r, nu)).length,
    ingepland: rijen.filter((r) => r.volgendeOp !== null).length,
    checkins: rijen.filter((r) => r.checkin !== null).length,
    teVerslaan: rijen.filter((r) => verslagOpen(r, nu)).length,
  }
}

// ─── Eerst op te pakken ───────────────────────────────────────────────────────

export type OpTePakkenReden = 'te_laat' | 'vandaag' | 'zonder_plan'

export interface OpTePakkenItem {
  lead: Lead
  reden: OpTePakkenReden
}

/** Te laat eerst (oudste opvolgdatum voorop), dan vandaag, dan zonder plan. */
export function eerstOpTePakken(o: OpTePakken, max = 5): OpTePakkenItem[] {
  const alles: OpTePakkenItem[] = [
    ...o.teLaat.map((lead): OpTePakkenItem => ({ lead, reden: 'te_laat' })),
    ...o.vandaag.map((lead): OpTePakkenItem => ({ lead, reden: 'vandaag' })),
    ...o.zonderPlan.map((lead): OpTePakkenItem => ({ lead, reden: 'zonder_plan' })),
  ]
  return alles.slice(0, max)
}

export function opTePakkenTotaal(o: OpTePakken): number {
  return o.teLaat.length + o.vandaag.length + o.zonderPlan.length
}

const DAG_KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })

function dagKort(dag: string): string {
  return DAG_KORT.format(new Date(`${dag}T12:00:00Z`))
}

/** "te laat sinds 3 okt", "vandaag opvolgen", "geen opvolgdatum of volgende stap". */
export function opTePakkenLabel(item: OpTePakkenItem): string {
  if (item.reden === 'te_laat') return item.lead.opvolgdatum ? `te laat sinds ${dagKort(item.lead.opvolgdatum)}` : 'te laat'
  if (item.reden === 'vandaag') return 'vandaag opvolgen'
  return 'geen opvolgdatum of volgende stap'
}

/** Het blok voor het verslag (pdf): de leads die eerst opgepakt moeten worden, stand van nu. */
export function opTePakkenTekst(o: OpTePakken, max = 8): string {
  const totaal = opTePakkenTotaal(o)
  if (totaal === 0) return 'Eerst op te pakken: niets — geen opvolging te laat en elke open lead heeft een plan.'
  const regels = eerstOpTePakken(o, max).map((i) => `• ${i.lead.naam} — ${STATUS_LABEL[i.lead.status]}, ${opTePakkenLabel(i)}`)
  const meer = totaal > max ? [`… en nog ${totaal - max}`] : []
  return [`Eerst op te pakken (${totaal}):`, ...regels, ...meer].join('\n')
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const AFSPRAAK = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })
const DATUM = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' })

/** "do 9 okt, 14:00" */
export function afspraakLabel(iso: string): string {
  return AFSPRAAK.format(new Date(iso))
}

/** "do 9 okt" */
export function datumLabel(iso: string): string {
  return DATUM.format(new Date(iso))
}
