// ─── LifeOS — CRM: monogram ─────────────────────────────────────────────────
// De initialen voor de avatar op een persoon-kaart. Puur, geen React.
//
// Deterministisch: dezelfde naam geeft altijd dezelfde initialen, zodat de
// monogram niet flikkert tussen renders. STRIKT navy+cyan: de monogram krijgt
// géén eigen kleur-per-persoon (dat zou de twee-tonige regel breken) — alle
// monogrammen delen dezelfde cyan-op-navy behandeling in de UI. Deze functie
// levert dus alleen de letters, geen kleur.

/**
 * 1–2 initialen uit een naam.
 *   "Kane Bongers"      → "KB"
 *   "Henri"             → "HE"
 *   "jan de vries"      → "JV"  (voorvoegsels tellen niet als los woord voor de
 *                                laatste initiaal? nee — simpel: eerste + laatste)
 *   ""                  → "?"
 * Houdt het simpel en voorspelbaar; een CRM-monogram hoeft geen naamkunde.
 */
export function initialen(naam: string): string {
  const woorden = naam.trim().split(/\s+/).filter(Boolean)
  if (woorden.length === 0) return '?'

  if (woorden.length === 1) {
    const w = woorden[0]
    return (w.length >= 2 ? w.slice(0, 2) : w).toUpperCase()
  }

  const eerste = woorden[0][0]
  const laatste = woorden[woorden.length - 1][0]
  return (eerste + laatste).toUpperCase()
}
