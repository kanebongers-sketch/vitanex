// ─── Club, lidgeld: opnieuw proberen met oplopend wachten (PUUR) ────────────
// Bouwplan 1.3: 1 minuut, 5 minuten, 30 minuten, 2 uur, 12 uur (daarna elke
// 12 uur), na 8 pogingen 'vast' met een melding voor Kane. Gebruikt door de
// outbox en de inbox.

const MINUUT = 60_000

export const WACHTTIJDEN_MS: readonly number[] = [1 * MINUUT, 5 * MINUUT, 30 * MINUUT, 120 * MINUUT, 720 * MINUUT]
export const MAX_POGINGEN = 8

/**
 * Stripe bewaart een idempotentiesleutel ongeveer 24 uur. Een opdracht die geld
 * beweegt proberen we daarna niet meer automatisch: dan zou een herhaling na
 * een verloren antwoord dubbel kunnen afschrijven. Ruim eronder blijven.
 */
export const SLEUTEL_VENSTER_MS = 23 * 60 * MINUUT

export type Herhaling = { status: 'opnieuw'; volgendeOp: Date } | { status: 'vast' }

/** Hoe lang wachten na deze mislukte poging (1 = de eerste). */
export function wachttijd(poging: number): number {
  const i = Math.min(Math.max(poging, 1), WACHTTIJDEN_MS.length) - 1
  return WACHTTIJDEN_MS[i]
}

/**
 * Het vroegste moment voor de volgende poging, gerekend vanaf de ontvangst
 * (PUUR, getest): de som van de wachttijden van alle eerdere pogingen. Voor
 * tabellen die geen eigen kolom voor de volgende poging hebben.
 */
export function vroegsteVolgende(ontvangenOp: Date, pogingen: number): Date {
  let ms = 0
  for (let p = 1; p <= pogingen; p++) ms += wachttijd(p)
  return new Date(ontvangenOp.getTime() + ms)
}

/**
 * Wat na een mislukte poging (PUUR, getest). `pogingen` telt de poging die net
 * mislukte mee. Met `eersteOp` (alleen bij geld) ook vast zodra de volgende
 * poging buiten het venster van de idempotentiesleutel valt.
 */
export function naMislukking(pogingen: number, nu: Date, eersteOp?: Date): Herhaling {
  if (pogingen >= MAX_POGINGEN) return { status: 'vast' }
  const volgendeOp = new Date(nu.getTime() + wachttijd(pogingen))
  if (eersteOp && volgendeOp.getTime() - eersteOp.getTime() > SLEUTEL_VENSTER_MS) return { status: 'vast' }
  return { status: 'opnieuw', volgendeOp }
}
