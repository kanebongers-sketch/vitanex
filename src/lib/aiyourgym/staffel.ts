// ─── AI Your Gym: staffel per vestiging op aantal actieve leden (PUUR) ──────
// Besluit Kane (31-10-2026): de prijs per pakket hangt af van het aantal
// actieve leden van een vestiging. De staffels: tot 25, tot 50, tot 100, tot
// 200, tot 500, tot 1000, tot 5000, daarboven prijs op maat.
//
// Hier staan ALLEEN de grenzen. De bedragen staan alleen in Stripe (een
// getrapte prijs per pakket, `billing_scheme=tiered`, `tiers_mode=volume`, een
// vast bedrag per staffel) en in docs/aiyourgym/STRIPE.md; nooit in de code of
// op de website.
//
// De hoeveelheid op elke regel van het Stripe-abonnement van een vestiging is
// het aantal actieve leden (minimaal 1). Stripe kiest met tiers_mode=volume de
// staffel waar die hoeveelheid in valt; 25 valt in "tot 25", 26 in "tot 50".
// Boven 5000 zetten we nooit automatisch iets: dat is prijs op maat (Kane).

/** De bovengrenzen van de staffels, oplopend. De laatste grens is de grootste automatische. */
export const STAFFEL_GRENZEN = [25, 50, 100, 200, 500, 1000, 5000] as const
export type StaffelGrens = (typeof STAFFEL_GRENZEN)[number]

/** Boven deze grens: prijs op maat, nooit automatisch. */
export const MAX_AUTOMATISCH: StaffelGrens = STAFFEL_GRENZEN[STAFFEL_GRENZEN.length - 1]

export type Staffel = { soort: 'staffel'; grens: StaffelGrens; nummer: number } | { soort: 'op_maat' }

export function isStaffelGrens(v: unknown): v is StaffelGrens {
  return typeof v === 'number' && (STAFFEL_GRENZEN as readonly number[]).includes(v)
}

/**
 * De staffel van een aantal actieve leden. Een grens telt mee in zijn eigen
 * staffel (25 = tot 25, 26 = tot 50). 0 of minder telt als 1 (een vestiging
 * zonder leden betaalt de eerste staffel). Geen geheel getal = null.
 */
export function staffelVoor(aantal: number): Staffel | null {
  if (!Number.isInteger(aantal)) return null
  const n = Math.max(1, aantal)
  const i = STAFFEL_GRENZEN.findIndex((g) => n <= g)
  return i === -1 ? { soort: 'op_maat' } : { soort: 'staffel', grens: STAFFEL_GRENZEN[i], nummer: i + 1 }
}

/**
 * De hoeveelheid voor Stripe: het aantal actieve leden, minimaal 1. Boven de
 * laatste grens null (prijs op maat: niet automatisch).
 */
export function stripeHoeveelheid(aantal: number): number | null {
  if (!Number.isInteger(aantal)) return null
  const n = Math.max(1, aantal)
  return n <= MAX_AUTOMATISCH ? n : null
}

/** Zelfde staffel? (Zelfde staffel = zelfde bedrag, want elke staffel heeft een vast bedrag.) */
export function zelfdeStaffel(a: number, b: number): boolean {
  const x = staffelVoor(a)
  const y = staffelVoor(b)
  if (!x || !y) return false
  if (x.soort === 'op_maat' || y.soort === 'op_maat') return x.soort === y.soort
  return x.grens === y.grens
}

/** Een keuze van "op maat" bij het aanmelden: meer dan 5000 leden. */
export const OP_MAAT = 'op_maat' as const

export type LedenSchatting = StaffelGrens | typeof OP_MAAT

/**
 * De schatting bij het aanmelden (systeemgrens): een van de grenzen, als getal
 * of tekst ("100"), of "op_maat". Anders null.
 */
export function leesLedenSchatting(ruw: unknown): LedenSchatting | null {
  if (ruw === OP_MAAT) return OP_MAAT
  const n = typeof ruw === 'number' ? ruw : typeof ruw === 'string' && /^\d{1,4}$/.test(ruw.trim()) ? Number(ruw) : NaN
  return isStaffelGrens(n) ? n : null
}
