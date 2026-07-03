// ─── Plannen & prijzen ────────────────────────────────────────────────────────
// Eén bron van waarheid voor de abonnementsplannen. De prijzen spiegelen de
// bestaande tarieven uit het admin-dashboard (per gebruiker, per maand).
//
// LET OP: welke features bij welk plan horen is een productbeslissing die hier
// bewust nog NIET is vastgelegd. `heeftMinimaalPlan` is de gating-helper voor
// wanneer die beslissing valt; er is nu nog geen feature achter een plan-slot.

export type Plan = 'starter' | 'groei' | 'enterprise'

export const PLAN_VOLGORDE: readonly Plan[] = ['starter', 'groei', 'enterprise'] as const

export interface PlanInfo {
  naam: string
  /** Prijs per gebruiker per maand in euro's. */
  prijsPerGebruiker: number
  omschrijving: string
  /** Wat dit plan concreet bevat — moet kloppen met de echte feature-gates. */
  kenmerken: readonly string[]
  /** Kan een HR-manager dit plan zelf online afsluiten (Stripe Checkout)? */
  zelfService: boolean
}

export const PLAN_INFO: Record<Plan, PlanInfo> = {
  starter: {
    naam: 'Starter',
    prijsPerGebruiker: 4,
    omschrijving: 'Voor teams die beginnen met welzijn meten.',
    kenmerken: [
      'Wekelijkse check-ins en dagstart',
      'Alle welzijnsmodules (slaap, stress, beweging …)',
      'Vita-companion — 15 gesprekken per dag',
      'Persoonlijk rapport en teamberichten',
    ],
    zelfService: true,
  },
  groei: {
    naam: 'Groei',
    prijsPerGebruiker: 7,
    omschrijving: 'Voor organisaties die welzijn structureel willen verbeteren.',
    kenmerken: [
      'Alles uit Starter',
      'Onbeperkt praten met Vita',
      'Persoonlijke patronen en AI-weekinzichten',
      'Team-analytics, eNPS en pulse-surveys (anoniem, ≥ 5 deelnemers)',
    ],
    zelfService: true,
  },
  enterprise: {
    naam: 'Enterprise',
    prijsPerGebruiker: 15,
    omschrijving: 'Maatwerk, onboarding en afspraken op organisatieniveau.',
    kenmerken: [
      'Alles uit Groei',
      'Persoonlijke onboarding en begeleiding',
      'Afspraken op maat (verwerkersovereenkomst, SLA)',
    ],
    zelfService: false,
  },
}

/** Normaliseert een ruwe plan-waarde uit de database naar een geldig Plan. */
export function normaliseerPlan(waarde: unknown): Plan {
  if (waarde === 'starter' || waarde === 'groei' || waarde === 'enterprise') return waarde
  return 'starter'
}

/** True als `plan` gelijk aan of hoger dan `minimaal` is (starter < groei < enterprise). */
export function heeftMinimaalPlan(plan: Plan, minimaal: Plan): boolean {
  return PLAN_VOLGORDE.indexOf(plan) >= PLAN_VOLGORDE.indexOf(minimaal)
}

// ─── Free vs. premium ─────────────────────────────────────────────────────────
// Starter (gratis) bevat alles wat de dagelijkse gewoonte draagt: check-in,
// dagstart, alle logging-modules, rapport, gamification en teamberichten.
// Premium verdiept: onbeperkte Vita, persoonlijke patronen/AI-inzichten en de
// HR-analytics-suite. Geen ads — dat botst met de merkbelofte (anoniem,
// AVG-conform) en met premium.

export type PremiumFeature =
  | 'vita_onbeperkt'
  | 'persoonlijke_patronen'
  | 'hr_analytics'

const FEATURE_MINIMAAL_PLAN: Record<PremiumFeature, Plan> = {
  vita_onbeperkt: 'groei',
  persoonlijke_patronen: 'groei',
  hr_analytics: 'groei',
}

export function heeftFeature(plan: Plan, feature: PremiumFeature): boolean {
  return heeftMinimaalPlan(plan, FEATURE_MINIMAAL_PLAN[feature])
}

/** Vita-berichten per dag op het gratis plan (premium: onbeperkt binnen anti-misbruik). */
export const VITA_GRATIS_BERICHTEN_PER_DAG = 15
