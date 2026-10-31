// ─── AI Your Gym: contactgegevens van de website (PUUR) ─────────────────────
// Kane vult deze zelf in. Zolang een waarde null is, toont de website hem
// nergens (geen verzonnen nummer of adres): de contactbalk toont dan alleen
// "Plan een demo".

export interface AygContact {
  /** Zoals het op de website staat, bijv. "040 123 45 67". */
  telefoon: string | null
  email: string | null
}

export const AYG_CONTACT: AygContact = {
  telefoon: null,
  email: null,
}

/** Een tel:-link uit een getoond nummer: alleen cijfers en een plus. */
export function telLink(telefoon: string): string {
  return `tel:${telefoon.replace(/[^\d+]/g, '')}`
}

/** Er is iets om te tonen in de contactbalk naast de demo-knop. */
export function heeftContact(c: AygContact = AYG_CONTACT): boolean {
  return Boolean(c.telefoon?.trim() || c.email?.trim())
}
