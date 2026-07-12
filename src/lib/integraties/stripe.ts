// ─── Stripe server-helper ─────────────────────────────────────────────────────
// Alleen in API-routes gebruiken (server-side). Zonder geconfigureerde keys
// geven de helpers null terug en vallen de routes eerlijk terug op
// "neem contact op" — er wordt nooit een kapotte betaalflow getoond.
import Stripe from 'stripe'
import type { Plan } from '@/lib/plan/plan'

let cached: Stripe | null = null

/** Stripe-client, of null als STRIPE_SECRET_KEY niet is geconfigureerd. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!cached) cached = new Stripe(key)
  return cached
}

/** Stripe Price-ID voor een zelf-service plan, of null als die niet is geconfigureerd. */
export function stripePriceIdVoorPlan(plan: Plan): string | null {
  if (plan === 'starter') return process.env.STRIPE_PRICE_STARTER || null
  if (plan === 'groei') return process.env.STRIPE_PRICE_GROEI || null
  return null
}

export const BETALEN_NIET_BESCHIKBAAR =
  'Online betalen is nog niet beschikbaar. Neem contact op via info@mentaforce.nl, dan regelen we het samen.'
