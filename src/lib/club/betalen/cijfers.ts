// ─── Club, betalen: cijfers per kalendermaand (PUUR) ────────────────────────
// Altijd per kalendermaand (van de 1e tot en met de laatste dag, Nederlandse
// tijd), zoals alle cijfers in Club. Omzet = betaald min terugbetaald.

import { btwDeel, type Verkoop } from './model'

export interface MaandCijfers {
  verkopen: number
  omzetCent: number
  btwCent: number
  terugCent: number
}

const MAAND = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit' })

/** "2026-10" voor een moment, in Nederlandse tijd. */
export function maandSleutel(d: Date): string {
  return MAAND.format(d).slice(0, 7)
}

export function maandCijfers(verkopen: readonly Verkoop[], nu: Date): MaandCijfers {
  const maand = maandSleutel(nu)
  return verkopen
    .filter((v) => v.betaaldOp && (v.status === 'betaald' || v.status === 'terugbetaald') && maandSleutel(new Date(v.betaaldOp)) === maand)
    .reduce<MaandCijfers>((som, v) => {
      const netto = Math.max(0, v.bedragCent - v.terugbetaaldCent)
      return { verkopen: som.verkopen + 1, omzetCent: som.omzetCent + netto, btwCent: som.btwCent + btwDeel(netto, v.btwProcent), terugCent: som.terugCent + v.terugbetaaldCent }
    }, { verkopen: 0, omzetCent: 0, btwCent: 0, terugCent: 0 })
}
