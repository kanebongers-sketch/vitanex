// ─── AI Your Gym: instellingen voor betalen en mailen (PUUR) ────────────────
// Alles uit env, met een eigen voorvoegsel AIYOURGYM_ (los van MentaForce en de
// webshop). Ontbreekt iets, dan is het antwoord null en toont de site eerlijk
// dat aanmelden nog niet open is: nooit een kapotte betaalflow.
//
//   AIYOURGYM_STRIPE_SECRET_KEY        sk_test_... of sk_live_...
//   AIYOURGYM_STRIPE_WEBHOOK_SECRET    whsec_...
//   AIYOURGYM_STRIPE_PRIJS_<SLEUTEL>   price_... per los pakket (ADMINISTRATIE, LESSEN,
//                                      TRAINING, AFSPRAKEN, TEAM, GROEI), per vestiging per maand
//   AIYOURGYM_STRIPE_PRIJS_ALLES       price_... de bundel: alle zes pakketten samen, per vestiging
//                                      per maand (besluit Kane 30-10-2026)
//   AIYOURGYM_RESEND_FROM              afzender voor de welkomstmail (optioneel)
//   AIYOURGYM_PORTAAL_URL              basis voor de inloglink zonder subdomeinen (optioneel)

import { PAKKET_SLEUTELS, isAllePakketten, metBasis, type PakketSleutel } from './pakketten'

type Env = Record<string, string | undefined>

function waarde(env: Env, naam: string): string | null {
  const v = env[naam]?.trim()
  return v && v !== 'undefined' ? v : null
}

export function prijsEnvNaam(sleutel: PakketSleutel): string {
  return `AIYOURGYM_STRIPE_PRIJS_${sleutel.toUpperCase()}`
}

const PRIJS_ID = /^price_[A-Za-z0-9]{6,}$/

/** De env-naam van de bundelprijs (alle zes pakketten samen). */
export const ALLES_ENV = 'AIYOURGYM_STRIPE_PRIJS_ALLES'

/** Het Stripe-prijs-id van een pakket, alleen als het op een price-id lijkt. */
export function stripePrijs(sleutel: PakketSleutel, env: Env = process.env): string | null {
  const v = waarde(env, prijsEnvNaam(sleutel))
  return v && PRIJS_ID.test(v) ? v : null
}

/** Het Stripe-prijs-id van de bundel (alle zes pakketten), alleen als het op een price-id lijkt. */
export function stripePrijsAlles(env: Env = process.env): string | null {
  const v = waarde(env, ALLES_ENV)
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

/** Een regel op het Stripe-abonnement: een los pakket of de bundel van alle zes. */
export type StripeRegelSoort = PakketSleutel | 'alles'

export interface StripeRegel {
  regel: StripeRegelSoort
  prijsId: string
}

/**
 * De regels voor deze pakketten op een Stripe-abonnement (PUUR). Alle zes en
 * een bundelprijs: een regel met de bundel (besluit Kane 30-10-2026). Anders een
 * regel per pakket, alleen als elk pakket een prijs heeft. Ontbreekt er een
 * prijs, dan null (een abonnement met deels prijzen kan niet). Alle zes zonder
 * bundelprijs: zes losse regels, als die er alle zes zijn. De basis
 * (Ledenadministratie) staat er altijd bij (besluit Kane 31-10-2026).
 */
export function stripeRegels(pakketten: readonly PakketSleutel[], env: Env = process.env): StripeRegel[] | null {
  if (pakketten.length === 0) return null
  const lijst = metBasis(pakketten)
  const alles = stripePrijsAlles(env)
  if (alles && isAllePakketten(lijst)) return [{ regel: 'alles', prijsId: alles }]
  const regels = lijst.map((regel) => ({ regel, prijsId: stripePrijs(regel, env) }))
  return regels.every((r) => r.prijsId !== null) ? (regels as StripeRegel[]) : null
}

/** Kunnen al deze pakketten samen via Stripe? Met sleutel, en een prijs per regel (of de bundel). */
export function allesAfsluitbaar(pakketten: readonly PakketSleutel[], env: Env = process.env): boolean {
  return stripeSleutel(env) !== null && stripeRegels(pakketten, env) !== null
}

/** Is de bundel (alle zes pakketten) online af te sluiten? */
export function bundelAfsluitbaar(env: Env = process.env): boolean {
  return stripeSleutel(env) !== null && stripePrijsAlles(env) !== null
}

/** Het pakket achter een Stripe-prijs-id (voor abonnementswijzigingen in de webhook), of null. De bundel is geen los pakket. */
export function pakketVanPrijs(prijsId: string, env: Env = process.env): PakketSleutel | null {
  return PAKKET_SLEUTELS.find((p) => stripePrijs(p, env) === prijsId) ?? null
}

/** Alle prijs-id's die van ons zijn (de zes losse en de bundel): alleen die passen we aan op een abonnement. */
export function eigenPrijzen(env: Env = process.env): string[] {
  return [...PAKKET_SLEUTELS.map((p) => stripePrijs(p, env)), stripePrijsAlles(env)].filter((p): p is string => p !== null)
}

/** De afzender van de welkomstmail; zonder (of zonder Resend-sleutel) mailen we niet. */
export function mailAfzender(env: Env = process.env): string | null {
  const van = waarde(env, 'AIYOURGYM_RESEND_FROM')
  return van && waarde(env, 'RESEND_API_KEY') ? van : null
}

export const NIET_OPEN = 'Aanmelden is nog niet open.'
