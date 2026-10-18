// ─── Club, betalen in de ledenapp: instellingen (PUUR) ──────────────────────
// Alles uit env, met een eigen voorvoegsel (los van AI Your Gym-abonnementen,
// MentaForce en de webshop). Ontbreekt iets, dan is het antwoord null en toont
// Club eerlijk dat betalen nog niet klaar staat: nooit een kapotte betaalflow.
//
//   CLUB_BETALEN_ACTIEF           1 = aan. Standaard uit: dan bestaat alles hiervan niet (404).
//   CLUB_STRIPE_SECRET_KEY        sk_... of rk_... van het AI Your Gym-platformaccount (met Connect aan)
//   CLUB_STRIPE_WEBHOOK_SECRET    whsec_... van het Connect-webhook-endpoint

type Env = Record<string, string | undefined>

/**
 * Het deel van elke betaling dat naar AI Your Gym gaat (application fee), in
 * procenten. BESLISSING VAN KANE: staat bewust op 0 tot Kane een prijs kiest.
 * Niet zelf invullen. Bij 0 sturen we geen application_fee_amount mee en gaat
 * het hele bedrag (min de Stripe-kosten) naar de sportschool.
 */
export const PLATFORM_FEE_PROCENT = 0

function waarde(env: Env, naam: string): string | null {
  const v = env[naam]?.trim()
  return v && v !== 'undefined' ? v : null
}

/** Staat betalen in de ledenapp aan (env)? Standaard uit. */
export function betalenActief(env: Env = process.env): boolean {
  const v = waarde(env, 'CLUB_BETALEN_ACTIEF')
  return v === '1' || v === 'true'
}

export function clubStripeSleutel(env: Env = process.env): string | null {
  const v = waarde(env, 'CLUB_STRIPE_SECRET_KEY')
  return v && /^(sk|rk)_(test|live)_/.test(v) ? v : null
}

export function clubWebhookGeheim(env: Env = process.env): string | null {
  const v = waarde(env, 'CLUB_STRIPE_WEBHOOK_SECRET')
  return v && v.startsWith('whsec_') ? v : null
}

/** De platformfee in centen bij dit bedrag (afgerond); 0 zolang het percentage 0 is. */
export function platformFeeCent(bedragCent: number, procent: number = PLATFORM_FEE_PROCENT): number {
  if (!Number.isFinite(procent) || procent <= 0) return 0
  return Math.min(bedragCent, Math.round((bedragCent * procent) / 100))
}

export const NIET_KLAAR = 'Betalen staat nog niet klaar. Neem contact op met AI Your Gym.'
