import { isObject, getalOfNull, tekstOfNull } from '@/lib/lifeos/api/http'

// ─── Burn-out-risico: het rekenwerk, los van het tekenwerk ──────────────────
// Puur: geen React, geen fetch. De omkering hieronder is te belangrijk om
// verstopt te zitten in een component — hier is hij leesbaar en testbaar.

export type Trend = 'stijgend' | 'dalend' | 'stabiel'

export interface RisicoWeek {
  /** 0–100 waarbij HOGER = MEER risico. Let op: andersom dan een pijlerscore. */
  risico: number
  weekStart: string
  trend: Trend
  factor: string | null
}

const TRENDS: readonly Trend[] = ['stijgend', 'dalend', 'stabiel']

function leesTrend(v: unknown): Trend {
  return typeof v === 'string' && (TRENDS as readonly string[]).includes(v) ? (v as Trend) : 'stabiel'
}

/**
 * De check-in-domeinen zoals de voorspeller ze weegt (zie de route).
 *
 * Dit zijn NIET de zes pijlers — `balans` en `motivatie` bestaan daar niet — dus
 * bewust een eigen lijst en niet `PIJLERS`. Ze op elkaar willen laten passen zou
 * betekenen dat er één stilletjes verdwijnt.
 */
export const FACTOR_LABEL: Readonly<Record<string, string>> = Object.freeze({
  stress: 'stress',
  slaap: 'slaap',
  energie: 'energie',
  balans: 'werk-privébalans',
  focus: 'focus',
  motivatie: 'motivatie',
})

/** Narrowt `GET /api/burnout-predictor` → `{scores: [...]}` (nieuwste eerst). */
export function leesRisico(ruw: unknown): { weken: RisicoWeek[] } | null {
  if (!isObject(ruw) || !Array.isArray(ruw.scores)) return null

  const weken: RisicoWeek[] = []
  for (const rij of ruw.scores) {
    if (!isObject(rij)) return null
    const risico = getalOfNull(rij.risico_score)
    const weekStart = tekstOfNull(rij.week_start)
    if (risico === null || weekStart === null) return null
    weken.push({
      risico,
      weekStart,
      trend: leesTrend(rij.trending),
      factor: tekstOfNull(rij.dominante_factor),
    })
  }
  return { weken }
}

/**
 * De uitkomst van `POST /api/burnout-predictor` — de route die wél rékent.
 *
 * Twee geldige uitkomsten, en ze mogen niet op één hoop: "uitgerekend" en "je
 * hebt geen check-ins om mee te rekenen" zijn allebei succes, maar ze vragen een
 * ander antwoord op het scherm.
 */
export type Berekening =
  | { soort: 'berekend'; risico: number }
  | { soort: 'geen-checkins' }

/** Narrowt het POST-antwoord. `null` = onverwachte vorm → foutstaat. */
export function leesBerekening(ruw: unknown): Berekening | null {
  if (!isObject(ruw)) return null

  const risico = getalOfNull(ruw.risico_score)
  if (risico !== null) return { soort: 'berekend', risico }

  // De route antwoordt met 200 + `{bericht}` als er geen check-ins zijn. Geen
  // fout — er valt gewoon niets te berekenen.
  if (tekstOfNull(ruw.bericht) !== null) return { soort: 'geen-checkins' }

  return null
}

export interface RisicoNiveau {
  label: string
  kleur: string
}

/**
 * Omgekeerde banden: <35 laag · 35–64 verhoogd · ≥65 hoog.
 *
 * Nadrukkelijk NIET `scoreNiveau()` uit lib/pijlers: die gaat ervan uit dat hoog
 * = goed en zou een risico van 90 in het merk-accent zetten alsof het nieuws was
 * om blij van te worden.
 */
export function risicoNiveau(risico: number): RisicoNiveau {
  if (risico >= 65) return { label: 'Hoog', kleur: 'var(--status-laag)' }
  if (risico >= 35) return { label: 'Verhoogd', kleur: 'var(--status-aandacht)' }
  return { label: 'Laag', kleur: 'var(--status-goed)' }
}
