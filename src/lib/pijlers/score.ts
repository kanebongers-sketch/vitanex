// ─── MentaForce — canoniek scoremodel ───────────────────────────────────────
// Eén schaal, één waarheid. Alle bronnen normaliseren naar 0–100 (hoger = beter),
// en "geen data" is ALTIJD null — nooit een verzonnen 50 (zie readiness-bug in
// de audit; strijdig met de eerlijkheids-merkregel).
//
// Puur en getest. Deze module vervangt de ~10 verspreide `scoreKleur`-kopieën
// (types.ts, home, dashboard, mijn-rapport, VitaCompanion, …) met één schaal.

import type { PijlerKey } from './pijlers'

/** Klem een getal binnen 0–100. */
export function clamp0100(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, v))
}

// ── Normalisatie per brontype → 0–100 (hoger = beter) ───────────────────────

/** Lineaire 1–5 schaal (stemming, check-in-vraag, energie) → 0–100. */
export function vanSchaal1tot5(v: number): number {
  return clamp0100(((v - 1) / 4) * 100)
}

/** Stress 1–10 waarbij HOGER = slechter → 0–100 (geïnverteerd, hoger = beter). */
export function vanStress1tot10(v: number): number {
  return clamp0100(((10 - v) / 9) * 100)
}

/** Check-in-domeinscore op 4–20 (som van 2 vragen ×2) → 0–100. */
export function vanCheckin4tot20(v: number): number {
  return clamp0100(((v - 4) / 16) * 100)
}

/**
 * Slaapduur → 0–100 met optimaal venster 7–9u.
 * Onder 7u: −20 punten per uur tekort. Boven 9u: −12 per uur teveel.
 */
export function vanSlaapUren(uren: number): number {
  if (!Number.isFinite(uren) || uren <= 0) return 0
  if (uren >= 7 && uren <= 9) return 100
  if (uren < 7) return clamp0100(100 - (7 - uren) * 20)
  return clamp0100(100 - (uren - 9) * 12)
}

/** Doel-ratio (stappen, water): waarde t.o.v. dagdoel → 0–100 (max 100). */
export function vanDoelRatio(waarde: number, doel: number): number {
  if (!Number.isFinite(doel) || doel <= 0) return 0
  return clamp0100((waarde / doel) * 100)
}

// ── Pijlerscore uit meerdere bronnen ────────────────────────────────────────

export interface Bron {
  /** Reeds genormaliseerd naar 0–100. */
  waarde: number
  /** Relatief gewicht (>0). Standaard 1. */
  gewicht?: number
}

/**
 * Gewogen gemiddelde van alle bronnen MÉT data.
 * Geeft null terug als er geen enkele geldige bron is (→ "geen data", nooit fake).
 */
export function pijlerScore(bronnen: readonly Bron[]): number | null {
  const geldig = bronnen.filter((b) => Number.isFinite(b.waarde))
  if (geldig.length === 0) return null

  let som = 0
  let totaalGewicht = 0
  for (const b of geldig) {
    const gewicht = b.gewicht && b.gewicht > 0 ? b.gewicht : 1
    som += clamp0100(b.waarde) * gewicht
    totaalGewicht += gewicht
  }
  if (totaalGewicht <= 0) return null
  return Math.round(som / totaalGewicht)
}

// ── Overall Wellbeing Score ─────────────────────────────────────────────────

export interface PijlerScoreItem {
  key: PijlerKey
  score: number | null
}

export interface Wellbeing {
  /** Gemiddelde van de pijlers mét data, of null als er niets gemeten is. */
  score: number | null
  /** Aantal pijlers met data. */
  gemeten: number
  /** Totaal aantal pijlers (doorgaans 6). */
  totaal: number
}

/**
 * Overall score = gemiddelde van ALLEEN de pijlers met data. Ontbrekende
 * pijlers tellen nooit als 0 of 50 mee (lost de readiness-eerlijkheidsbug op);
 * we rapporteren expliciet "gemeten/totaal".
 */
export function wellbeingScore(pijlers: readonly PijlerScoreItem[]): Wellbeing {
  const totaal = pijlers.length
  const metData = pijlers.filter(
    (p): p is { key: PijlerKey; score: number } => p.score !== null && Number.isFinite(p.score),
  )
  if (metData.length === 0) return { score: null, gemeten: 0, totaal }

  const gem = metData.reduce((s, p) => s + p.score, 0) / metData.length
  return { score: Math.round(gem), gemeten: metData.length, totaal }
}

// ── Eén canonieke niveau-schaal (vervangt alle scoreKleur-kopieën) ──────────

export type ScoreNiveau = 'goed' | 'matig' | 'laag' | 'geen'

export interface NiveauInfo {
  niveau: ScoreNiveau
  label: string
  /** CSS-token voor de accentkleur. */
  kleur: string
  /** CSS-token voor de zachte/achtergrondvariant. */
  zacht: string
}

// Labels beschrijven de MÉTING, nooit de persoon. Daarom geen 'Matig'
// (schoolrapport-taal) en geen 'Gemiddeld' (impliceert een vergelijking met
// anderen die deze app nooit maakt). 'Geen data' is systeemtaal en klinkt als
// een storing — 'Nog niet gemeten' zegt wat er te doen is.
const NIVEAU_GEEN: NiveauInfo = { niveau: 'geen', label: 'Nog niet gemeten', kleur: 'var(--text-4)', zacht: 'var(--bg-subtle)' }
const NIVEAU_GOED: NiveauInfo = { niveau: 'goed', label: 'Goed', kleur: 'var(--brand)', zacht: 'var(--brand-soft)' }
const NIVEAU_MATIG: NiveauInfo = { niveau: 'matig', label: 'Redelijk', kleur: 'var(--status-warning)', zacht: 'var(--status-warning-soft)' }
const NIVEAU_LAAG: NiveauInfo = { niveau: 'laag', label: 'Vraagt aandacht', kleur: 'var(--status-danger)', zacht: 'var(--status-danger-soft)' }

/** Eén schaal voor de hele app: ≥70 goed · 40–69 matig · <40 aandacht · null geen data. */
export function scoreNiveau(score: number | null): NiveauInfo {
  if (score === null || !Number.isFinite(score)) return NIVEAU_GEEN
  if (score >= 70) return NIVEAU_GOED
  if (score >= 40) return NIVEAU_MATIG
  return NIVEAU_LAAG
}

// ── Trend t.o.v. de vorige periode ──────────────────────────────────────────

export type TrendRichting = 'op' | 'neer' | 'stabiel' | 'geen'

export interface Trend {
  richting: TrendRichting
  /** Procentueel verschil t.o.v. vorige periode, of null bij onvoldoende data. */
  deltaPct: number | null
}

/**
 * Trend van huidig t.o.v. vorig. Verschillen < 3% gelden als "stabiel"
 * (ruis-drempel, conform berekenVergelijkingen in gezondheid-metrics).
 */
export function berekenTrend(huidig: number | null, vorig: number | null): Trend {
  if (huidig === null || vorig === null || !Number.isFinite(huidig) || !Number.isFinite(vorig) || vorig === 0) {
    return { richting: 'geen', deltaPct: null }
  }
  const deltaPct = Math.round(((huidig - vorig) / vorig) * 100)
  if (Math.abs(deltaPct) < 3) return { richting: 'stabiel', deltaPct }
  return { richting: deltaPct > 0 ? 'op' : 'neer', deltaPct }
}
