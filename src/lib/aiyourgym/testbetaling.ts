// ─── AI Your Gym: nagespeelde betaling zolang Stripe er niet is (PUUR) ──────
// Besluit Kane (23-10-2026): iemand moet zich nu al kunnen aanmelden, "betalen"
// en meteen alles instellen, ook zonder Stripe. Is een pakket niet echt af te
// sluiten (geen sleutel of prijs), dan krijgt de aanmelding een eigen
// sessie-id test_... en een betaalpagina op onze site die duidelijk zegt dat er
// niets wordt afgeschreven. Afronden doet daarna precies wat de Stripe-webhook
// doet (verwerkSessie): de sportschool inrichten, een keer.
//
// Uit met AIYOURGYM_TESTBETALING=0. Staat Stripe voor een pakket ingesteld, dan
// telt alleen Stripe en is de testbetaling voor dat pakket vanzelf weg.

import { afsluitbaar } from './config'
import type { PakketSleutel } from './pakketten'
import type { AfgerondeSessie } from './stripe-event'

type Env = Record<string, string | undefined>

/** Het sessie-id van een testbetaling: test_ plus 32 tekens base64url (192 bits). */
export const TEST_SESSIE = /^test_[A-Za-z0-9_-]{32}$/

export function isTestSessie(v: unknown): v is string {
  return typeof v === 'string' && TEST_SESSIE.test(v)
}

/** Rondt dit pakket nu af met een testbetaling (Stripe ontbreekt en de testbetaling staat niet uit)? */
export function testbetalen(sleutel: PakketSleutel, env: Env = process.env): boolean {
  return !afsluitbaar(sleutel, env) && env.AIYOURGYM_TESTBETALING?.trim() !== '0'
}

/** Kan iemand zich voor dit pakket nu online aanmelden, met Stripe of met een testbetaling? */
export function aanmeldbaar(sleutel: PakketSleutel, env: Env = process.env): boolean {
  return afsluitbaar(sleutel, env) || testbetalen(sleutel, env)
}

/**
 * Een afgeronde testbetaling in dezelfde vorm als een Stripe-sessie, zodat het
 * inrichten precies dezelfde (idempotente) weg gaat. Zonder klant en abonnement:
 * daaraan herken je in ayg_aanmeldingen dat er nog niet echt betaald is.
 */
export function testSessie(sessieId: string, aanmeldingId: string): AfgerondeSessie {
  return {
    sessieId,
    aanmeldingId,
    status: 'complete',
    betaalStatus: 'no_payment_required',
    mode: 'subscription',
    klantId: null,
    abonnementId: null,
  }
}
