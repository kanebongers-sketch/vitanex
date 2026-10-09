// ─── Slaapfases ───────────────────────────────────────────────────────────────
// Gemiddelde minuten per fase over de recente nachten waarin je bron fases
// meet. Een fase die nooit gemeten is blijft null (nooit 0 verzinnen).

import { gemiddelde, verschuifDatum } from './statistiek'
import type { GezondheidsDag, SlaapFases } from './types'

export const FASE_VOLGORDE = ['diep', 'rem', 'licht', 'wakker'] as const
export type Fase = (typeof FASE_VOLGORDE)[number]

export const FASE_LABELS: Record<Fase, string> = {
  diep: 'Diep', rem: 'REM', licht: 'Licht', wakker: 'Wakker',
}

export interface FaseGemiddelde {
  fases: SlaapFases
  nachten: number
}

export function gemiddeldeFases(
  dagen: readonly GezondheidsDag[], vandaag: string, aantalNachten = 7,
): FaseGemiddelde | null {
  const vanaf = verschuifDatum(vandaag, -(aantalNachten - 1))
  const nachten = dagen.filter((d) => d.datum >= vanaf && d.datum <= vandaag && d.fases !== null)
  if (nachten.length === 0) return null

  const perFase = (fase: Fase): number | null => {
    const waarden = nachten
      .map((d) => d.fases?.[fase] ?? null)
      .filter((w): w is number => w !== null)
    return gemiddelde(waarden)
  }
  return {
    fases: { diep: perFase('diep'), licht: perFase('licht'), rem: perFase('rem'), wakker: perFase('wakker') },
    nachten: nachten.length,
  }
}
