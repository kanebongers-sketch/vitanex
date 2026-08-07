// ─── Sport — statistiek (pure) ──────────────────────────────────────────────
// Geschat 1RM, persoonlijk record en trainingsstreak. PUUR en getest zodat de
// cijfers die de gebruiker motiveren kloppen — geen verzonnen records.

export interface SetWaarde {
  herhalingen: number
  gewichtKg: number | null
}

/**
 * Geschat 1-herhalingsmaximum via de Epley-formule: gewicht × (1 + reps/30).
 * Bij één herhaling is het gewicht zelf het 1RM. 0 bij onbruikbare invoer.
 */
export function geschat1RM(gewichtKg: number, herhalingen: number): number {
  if (!(gewichtKg > 0) || !(herhalingen > 0)) return 0
  if (herhalingen === 1) return Math.round(gewichtKg)
  return Math.round(gewichtKg * (1 + herhalingen / 30))
}

/** Het hoogste geschatte 1RM over alle sets (de kracht-PR). */
export function beste1RM(sets: readonly SetWaarde[]): number {
  return sets.reduce((max, s) => Math.max(max, s.gewichtKg ? geschat1RM(s.gewichtKg, s.herhalingen) : 0), 0)
}

/** Het zwaarste gewicht dat ooit is getild (de load-PR). */
export function piekGewicht(sets: readonly SetWaarde[]): number {
  return sets.reduce((max, s) => Math.max(max, s.gewichtKg ?? 0), 0)
}

/** In welke 7-daagse bak valt deze datum (consistente bucketing, voor streaks). */
function weekBak(datum: string): number | null {
  const d = new Date(`${datum}T00:00:00Z`)
  const ms = d.getTime()
  if (Number.isNaN(ms)) return null
  return Math.floor(ms / 86_400_000 / 7)
}

/**
 * Aantal opeenvolgende weken met minstens één training, eindigend in deze week of
 * de vorige (zodat de streak niet meteen breekt als je deze week nog moet). 0 als er
 * niet recent is getraind.
 */
export function weekStreak(datums: readonly string[], vandaag: string): number {
  const weken = new Set<number>()
  for (const d of datums) {
    const w = weekBak(d)
    if (w !== null) weken.add(w)
  }
  const nu = weekBak(vandaag)
  if (nu === null || weken.size === 0) return 0

  let anker: number
  if (weken.has(nu)) anker = nu
  else if (weken.has(nu - 1)) anker = nu - 1
  else return 0

  let streak = 0
  let w = anker
  while (weken.has(w)) {
    streak++
    w--
  }
  return streak
}
