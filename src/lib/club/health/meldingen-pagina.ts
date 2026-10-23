// ─── Club, health: meldingen op de pagina Koppelingen (PUUR) ────────────────
// De terugweg na het koppelen geeft alleen een vaste code mee (?fout=), nooit tekst van buiten.

/** De meldingen die de pagina kent. */
export const FOUT_TEKST: Readonly<Record<string, string>> = {
  geen_toestemming: 'Kies eerst welke gegevens je wilt delen. Daarna kun je koppelen.',
  niet_beschikbaar: 'Deze koppeling is nog niet beschikbaar.',
  geweigerd: 'Je hebt de koppeling niet goedgekeurd. Er is niets opgeslagen.',
  verlopen: 'Het koppelen duurde te lang. Probeer het opnieuw.',
  ongeldig: 'Er ging iets mis bij het koppelen. Probeer het opnieuw.',
  token: 'De app gaf geen toegang. Probeer het opnieuw.',
  opslaan: 'Opslaan lukte niet. Probeer het later opnieuw.',
  voorvertoning: 'In de voorvertoning kun je niet koppelen.',
}
