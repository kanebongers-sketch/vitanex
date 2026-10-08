// ─── PT-dashboard — doelen per PT'er en de voortgang (PUUR) ─────────────────
// Kane zet de doelen (pt_doelen, migratie 354); de stand volgt altijd uit de
// leads en klanten die de PT'er zelf invulde. Niets geschat, niets opgeslagen.
//
// Wanneer is iets "op koers"? Eerlijk en voorspelbaar, zonder trucs:
//   • Leads per week — week = maandag t/m zondag (NL). Vandaag telt als
//     begonnen dag: op dag x van 7 (ma = 1, zo = 7) verwachten we minstens
//     ⌊doel × x / 7⌋ leads. Afronden naar beneden, zodat je op maandagochtend
//     niet al "achter" staat.
//   • Klanten per maand — leads met status "klant" waarvan de gespreksdatum in
//     deze kalendermaand valt (de datum van klant worden zelf wordt niet
//     bijgehouden). Zelfde regel: dag x van de maand → ⌊doel × x / dagen⌋.
//   • Lopende abonnementen — een stand, geen tempo: gehaald of nog niet.
// Gehaald = stand ≥ doel. Een doel van 0 of leeg = geen doel.

import type { Lead } from '@/lib/lifeos/leads/leads'
import { plusDagen, vatKlantenSamen, type PtKlant } from './abonnementen'

export interface PtDoelen {
  leadsPerWeek: number | null
  klantenPerMaand: number | null
  /** Aantal lopende PT-abonnementen. */
  abonnementen: number | null
  /** Korte toelichting van Kane, zichtbaar voor de PT'er. */
  notitie: string | null
}

export const DOEL_MAX = { leadsPerWeek: 100, klantenPerMaand: 50, abonnementen: 200 } as const
export const NOTITIE_MAX = 300

export type DoelSoort = keyof typeof DOEL_MAX
export type DoelStatus = 'op_koers' | 'achter' | 'gehaald'

export interface Voortgang {
  soort: DoelSoort
  label: string
  doel: number
  stand: number
  /** stand ÷ doel in hele procenten, begrensd op 100 (voor de balk). */
  procent: number
  /** Wat er volgens de pro-rata-regel nu minstens zou moeten staan; null bij een stand-doel. */
  verwacht: number | null
  status: DoelStatus
  /** Eén zin die de status uitlegt, bv. "dag 3 van 7 — op koers vanaf 2". */
  uitleg: string
}

export interface DoelenWeergave {
  items: Voortgang[]
  notitie: string | null
}

const LABEL: Record<DoelSoort, string> = {
  leadsPerWeek: 'Leads deze week',
  klantenPerMaand: 'Klanten deze maand',
  abonnementen: 'Lopende abonnementen',
}

export const STATUS_LABEL: Record<DoelStatus, string> = { op_koers: 'Op koers', achter: 'Achter', gehaald: 'Gehaald' }

/** Label voor de status. Een stand-doel (zonder tempo) is niet "achter", maar "nog niet" gehaald. */
export function statusLabel(v: Pick<Voortgang, 'status' | 'verwacht'>): string {
  return v.status === 'achter' && v.verwacht === null ? 'Nog niet' : STATUS_LABEL[v.status]
}

/** Is er minstens één doel of een notitie gezet? Zo niet: niets tonen. */
export function heeftDoelen(d: PtDoelen | null): d is PtDoelen {
  return d !== null && (d.leadsPerWeek !== null || d.klantenPerMaand !== null || d.abonnementen !== null || d.notitie !== null)
}

// ─── Voortgang ────────────────────────────────────────────────────────────────

/** 1 = maandag … 7 = zondag. */
function dagVanWeek(dag: string): number {
  return ((new Date(`${dag}T12:00:00Z`).getUTCDay() + 6) % 7) + 1
}

function dagenInMaand(dag: string): number {
  const [j, m] = dag.split('-').map(Number)
  return new Date(Date.UTC(j, m, 0)).getUTCDate()
}

function procent(stand: number, doel: number): number {
  return Math.min(100, Math.round((stand / doel) * 100))
}

function tempoDoel(soort: DoelSoort, doel: number, stand: number, dag: number, dagen: number): Voortgang {
  const verwacht = Math.floor((doel * dag) / dagen)
  const status: DoelStatus = stand >= doel ? 'gehaald' : stand >= verwacht ? 'op_koers' : 'achter'
  const moment = `dag ${dag} van ${dagen}`
  const uitleg =
    status === 'gehaald' ? `doel gehaald (${moment})`
    : verwacht === 0 ? `${moment} — net begonnen`
    : `${moment} — op koers bij ${verwacht} of meer`
  return { soort, label: LABEL[soort], doel, stand, procent: procent(stand, doel), verwacht, status, uitleg }
}

/** Per gezet doel de stand en status. Doelen van 0/leeg vallen weg. */
export function voortgang(doelen: PtDoelen, leads: readonly Lead[], klanten: readonly PtKlant[], vandaag: string): Voortgang[] {
  const uit: Voortgang[] = []
  if (doelen.leadsPerWeek) {
    const dag = dagVanWeek(vandaag)
    const weekStart = plusDagen(vandaag, 1 - dag)
    const stand = leads.filter((l) => l.gesprokenOp >= weekStart && l.gesprokenOp <= vandaag).length
    uit.push(tempoDoel('leadsPerWeek', doelen.leadsPerWeek, stand, dag, 7))
  }
  if (doelen.klantenPerMaand) {
    const maandStart = `${vandaag.slice(0, 8)}01`
    const stand = leads.filter((l) => l.status === 'klant' && l.gesprokenOp >= maandStart && l.gesprokenOp <= vandaag).length
    uit.push(tempoDoel('klantenPerMaand', doelen.klantenPerMaand, stand, Number(vandaag.slice(8, 10)), dagenInMaand(vandaag)))
  }
  if (doelen.abonnementen) {
    const doel = doelen.abonnementen
    const stand = vatKlantenSamen(klanten, vandaag).lopend
    const gehaald = stand >= doel
    uit.push({
      soort: 'abonnementen', label: LABEL.abonnementen, doel, stand, procent: procent(stand, doel), verwacht: null,
      status: gehaald ? 'gehaald' : 'achter',
      uitleg: gehaald ? 'doel gehaald' : `nog ${doel - stand} te gaan`,
    })
  }
  return uit
}

/** Alles wat de weergave nodig heeft, of null als er niets te tonen is. */
export function doelenWeergave(
  doelen: PtDoelen | null,
  leads: readonly Lead[],
  klanten: readonly PtKlant[],
  vandaag: string,
): DoelenWeergave | null {
  if (!heeftDoelen(doelen)) return null
  const items = voortgang(doelen, leads, klanten, vandaag)
  return items.length === 0 && doelen.notitie === null ? null : { items, notitie: doelen.notitie }
}

// ─── Invoer en uitlezen (systeemgrens) ────────────────────────────────────────

type Lees<T> = { ok: true; waarde: T } | { ok: false; fout: string }

const VELD_NAAM: Record<DoelSoort, string> = {
  leadsPerWeek: 'Leads per week',
  klantenPerMaand: 'Klanten per maand',
  abonnementen: 'Lopende abonnementen',
}

/** Leeg/0 → null; een heel getal binnen de grens → dat getal; anders een fout. */
function leesAantal(v: unknown, soort: DoelSoort): Lees<number | null> {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return { ok: true, waarde: null }
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.trim()) : Number.NaN
  const max = DOEL_MAX[soort]
  if (!Number.isInteger(n) || n < 0 || n > max) return { ok: false, fout: `${VELD_NAAM[soort]}: kies een heel getal van 0 tot en met ${max}.` }
  return { ok: true, waarde: n === 0 ? null : n }
}

function leesNotitie(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/\s+/g, ' ').trim()
  return t.length === 0 ? null : t.slice(0, NOTITIE_MAX)
}

/** Formulier → doelen, of een leesbare fout. */
export function leesDoelenInvoer(body: unknown): Lees<PtDoelen> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, fout: 'Ongeldige invoer.' }
  const o = body as Record<string, unknown>
  const leads = leesAantal(o.leadsPerWeek, 'leadsPerWeek')
  if (!leads.ok) return leads
  const klanten = leesAantal(o.klantenPerMaand, 'klantenPerMaand')
  if (!klanten.ok) return klanten
  const abonnementen = leesAantal(o.abonnementen, 'abonnementen')
  if (!abonnementen.ok) return abonnementen
  return {
    ok: true,
    waarde: { leadsPerWeek: leads.waarde, klantenPerMaand: klanten.waarde, abonnementen: abonnementen.waarde, notitie: leesNotitie(o.notitie) },
  }
}

/** Doelen over de draad (API-antwoord) → PtDoelen, of null als het geen doelen-object is. */
export function leesDoelen(ruw: unknown): PtDoelen | null {
  const r = leesDoelenInvoer(ruw)
  return r.ok ? r.waarde : null
}
