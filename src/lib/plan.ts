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
  /** Kan een HR-manager dit plan zelf online afsluiten (Stripe Checkout)? */
  zelfService: boolean
}

export const PLAN_INFO: Record<Plan, PlanInfo> = {
  starter: {
    naam: 'Starter',
    prijsPerGebruiker: 4,
    omschrijving: 'Voor teams die beginnen met welzijn meten.',
    zelfService: true,
  },
  groei: {
    naam: 'Groei',
    prijsPerGebruiker: 7,
    omschrijving: 'Voor organisaties die welzijn structureel willen verbeteren.',
    zelfService: true,
  },
  enterprise: {
    naam: 'Enterprise',
    prijsPerGebruiker: 15,
    omschrijving: 'Maatwerk, onboarding en afspraken op organisatieniveau.',
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
