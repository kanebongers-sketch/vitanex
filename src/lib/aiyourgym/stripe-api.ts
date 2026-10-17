// ─── AI Your Gym: de Stripe-API (SERVER-ONLY) ───────────────────────────────
// Rechtstreeks via fetch op api.stripe.com met de eigen sleutel
// AIYOURGYM_STRIPE_SECRET_KEY (los van MentaForce en de webshop). Twee
// aanroepen: een Checkout Session maken en er een ophalen. De sleutel gaat
// nooit naar de browser of in een log.

import { PROEFDAGEN } from './pakketten'
import type { Aanmelding } from './aanmelding'

const STRIPE = 'https://api.stripe.com/v1'
const TIMEOUT_MS = 15_000

export interface CheckoutInvoer {
  aanmeldingId: string
  aanmelding: Aanmelding
  prijsId: string
  succesUrl: string
  terugUrl: string
}

/** De velden van de Checkout Session (PUUR, getest). */
export function checkoutFormulier(c: CheckoutInvoer): URLSearchParams {
  const f = new URLSearchParams()
  f.set('mode', 'subscription')
  f.set('line_items[0][price]', c.prijsId)
  f.set('line_items[0][quantity]', String(c.aanmelding.aantalVestigingen))
  f.set('success_url', c.succesUrl)
  f.set('cancel_url', c.terugUrl)
  f.set('client_reference_id', c.aanmeldingId)
  f.set('customer_email', c.aanmelding.eigenaarEmail)
  f.set('locale', 'nl')
  f.set('billing_address_collection', 'required')
  f.set('tax_id_collection[enabled]', 'true')
  f.set('metadata[aanmelding_id]', c.aanmeldingId)
  f.set('metadata[pakket]', c.aanmelding.pakket)
  f.set('subscription_data[trial_period_days]', String(PROEFDAGEN))
  f.set('subscription_data[metadata][aanmelding_id]', c.aanmeldingId)
  f.set('subscription_data[metadata][slug]', c.aanmelding.slug)
  return f
}

async function stripeVraag(sleutel: string, pad: string, init: { method: 'GET' | 'POST'; body?: URLSearchParams; idempotentie?: string }): Promise<unknown | null> {
  const headers: Record<string, string> = { Authorization: `Bearer ${sleutel}` }
  if (init.body) headers['Content-Type'] = 'application/x-www-form-urlencoded'
  if (init.idempotentie) headers['Idempotency-Key'] = init.idempotentie
  try {
    const res = await fetch(`${STRIPE}${pad}`, { method: init.method, headers, body: init.body?.toString(), signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
    const json: unknown = await res.json().catch(() => null)
    if (!res.ok) {
      // Alleen type en code: nooit de sleutel of klantgegevens in een log.
      const fout = (json as { error?: { type?: unknown; code?: unknown } } | null)?.error
      console.error('[aiyourgym] stripe', init.method, pad.split('/').slice(0, 3).join('/'), res.status, String(fout?.type ?? ''), String(fout?.code ?? ''))
      return null
    }
    return json
  } catch (err) {
    console.error('[aiyourgym] stripe onbereikbaar', err instanceof Error ? err.name : 'onbekend')
    return null
  }
}

/** Een nieuwe Checkout Session: het id en de url, of null. */
export async function maakCheckoutSessie(sleutel: string, c: CheckoutInvoer): Promise<{ id: string; url: string } | null> {
  const json = await stripeVraag(sleutel, '/checkout/sessions', { method: 'POST', body: checkoutFormulier(c), idempotentie: `ayg_checkout_${c.aanmeldingId}` })
  const s = json as { id?: unknown; url?: unknown } | null
  return typeof s?.id === 'string' && typeof s.url === 'string' && s.url.startsWith('https://') ? { id: s.id, url: s.url } : null
}

/** Een bestaande Checkout Session ophalen (ruwe JSON, lees met leesSessie). */
export async function haalCheckoutSessie(sleutel: string, sessieId: string): Promise<unknown | null> {
  return stripeVraag(sleutel, `/checkout/sessions/${encodeURIComponent(sessieId)}`, { method: 'GET' })
}
