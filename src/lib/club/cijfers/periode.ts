// ─── Fit Factory Club: periode en bereik van de cijfers (PUUR) ──────────────
// Periode en bereik staan in de URL (?weken=12&bereik=alle), zodat een rapport
// deelbaar is en terug/vooruit werkt.

import { maandagVan, plusDagen } from './tijd'

export const PERIODES = [4, 12, 26, 52] as const
export type Periode = (typeof PERIODES)[number]
export const STANDAARD_PERIODE: Periode = 12

export type Bereik = 'vestiging' | 'alle'

function eerste(ruw: string | string[] | undefined | null): string | undefined {
  return Array.isArray(ruw) ? ruw[0] : (ruw ?? undefined)
}

export function kiesPeriode(ruw: string | string[] | undefined | null): Periode {
  const n = Number(eerste(ruw))
  return (PERIODES as readonly number[]).includes(n) ? (n as Periode) : STANDAARD_PERIODE
}

export function kiesBereik(ruw: string | string[] | undefined | null): Bereik {
  return eerste(ruw) === 'alle' ? 'alle' : 'vestiging'
}

/**
 * De maandagen van de laatste `weken` weken, oudste eerst. De laatste is de
 * lopende week (die telt dus nog niet compleet mee).
 */
export function wekenReeks(vandaag: string, weken: number): string[] {
  const deze = maandagVan(vandaag)
  return Array.from({ length: weken }, (_, i) => plusDagen(deze, (i - weken + 1) * 7))
}

/** Eerste dag van de periode (maandag van de oudste week). */
export function periodeStart(vandaag: string, weken: number): string {
  return wekenReeks(vandaag, weken)[0]
}
