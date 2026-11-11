// Fit Factory PT | bevriezen met een periode (PUUR)
// Een klant met status "bevroren" is alleen bevroren binnen zijn periode:
// van `bevrorenVan` tot en met `bevrorenTot`. Voor de van-datum en na de
// tot-datum telt hij gewoon als actief, zonder dat iemand de status terugzet
// (geen cron nodig). Een lege van-datum (klanten van voor migratie 504) is
// "al bevroren"; een lege tot-datum is "einddatum onbekend".
// Elke plek die wil weten of een klant bevroren is, gaat via deze functies.

import type { KlantStatus, PtKlant } from './abonnementen'

export type Bevriesbaar = Pick<PtKlant, 'status' | 'bevrorenVan' | 'bevrorenTot'>

/** Is deze klant op `dag` (YYYY-MM-DD) bevroren? */
export function isBevrorenOp(k: Bevriesbaar, dag: string): boolean {
  if (k.status !== 'bevroren') return false
  if (k.bevrorenVan !== null && dag < k.bevrorenVan) return false
  return k.bevrorenTot === null || dag <= k.bevrorenTot
}

/** De status zoals die op `dag` geldt: bevroren buiten de periode is actief. */
export function standOp(k: Bevriesbaar, dag: string): KlantStatus {
  if (k.status !== 'bevroren') return k.status
  return isBevrorenOp(k, dag) ? 'bevroren' : 'actief'
}

/** Status bevroren, maar de periode begint pas na `dag`. */
export function bevriezingGepland(k: Bevriesbaar, dag: string): boolean {
  return k.status === 'bevroren' && k.bevrorenVan !== null && k.bevrorenVan > dag
}

/** Bevroren op `dag` of een bevriezing die nog komt (voor het filter Bevroren). */
export function bevriezingLooptOfKomt(k: Bevriesbaar, dag: string): boolean {
  return isBevrorenOp(k, dag) || bevriezingGepland(k, dag)
}

// ─── Kalendermaand ────────────────────────────────────────────────────────────

function dagGetal(dag: string): number {
  return Math.round(Date.parse(`${dag}T00:00:00Z`) / 86_400_000)
}

/** Eerste en laatste dag van de kalendermaand waarin `dag` valt. */
export function maandGrenzen(dag: string): { begin: string; eind: string } {
  const [j, m] = dag.split('-').map(Number)
  const laatste = new Date(Date.UTC(j, m, 0)).getUTCDate()
  const mm = String(m).padStart(2, '0')
  return { begin: `${j}-${mm}-01`, eind: `${j}-${mm}-${String(laatste).padStart(2, '0')}` }
}

/** Aantal dagen in de kalendermaand van `dag` (28 tot 31). */
export function dagenInMaand(dag: string): number {
  const { begin, eind } = maandGrenzen(dag)
  return dagGetal(eind) - dagGetal(begin) + 1
}

/** Hoeveel dagen van de kalendermaand van `dag` deze klant bevroren is. */
export function bevrorenDagenInMaand(k: Bevriesbaar, dag: string): number {
  if (k.status !== 'bevroren') return 0
  const { begin, eind } = maandGrenzen(dag)
  const van = k.bevrorenVan !== null && k.bevrorenVan > begin ? k.bevrorenVan : begin
  const tot = k.bevrorenTot !== null && k.bevrorenTot < eind ? k.bevrorenTot : eind
  return van > tot ? 0 : dagGetal(tot) - dagGetal(van) + 1
}

/**
 * Wat een maandprijs oplevert in de kalendermaand van `dag`: de prijs maal de
 * niet-bevroren dagen gedeeld door de dagen in de maand, op centen.
 */
export function prijsNaRato(prijs: number, k: Bevriesbaar, dag: string): number {
  const n = dagenInMaand(dag)
  const betaald = n - bevrorenDagenInMaand(k, dag)
  return Math.round((prijs * betaald * 100) / n) / 100
}

// ─── Label ────────────────────────────────────────────────────────────────────

const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const

/** "12 dec", met het jaar erbij als dat anders is dan het jaar van `vandaag`. */
function kortDatum(dag: string, vandaag: string): string {
  const [j, m, d] = dag.split('-').map(Number)
  const jaar = dag.slice(0, 4) === vandaag.slice(0, 4) ? '' : ` ${j}`
  return `${d} ${MAANDEN[m - 1]}${jaar}`
}

/**
 * "Bevroren tot 12 dec", "Bevroren vanaf 1 dec" of "Bevroren, einddatum
 * onbekend". Null als er geen bevriezing loopt of komt.
 */
export function bevriesLabel(k: Bevriesbaar, vandaag: string): string | null {
  if (bevriezingGepland(k, vandaag) && k.bevrorenVan !== null) {
    const tot = k.bevrorenTot ? ` tot ${kortDatum(k.bevrorenTot, vandaag)}` : ''
    return `Bevroren vanaf ${kortDatum(k.bevrorenVan, vandaag)}${tot}`
  }
  if (!isBevrorenOp(k, vandaag)) return null
  return k.bevrorenTot ? `Bevroren tot ${kortDatum(k.bevrorenTot, vandaag)}` : 'Bevroren, einddatum onbekend'
}
