// ─── LifeOS — getallen weergeven ───────────────────────────────────────────
// Neutraal gedeeld. Stond ooit in `herstel/formatteer.ts` omdat herstel 'm het
// eerst nodig had; voeding importeerde 'm daar vandaan. Een gedeelde helper in
// een feature-map is een landmijn: wie ooit `herstel/` opruimt, sloopt voeding.
//
// Puur: geen React, geen imports. De regel die telt staat hieronder.

/**
 * Een getal in NL-notatie (komma als decimaalteken), afgerond op `decimalen`.
 *
 * **Null blijft null.** Een ontbrekende meting is geen '0' — dat onderscheid is
 * de kern van dit project, en het hoort al in de weergavelaag te zitten en niet
 * pas in het component dat 'm aanroept. Wie hier ooit `?? 0` toevoegt, zet één
 * regel om en verandert daarmee overal in de app "ik weet het niet" in "nul".
 */
export function getalTekst(waarde: number | null, decimalen = 0): string | null {
  if (waarde === null || !Number.isFinite(waarde)) return null
  return waarde.toLocaleString('nl-NL', {
    minimumFractionDigits: decimalen,
    maximumFractionDigits: decimalen,
  })
}
