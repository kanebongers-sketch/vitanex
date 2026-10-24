// ─── Club, rep-speler: het doel van een set uit het schema (PUUR) ───────────
// Herhalingen staan in het schema als korte tekst ("10", "8-10", "AMRAP",
// "30 sec"), tijd los in seconden. De speler heeft een getal nodig: bij een
// bereik nemen we de bovenkant (de trainer schrijft "8 tot 10", de speler telt
// tot 10; stoppen kan altijd eerder). Zonder getal: 10 herhalingen of 30 seconden.

import type { RenderSoort } from './typen'

export const STANDAARD_REPS = 10
export const STANDAARD_HOUD_SEC = 30
export const MAX_REPS = 100
export const MAX_HOUD_SEC = 600

function getallen(tekst: string | null | undefined): number[] {
  if (!tekst) return []
  return (tekst.match(/\d+/g) ?? []).map(Number).filter((n) => Number.isFinite(n) && n > 0)
}

function isTijdTekst(tekst: string | null | undefined): boolean {
  return !!tekst && /\d\s*(s|sec|seconden|min)\b/i.test(tekst)
}

export interface DoelInvoer {
  soort: RenderSoort
  herhalingen: string | null | undefined
  tijdSec: number | null | undefined
  /** Duur van een herhaling, om een tijd om te rekenen naar herhalingen. */
  repDuur: number
}

export type Doel = { soort: 'herhaling'; reps: number } | { soort: 'vasthouden'; sec: number }

export function doelVan(inv: DoelInvoer): Doel {
  const nummers = getallen(inv.herhalingen)
  const uitTekst = nummers.length > 0 ? Math.max(...nummers) * (/min/i.test(inv.herhalingen ?? '') ? 60 : 1) : null
  const tijd = inv.tijdSec && inv.tijdSec > 0 ? inv.tijdSec : null
  if (inv.soort === 'vasthouden') {
    const sec = tijd ?? uitTekst ?? STANDAARD_HOUD_SEC
    return { soort: 'vasthouden', sec: Math.min(MAX_HOUD_SEC, Math.max(5, sec)) }
  }
  const opTijd = isTijdTekst(inv.herhalingen)
  const sec = tijd ?? (opTijd ? uitTekst : null)
  let reps = STANDAARD_REPS
  if (nummers.length > 0 && !opTijd) reps = Math.max(...nummers)
  else if (sec && inv.repDuur > 0) reps = Math.round(sec / inv.repDuur)
  return { soort: 'herhaling', reps: Math.min(MAX_REPS, Math.max(1, reps)) }
}
