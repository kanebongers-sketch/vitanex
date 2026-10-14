// ─── Fit Factory Club: filters van de leadspagina (PUUR) ────────────────────
// De filters staan in de URL (?bron=website&mw=<id>&periode=30&weergave=lijst),
// zodat een gefilterde weergave deelbaar is en terug/vooruit werkt.

import { isLeadBron, type Lead, type LeadBron } from './model'
import { binnenDagen } from './cijfers'

export const PERIODES = ['alle', '7', '30', '90'] as const
export type Periode = (typeof PERIODES)[number]

export const PERIODE_LABEL: Record<Periode, string> = {
  alle: 'Alles',
  '7': 'Laatste 7 dagen',
  '30': 'Laatste 30 dagen',
  '90': 'Laatste 90 dagen',
}

export type Weergave = 'pijplijn' | 'lijst'

/** Medewerker-filter: een id, "geen" (niet toegewezen) of null (iedereen). */
export interface LeadFilters {
  bron: LeadBron | null
  medewerker: string | null
  periode: Periode
  weergave: Weergave
}

type Ruw = Record<string, string | string[] | undefined>

function eerste(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isPeriode(v: unknown): v is Periode {
  return typeof v === 'string' && (PERIODES as readonly string[]).includes(v)
}

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v)
}

export function leesFilters(ruw: Ruw): LeadFilters {
  const bron = eerste(ruw.bron)
  const mw = eerste(ruw.mw)
  const periode = eerste(ruw.periode)
  return {
    bron: isLeadBron(bron) ? bron : null,
    medewerker: mw === 'geen' || isUuid(mw) ? mw : null,
    periode: isPeriode(periode) ? periode : 'alle',
    weergave: eerste(ruw.weergave) === 'lijst' ? 'lijst' : 'pijplijn',
  }
}

export function pasFiltersToe(leads: readonly Lead[], f: LeadFilters, nu: Date): Lead[] {
  const inPeriode = f.periode === 'alle' ? [...leads] : binnenDagen(leads, nu, Number(f.periode))
  return inPeriode.filter((l) => {
    if (f.bron && l.bron !== f.bron) return false
    if (f.medewerker === 'geen') return l.medewerkerId === null
    if (f.medewerker) return l.medewerkerId === f.medewerker
    return true
  })
}

export function heeftFilters(f: LeadFilters): boolean {
  return f.bron !== null || f.medewerker !== null || f.periode !== 'alle'
}

/** De zoekparameters voor deze filters (zonder standaardwaarden), plus extra's. */
export function filterParams(f: LeadFilters, extra: Record<string, string> = {}): Record<string, string> {
  const uit: Record<string, string> = {}
  if (f.bron) uit.bron = f.bron
  if (f.medewerker) uit.mw = f.medewerker
  if (f.periode !== 'alle') uit.periode = f.periode
  if (f.weergave === 'lijst') uit.weergave = 'lijst'
  return { ...uit, ...extra }
}
