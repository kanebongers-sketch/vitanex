// ─── Club: Bellen vandaag, behapbaar (PUUR) ─────────────────────────────────
// Opdracht Kane (03-11-2026, Club in 10 minuten): niet 76 namen tegelijk, maar
// hoogstens BEL_MAX gesprekken voor vandaag, op volgorde van belang. De rest
// verdwijnt niet: die staat in de volledige opvolglijst (Leads, tab Opvolgen).
// Volgorde:
//   1. leads met een proefles (gepland of net geweest): die beslissen nu;
//   2. leden op volgorde van de regel (proeflid, opzegging, risico met de
//      laagste score eerst, lang niet gezien, welkom, jarig, mijlpaal);
//   3. de overige leads die aan de beurt zijn;
//   binnen elke stap de oudste openstaande eerst.
// Per lid hoogstens een gesprek op de lijst (een lid met twee aanleidingen
// belt het team een keer). Een opvolgtaak die langer dan VERLOOP_DAGEN open
// staat, telt niet meer mee en sluit de ronde als "verlopen" (niets verwijderd).

import { dagNummer } from '@/lib/club/leden/tijd'
import type { RegelSleutel } from './regels'
import type { Taak } from './taken'

/** Hoeveel gesprekken Bellen vandaag hoogstens toont (en de teller in het menu telt). */
export const BEL_MAX = 5
/** Na zoveel dagen open sluit een opvolgtaak als verlopen. */
export const VERLOOP_DAGEN = 14

/** Volgorde van belang per regel: lager is eerder. */
export const REGEL_BELANG: Readonly<Record<RegelSleutel, number>> = {
  proefles_opvolgen: 0,
  opzegging: 1,
  risico: 2,
  niet_gezien: 3,
  welkom: 4,
  verjaardag: 5,
  mijlpaal: 6,
}

const MS_DAG = 86_400_000

/** De dag (YYYY-MM-DD) waarvoor een taak die open staat, verlopen is. */
export function verloopGrens(vandaag: string, dagen = VERLOOP_DAGEN): string {
  return new Date((dagNummer(vandaag.slice(0, 10)) - dagen) * MS_DAG).toISOString().slice(0, 10)
}

/** Is deze open taak verlopen (langer dan VERLOOP_DAGEN open)? Zonder datum: nee. */
export function isVerlopen(taak: { status?: string; aangemaaktOp?: string }, vandaag: string, dagen = VERLOOP_DAGEN): boolean {
  if (taak.status !== undefined && taak.status !== 'open') return false
  const op = taak.aangemaaktOp?.slice(0, 10) ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(op)) return false
  return op < verloopGrens(vandaag, dagen)
}

/** Een lead op de belijst: alleen wat de volgorde nodig heeft. */
export interface BelLead {
  id: string
  status: string
  opvolgenOp: string | null
  proeflesOp: Date | null
}

export type BelItem<L extends BelLead> = { soort: 'lead'; lead: L } | { soort: 'lid'; taak: Taak }

function heeftProefles(l: BelLead): boolean {
  return l.proeflesOp !== null || l.status === 'proefles_geweest'
}

function sleutelLead(l: BelLead): [number, string, string] {
  return [heeftProefles(l) ? 0 : 2, l.opvolgenOp ?? '0000-00-00', l.id]
}

function sleutelLid(t: Taak): [number, number, string, string] {
  const score = t.regel === 'risico' && t.waarde !== null ? t.waarde : 0
  return [REGEL_BELANG[t.regel] ?? 9, score, t.aangemaaktOp, t.id]
}

function vergelijk(a: readonly (string | number)[], b: readonly (string | number)[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? ''
    const y = b[i] ?? ''
    if (x < y) return -1
    if (x > y) return 1
  }
  return 0
}

/** Open opvolgtaken van leden: zonder verlopen, per lid alleen de belangrijkste, op volgorde. */
export function ledenOpVolgorde(taken: readonly Taak[], vandaag: string): Taak[] {
  const gesorteerd = taken.filter((t) => t.status === 'open' && !isVerlopen(t, vandaag)).sort((a, b) => vergelijk(sleutelLid(a), sleutelLid(b)))
  const gezien = new Set<string>()
  return gesorteerd.filter((t) => (gezien.has(t.lidId) ? false : (gezien.add(t.lidId), true)))
}

export interface Belijst<L extends BelLead> {
  /** Hoogstens `max` gesprekken voor vandaag, op volgorde van belang. */
  items: BelItem<L>[]
  /** Alles wat aan de beurt is (leden per persoon geteld, plus leads), voor "Alle n bekijken". */
  totaal: number
}

/**
 * De belijst van vandaag. `leadsTotaal` is het echte aantal leads dat aan de
 * beurt is (de lijst `leads` kan een eerste deel zijn).
 */
export function maakBelijst<L extends BelLead>(leden: readonly Taak[], leads: readonly L[], vandaag: string, leadsTotaal = leads.length, max = BEL_MAX): Belijst<L> {
  const lidTaken = ledenOpVolgorde(leden, vandaag)
  const leadsSorted = [...leads].sort((a, b) => vergelijk(sleutelLead(a), sleutelLead(b)))
  const alle: { sleutel: (string | number)[]; item: BelItem<L> }[] = [
    ...leadsSorted.map((lead) => ({ sleutel: [sleutelLead(lead)[0], lead.opvolgenOp ?? '', lead.id], item: { soort: 'lead' as const, lead } })),
    ...lidTaken.map((taak) => ({ sleutel: [1, REGEL_BELANG[taak.regel] ?? 9, ...sleutelLid(taak).slice(1)], item: { soort: 'lid' as const, taak } })),
  ]
  const items = alle.sort((a, b) => vergelijk(a.sleutel, b.sleutel)).slice(0, Math.max(0, max)).map((x) => x.item)
  return { items, totaal: lidTaken.length + Math.max(leadsTotaal, leads.length) }
}

/** Het getal in het menu bij Vandaag: wat er vandaag op de belijst staat, nooit de hele achterstand. */
export function belTeller(totaal: number, max = BEL_MAX): number {
  return typeof totaal === 'number' && Number.isFinite(totaal) && totaal > 0 ? Math.min(Math.floor(totaal), max) : 0
}
