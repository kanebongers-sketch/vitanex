// ─── AI Your Gym: instellingen voor betalen en mailen (PUUR) ────────────────
// Alles uit env, met een eigen voorvoegsel AIYOURGYM_ (los van MentaForce en de
// webshop). Ontbreekt iets, dan is het antwoord null en toont de site eerlijk
// dat aanmelden nog niet open is: nooit een kapotte betaalflow.
//
//   AIYOURGYM_STRIPE_SECRET_KEY        sk_test_... of sk_live_...
//   AIYOURGYM_STRIPE_WEBHOOK_SECRET    whsec_...
//   AIYOURGYM_STRIPE_PRIJS_<SLEUTEL>   price_... per pakket (ADMINISTRATIE, LESSEN, TRAINING,
//                                      AFSPRAKEN, TEAM, GROEI): een getrapte prijs per vestiging
//                                      per maand, staffel op actieve leden (besluit Kane 31-10-2026,
//                                      src/lib/aiyourgym/staffel.ts). Geen bundel meer.
//   AIYOURGYM_RESEND_FROM              afzender voor de welkomstmail (optioneel)
//   AIYOURGYM_PORTAAL_URL              basis voor de inloglink zonder subdomeinen (optioneel)

import { PAKKET_SLEUTELS, metBasis, type PakketSleutel } from './pakketten'

type Env = Record<string, string | undefined>

function waarde(env: Env, naam: string): string | null {
  const v = env[naam]?.trim()
  return v && v !== 'undefined' ? v : null
}

export function prijsEnvNaam(sleutel: PakketSleutel): string {
  return `AIYOURGYM_STRIPE_PRIJS_${sleutel.toUpperCase()}`
}

const PRIJS_ID = /^price_[A-Za-z0-9]{6,}$/

/** Het Stripe-prijs-id van een pakket, alleen als het op een price-id lijkt. */
export function stripePrijs(sleutel: PakketSleutel, env: Env = process.env): string | null {
  const v = waarde(env, prijsEnvNaam(sleutel))
  return v && PRIJS_ID.test(v) ? v : null
}

export function stripeSleutel(env: Env = process.env): string | null {
  const v = waarde(env, 'AIYOURGYM_STRIPE_SECRET_KEY')
  return v && /^(sk|rk)_(test|live)_/.test(v) ? v : null
}

export function webhookGeheim(env: Env = process.env): string | null {
  const v = waarde(env, 'AIYOURGYM_STRIPE_WEBHOOK_SECRET')
  return v && v.startsWith('whsec_') ? v : null
}

/** Kan dit pakket nu online worden afgesloten? Alleen met sleutel en prijs. */
export function afsluitbaar(sleutel: PakketSleutel, env: Env = process.env): boolean {
  return stripeSleutel(env) !== null && stripePrijs(sleutel, env) !== null
}

/** Een regel op het Stripe-abonnement van een vestiging: een pakket met zijn getrapte prijs. */
export interface StripeRegel {
  regel: PakketSleutel
  prijsId: string
}

/**
 * De regels voor deze pakketten op een Stripe-abonnement (PUUR): een regel per
 * pakket, alleen als elk pakket een prijs heeft; anders null (een abonnement
 * met deels prijzen kan niet). De basis (Ledenadministratie) staat er altijd
 * bij (besluit Kane 31-10-2026). Geen bundel meer (besluit Kane 31-10-2026).
 */
export function stripeRegels(pakketten: readonly PakketSleutel[], env: Env = process.env): StripeRegel[] | null {
  if (pakketten.length === 0) return null
  const regels = metBasis(pakketten).map((regel) => ({ regel, prijsId: stripePrijs(regel, env) }))
  return regels.every((r) => r.prijsId !== null) ? (regels as StripeRegel[]) : null
}

/** Kunnen al deze pakketten samen via Stripe? Met sleutel en een prijs per pakket. */
export function allesAfsluitbaar(pakketten: readonly PakketSleutel[], env: Env = process.env): boolean {
  return stripeSleutel(env) !== null && stripeRegels(pakketten, env) !== null
}

/** Het pakket achter een Stripe-prijs-id (voor abonnementswijzigingen in de webhook), of null. */
export function pakketVanPrijs(prijsId: string, env: Env = process.env): PakketSleutel | null {
  return PAKKET_SLEUTELS.find((p) => stripePrijs(p, env) === prijsId) ?? null
}

/** Alle prijs-id's die van ons zijn (de zes pakketten): alleen die passen we aan op een abonnement. */
export function eigenPrijzen(env: Env = process.env): string[] {
  return PAKKET_SLEUTELS.map((p) => stripePrijs(p, env)).filter((p): p is string => p !== null)
}

/** De afzender van de welkomstmail; zonder (of zonder Resend-sleutel) mailen we niet. */
export function mailAfzender(env: Env = process.env): string | null {
  const van = waarde(env, 'AIYOURGYM_RESEND_FROM')
  return van && waarde(env, 'RESEND_API_KEY') ? van : null
}

export const NIET_OPEN = 'Aanmelden is nog niet open.'
