// ─── AI Your Gym: canonical voor de website (PUUR) ──────────────────────────
// Besluit Kane (24-10-2026): elke pagina heeft een adres, in beide talen
// hetzelfde (de taal komt uit de cookie). Dus alleen een canonical, geen
// hreflang. Relatief, zodat metadataBase (https://aiyourgym.com) er het volle
// adres van maakt.

export interface SiteAlternates {
  canonical: string
}

/** De canonical voor het publieke pad van een pagina ('/functies'). */
export function siteAlternates(publiekPad: string): SiteAlternates {
  return { canonical: publiekPad === '' ? '/' : publiekPad }
}
