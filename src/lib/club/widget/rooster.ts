// ─── Club, boekingswidget: het openbare lesrooster (PUUR) ───────────────────
// Wat een bezoeker van de website van een sportschool ziet: de geplande
// groepslessen van de komende 7 dagen. Alleen openbare gegevens: lesnaam, tijd,
// zaal, de voornaam van de instructeur en hoeveel plek er ongeveer is. Nooit
// wie er al geboekt heeft. Daarnaast wie de widget mag zien.

import { isoWeekdag, nlDelen, plusDagen } from '@/lib/club/rooster/tijd'
import type { Taal } from '@/lib/aiyourgym/taal/taal'

export const WIDGET_DAGEN = 7
/** Onder dit aantal vrije plekken tonen we het getal ("Nog 3 plekken"). */
export const WEINIG_PLEK = 5

export type Plek = 'vol' | 'weinig' | 'vrij'

export interface WidgetLes {
  id: string
  naam: string
  lestypeId: string
  startOp: string
  eindOp: string
  /** Kalenderdag in Nederland, "2026-10-21". */
  dag: string
  /** Kloktijd in Nederland, "19:00". */
  tijd: string
  duurMin: number
  zaal: string | null
  instructeur: string | null
  plek: Plek
  /** Alleen bij weinig plek; anders null (geen exacte bezetting naar buiten). */
  vrij: number | null
}

export interface WidgetLestype {
  id: string
  naam: string
}

function obj(v: unknown): Record<string, unknown> | null {
  const o = Array.isArray(v) ? v[0] : v
  return typeof o === 'object' && o !== null ? (o as Record<string, unknown>) : null
}

function naamUit(v: unknown): string | null {
  const o = obj(v)
  return o && typeof o.naam === 'string' && o.naam.trim() !== '' ? o.naam.trim() : null
}

/** Alleen de voornaam van de instructeur: "Sanne van Dijk" wordt "Sanne". */
export function voornaam(naam: string | null): string | null {
  const eerste = naam?.trim().split(/\s+/)[0] ?? ''
  return eerste ? eerste.slice(0, 40) : null
}

export function plekVan(capaciteit: number, bezet: number): { plek: Plek; vrij: number | null } {
  const vrij = Math.max(0, capaciteit - bezet)
  if (vrij === 0) return { plek: 'vol', vrij: 0 }
  return vrij <= WEINIG_PLEK ? { plek: 'weinig', vrij } : { plek: 'vrij', vrij: null }
}

/**
 * Systeemgrens: een rij uit club_lessen (met lestype, zaal en instructeur) plus
 * de bezetting naar een WidgetLes, of null. Een geannuleerde les, een les van
 * een inactief lestype of een lestype dat de sportschool niet toont valt weg.
 */
export function widgetLesUitRij(rij: unknown, bezet: number, toegestaan: ReadonlySet<string>): WidgetLes | null {
  const r = obj(rij)
  if (!r || typeof r.id !== 'string' || typeof r.lestype_id !== 'string') return null
  if (typeof r.start_op !== 'string' || typeof r.eind_op !== 'string' || typeof r.capaciteit !== 'number') return null
  if (r.status !== 'gepland') return null
  const lestype = obj(r.lestype)
  if (!lestype || lestype.actief === false) return null
  if (toegestaan.size > 0 && !toegestaan.has(r.lestype_id)) return null
  const start = new Date(r.start_op)
  const eind = new Date(r.eind_op)
  if (Number.isNaN(start.getTime()) || Number.isNaN(eind.getTime())) return null
  const nl = nlDelen(start)
  return {
    id: r.id,
    naam: naamUit(lestype) ?? 'Groepsles',
    lestypeId: r.lestype_id,
    startOp: start.toISOString(),
    eindOp: eind.toISOString(),
    dag: nl.datum,
    tijd: nl.tijd,
    duurMin: Math.max(0, Math.round((eind.getTime() - start.getTime()) / 60_000)),
    zaal: naamUit(r.zaal),
    instructeur: voornaam(naamUit(r.instructeur)),
    ...plekVan(r.capaciteit, bezet),
  }
}

/** De lestypen die in deze lessen voorkomen, op naam gesorteerd (voor het filter). */
export function lestypenVan(lessen: readonly WidgetLes[]): WidgetLestype[] {
  const map = new Map<string, string>()
  for (const l of lessen) if (!map.has(l.lestypeId)) map.set(l.lestypeId, l.naam)
  return [...map].map(([id, naam]) => ({ id, naam })).sort((a, b) => a.naam.localeCompare(b.naam, 'nl'))
}

export interface WidgetDag {
  dag: string
  lessen: WidgetLes[]
}

/** De 7 dagen vanaf vandaag (Nederlandse kalender), elk met de lessen die nog komen. */
export function perDag(lessen: readonly WidgetLes[], nu: Date): WidgetDag[] {
  const vandaag = nlDelen(nu).datum
  const komend = lessen.filter((l) => new Date(l.startOp).getTime() > nu.getTime())
  return Array.from({ length: WIDGET_DAGEN }, (_, i) => {
    const dag = plusDagen(vandaag, i)
    return { dag, lessen: komend.filter((l) => l.dag === dag).sort((a, b) => a.startOp.localeCompare(b.startOp)) }
  })
}

const WEEKDAG = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const MAAND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

/** "di 21 okt" voor een kalenderdag; zelf opgebouwd, zodat server en browser hetzelfde tonen. */
export function dagLabel(dag: string, taal: Taal = 'nl'): string {
  const [, m, d] = dag.split('-').map(Number)
  if (taal === 'en') return `${WEEKDAG_EN[isoWeekdag(dag) - 1]} ${d} ${MAAND_EN[m - 1]}`
  return `${WEEKDAG[isoWeekdag(dag) - 1]} ${d} ${MAAND[m - 1]}`
}

const WEEKDAG_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAAND_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Wat er in de lead komt te staan als interesse (maximaal 200 tekens). */
export function interesseTekst(les: Pick<WidgetLes, 'naam' | 'dag' | 'tijd'> | null): string {
  if (!les) return 'Kennismaking aangevraagd via de website'
  return `Proefles ${les.naam}, ${dagLabel(les.dag)} ${les.tijd} (via de website)`.slice(0, 200)
}

export type WidgetWeergave = 'openbaar' | 'voorbeeld' | null

/**
 * Mag deze widget getoond worden?
 * - Schakelaar CLUB_WIDGET_ACTIEF uit: alleen een voorvertoning voor Kane.
 * - Aan: openbaar als de sportschool hem voor deze vestiging aanzette; een
 *   voorvertoning voor Kane of de eigenaar ook als hij (nog) uit staat.
 * null = een gewone 404, zodat niemand kan zien welke sportscholen bestaan.
 */
export function widgetWeergave(p: { actief: boolean; aan: boolean; voorbeeld: boolean; isPlatformEigenaar: boolean; isBeheerder: boolean }): WidgetWeergave {
  if (p.voorbeeld && (p.isPlatformEigenaar || (p.actief && p.isBeheerder))) return 'voorbeeld'
  return p.actief && p.aan ? 'openbaar' : null
}
