// ─── Club, betalen in de ledenapp: instellingen (PUUR) ──────────────────────
// Alles uit env, met een eigen voorvoegsel (los van AI Your Gym-abonnementen,
// MentaForce en de webshop). Ontbreekt iets, dan is het antwoord null en toont
// Club eerlijk dat betalen nog niet klaar staat: nooit een kapotte betaalflow.
//
//   CLUB_BETALEN_ACTIEF           1 = aan. Standaard uit: dan bestaat alles hiervan niet (404).
//   CLUB_STRIPE_SECRET_KEY        sk_... of rk_... van het AI Your Gym-platformaccount (met Connect aan)
//   CLUB_STRIPE_WEBHOOK_SECRET    whsec_... van het Connect-webhook-endpoint
//   CLUB_LIDGELD_ACTIEF           1 = lidgeld (contracten, facturen, incasso) aan: inbox en
//                                 outbox werken pas dan. Standaard uit: alles doet niets.

type Env = Record<string, string | undefined>

/**
 * Geen platformdeel per betaling (besluit Kane 23-10-2026): betalen zit in het
 * pakket. We sturen nooit application_fee_amount mee; het hele bedrag (min de
 * Stripe-kosten, die de sportschool zelf betaalt) gaat naar de sportschool.
 * De kolom platform_fee_cent blijft voor de boekhouding en is altijd 0.
 */
export const PLATFORM_FEE_CENT = 0

function waarde(env: Env, naam: string): string | null {
  const v = env[naam]?.trim()
  return v && v !== 'undefined' ? v : null
}

/** Staat betalen in de ledenapp aan (env)? Standaard uit. */
export function betalenActief(env: Env = process.env): boolean {
  const v = waarde(env, 'CLUB_BETALEN_ACTIEF')
  return v === '1' || v === 'true'
}

/** Staat lidgeld (inbox, outbox, incasso) aan (env)? Standaard uit. */
export function lidgeldActief(env: Env = process.env): boolean {
  const v = waarde(env, 'CLUB_LIDGELD_ACTIEF')
  return v === '1' || v === 'true'
}

/** Live of test, afgeleid van de sleutel; events met een andere livemode tellen niet. */
export function sleutelIsLive(sleutel: string): boolean {
  return /^(sk|rk)_live_/.test(sleutel)
}

export function clubStripeSleutel(env: Env = process.env): string | null {
  const v = waarde(env, 'CLUB_STRIPE_SECRET_KEY')
  return v && /^(sk|rk)_(test|live)_/.test(v) ? v : null
}

export function clubWebhookGeheim(env: Env = process.env): string | null {
  const v = waarde(env, 'CLUB_STRIPE_WEBHOOK_SECRET')
  return v && v.startsWith('whsec_') ? v : null
}

export const NIET_KLAAR = 'Betalen staat nog niet klaar. Neem contact op met AI Your Gym.'
