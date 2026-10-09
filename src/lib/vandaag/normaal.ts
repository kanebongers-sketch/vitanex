// ─── MentaForce Vandaag-kaart — je persoonlijke normaal ────────────────────────────────
// "Slecht geslapen" betekent voor iedereen iets anders. De kaart vergelijkt met
// jóuw normaal: de mediaan van je recente dagen. De mediaan, niet het gemiddelde:
// één gebroken nacht of één marathon trekt hem niet scheef.
//
// Te weinig metingen = geen normaal. Dan valt de kaart terug op algemene
// richtlijnen en zegt hij eerlijk dat hij je nog niet kent.

/** Zoveel dagen kijken we terug. Lang genoeg voor een patroon, kort genoeg om mee te bewegen. */
export const NORMAAL_DAGEN = 28

/** Minimum aantal metingen voor een normaal. */
export const MIN_METINGEN = 5

/** De mediaan van de recentste metingen, of null bij te weinig data. Onzinwaarden tellen niet. */
export function normaal(historie: readonly number[], minimaal = MIN_METINGEN): number | null {
  const waarden = historie
    .slice(0, NORMAAL_DAGEN)
    .filter((w) => Number.isFinite(w) && w > 0)
    .slice()
    .sort((a, b) => a - b)
  if (waarden.length < minimaal) return null
  const midden = Math.floor(waarden.length / 2)
  return waarden.length % 2 === 1 ? waarden[midden] : Math.round((waarden[midden - 1] + waarden[midden]) / 2)
}
