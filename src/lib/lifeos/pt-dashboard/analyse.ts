// ─── PT-dashboard — funnel & trends (PUUR) ──────────────────────────────────
// Wat de PT'er en Kane helpt sturen: hoeveel leads per week, hoe ver ze in de
// funnel komen en welke bron iets oplevert. Alles is afgeleid uit de leads zelf;
// er wordt niets geschat en er zijn geen benchmarks. Belangrijk om eerlijk te
// blijven: een lead heeft alleen een *huidige* status en een gesprekdatum — er is
// geen datum waarop iemand klant werd en geen reactietijd. Daarom:
//  - "klant" per week = leads uit díe week die nu klant zijn;
//  - de funnel kijkt naar de huidige status.
// `vandaag` = YYYY-MM-DD (Nederlandse tijd).

import { LEAD_BRONNEN, isBron, type Lead, type LeadBron, type LeadStatus } from '@/lib/lifeos/leads/leads'
import { plusDagen } from './abonnementen'

export interface WeekPunt {
  /** Maandag van de week (YYYY-MM-DD). */
  start: string
  /** ISO-weeknummer. */
  week: number
  /** Leads gesproken in deze week. */
  leads: number
  /** Daarvan nu klant. */
  klant: number
}

export type FunnelSleutel = 'gesproken' | 'in_gesprek' | 'klant'

export interface FunnelStap {
  sleutel: FunnelSleutel
  label: string
  aantal: number
  /** Aandeel van alle gesproken leads, in hele procenten; null zonder leads. */
  pct: number | null
}

export interface BronRij {
  bron: LeadBron
  aantal: number
  klant: number
  /** Klant ÷ aantal, in hele procenten. */
  conversie: number | null
}

export interface Analyse {
  weken: WeekPunt[]
  funnel: FunnelStap[]
  bronnen: BronRij[]
}

const DAG = /^\d{4}-\d{2}-\d{2}$/
const middag = (dag: string) => new Date(`${dag}T12:00:00Z`)
const procent = (deel: number, geheel: number): number | null => (geheel === 0 ? null : Math.round((deel / geheel) * 100))

/** Maandag van de (ISO-)week van `dag`. */
export function maandagVan(dag: string): string {
  return plusDagen(dag, -((middag(dag).getUTCDay() + 6) % 7))
}

/** ISO-weeknummer van `dag` (week 1 = de week met de eerste donderdag van het jaar). */
export function isoWeek(dag: string): number {
  const donderdag = middag(plusDagen(maandagVan(dag), 3))
  const jan1 = Date.UTC(donderdag.getUTCFullYear(), 0, 1, 12)
  return Math.floor((donderdag.getTime() - jan1) / 86_400_000 / 7) + 1
}

/** De laatste `weken` weken t/m de huidige, oudste eerst: leads (op gesprekdatum) en hoeveel daarvan nu klant zijn. */
export function weekReeks(leads: readonly Lead[], vandaag: string, weken = 8): WeekPunt[] {
  const huidig = maandagVan(vandaag)
  const reeks = Array.from({ length: Math.max(0, weken) }, (_, i): WeekPunt => {
    const start = plusDagen(huidig, -7 * (weken - 1 - i))
    return { start, week: isoWeek(start), leads: 0, klant: 0 }
  })
  const index = new Map(reeks.map((p, i) => [p.start, i]))
  for (const l of leads) {
    if (l.gesprokenOp > vandaag) continue
    const i = index.get(maandagVan(l.gesprokenOp))
    if (i === undefined) continue
    reeks[i] = { ...reeks[i], leads: reeks[i].leads + 1, klant: reeks[i].klant + (l.status === 'klant' ? 1 : 0) }
  }
  return reeks
}

/** Statussen die betekenen: er is een vervolgafspraak geweest of gepland. */
const VERDER: readonly LeadStatus[] = ['proefles', 'intake', 'klant']

/** Gesproken (alle leads) → in gesprek (proefles/intake ingepland of klant) → klant. */
export function funnel(leads: readonly Pick<Lead, 'status'>[]): FunnelStap[] {
  const totaal = leads.length
  const verder = leads.filter((l) => VERDER.includes(l.status)).length
  const klant = leads.filter((l) => l.status === 'klant').length
  return [
    { sleutel: 'gesproken', label: 'Gesproken', aantal: totaal, pct: procent(totaal, totaal) },
    { sleutel: 'in_gesprek', label: 'Proefles, intake of klant', aantal: verder, pct: procent(verder, totaal) },
    { sleutel: 'klant', label: 'Klant geworden', aantal: klant, pct: procent(klant, totaal) },
  ]
}

/** Per bron: leads, klant, conversie. Meeste leads eerst; alleen bronnen met leads. */
export function bronAnalyse(leads: readonly Pick<Lead, 'bron' | 'status'>[]): BronRij[] {
  const tel = new Map<LeadBron, { aantal: number; klant: number }>()
  for (const l of leads) {
    const t = tel.get(l.bron) ?? { aantal: 0, klant: 0 }
    tel.set(l.bron, { aantal: t.aantal + 1, klant: t.klant + (l.status === 'klant' ? 1 : 0) })
  }
  return LEAD_BRONNEN.filter((b) => tel.has(b))
    .map((bron): BronRij => {
      const t = tel.get(bron) ?? { aantal: 0, klant: 0 }
      return { bron, ...t, conversie: procent(t.klant, t.aantal) }
    })
    .sort((a, b) => b.aantal - a.aantal || b.klant - a.klant) // stabiel: bij gelijkspel de vaste bronvolgorde
}

export function analyseer(leads: readonly Lead[], vandaag: string, weken = 8): Analyse {
  return { weken: weekReeks(leads, vandaag, weken), funnel: funnel(leads), bronnen: bronAnalyse(leads) }
}

// ─── Uitlezen (systeemgrens: API-antwoord) ────────────────────────────────────

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}
const telling = (v: unknown): number | null => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null)
const pctOfNull = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const FUNNEL_SLEUTELS: readonly FunnelSleutel[] = ['gesproken', 'in_gesprek', 'klant']

function leesWeek(v: unknown): WeekPunt[] {
  const x = obj(v)
  if (!x || typeof x.start !== 'string' || !DAG.test(x.start)) return []
  const week = telling(x.week)
  const leads = telling(x.leads)
  const klant = telling(x.klant)
  return week === null || leads === null || klant === null ? [] : [{ start: x.start, week, leads, klant }]
}

function leesStap(v: unknown): FunnelStap[] {
  const x = obj(v)
  const aantal = telling(x?.aantal)
  if (!x || aantal === null || typeof x.label !== 'string') return []
  const sleutel = FUNNEL_SLEUTELS.find((s) => s === x.sleutel)
  return sleutel ? [{ sleutel, label: x.label, aantal, pct: pctOfNull(x.pct) }] : []
}

function leesBron(v: unknown): BronRij[] {
  const x = obj(v)
  const aantal = telling(x?.aantal)
  const klant = telling(x?.klant)
  if (!x || !isBron(x.bron) || aantal === null || klant === null) return []
  return [{ bron: x.bron, aantal, klant, conversie: pctOfNull(x.conversie) }]
}

/** Een analyse uit JSON; kapotte onderdelen vallen weg, een ontbrekende analyse → null. */
export function leesAnalyse(ruw: unknown): Analyse | null {
  const o = obj(ruw)
  if (!o || !Array.isArray(o.weken) || !Array.isArray(o.funnel) || !Array.isArray(o.bronnen)) return null
  return { weken: o.weken.flatMap(leesWeek), funnel: o.funnel.flatMap(leesStap), bronnen: o.bronnen.flatMap(leesBron) }
}
