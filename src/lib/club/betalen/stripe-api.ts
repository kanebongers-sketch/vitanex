// ─── Club, betalen: de Stripe-API voor Connect (SERVER-ONLY) ────────────────
// Rechtstreeks via fetch op api.stripe.com met CLUB_STRIPE_SECRET_KEY (het
// platformaccount van AI Your Gym), zoals src/lib/aiyourgym/stripe-api.ts.
//
// Keuze: Express-accounts met DIRECT CHARGES. De betaling staat op het account
// van de sportschool (kop Stripe-Account): de sportschool is de verkoper, haar
// naam staat op het afschrift, zij draagt de Stripe-kosten, terugbetalingen en
// geschillen, en het geld komt rechtstreeks op haar rekening. AI Your Gym kan
// later een deel inhouden met application_fee_amount (PLATFORM_FEE_PROCENT, nu
// 0). Bij destination charges zou AI Your Gym de verkoper zijn (en de btw over
// lessen van een ander moeten afdragen); dat past niet bij verkoop namens de
// sportschool. De sleutel gaat nooit naar de browser of in een log.

const STRIPE = 'https://api.stripe.com/v1'
const TIMEOUT_MS = 15_000

interface Vraag {
  method: 'GET' | 'POST'
  body?: URLSearchParams
  idempotentie?: string
  /** Het Connect-account van de sportschool (direct charge). */
  account?: string
}

async function stripeVraag(sleutel: string, pad: string, v: Vraag): Promise<unknown | null> {
  const headers: Record<string, string> = { Authorization: `Bearer ${sleutel}` }
  if (v.body) headers['Content-Type'] = 'application/x-www-form-urlencoded'
  if (v.idempotentie) headers['Idempotency-Key'] = v.idempotentie
  if (v.account) headers['Stripe-Account'] = v.account
  try {
    const res = await fetch(`${STRIPE}${pad}`, { method: v.method, headers, body: v.body?.toString(), signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
    const json: unknown = await res.json().catch(() => null)
    if (!res.ok) {
      // Alleen type en code: nooit de sleutel of gegevens van het lid in een log.
      const fout = (json as { error?: { type?: unknown; code?: unknown } } | null)?.error
      console.error('[club/betalen] stripe', v.method, pad.split('/').slice(0, 2).join('/'), res.status, String(fout?.type ?? ''), String(fout?.code ?? ''))
      return null
    }
    return json
  } catch (err) {
    console.error('[club/betalen] stripe onbereikbaar', err instanceof Error ? err.name : 'onbekend')
    return null
  }
}

function idOf(json: unknown, voorvoegsel: string): string | null {
  const id = (json as { id?: unknown } | null)?.id
  return typeof id === 'string' && id.startsWith(voorvoegsel) ? id : null
}

function urlOf(json: unknown): string | null {
  const url = (json as { url?: unknown } | null)?.url
  return typeof url === 'string' && url.startsWith('https://') ? url : null
}

// ─── Connect-account en onboarding ──────────────────────────────────────────

/** De velden voor een nieuw Express-account (PUUR, getest). */
export function accountFormulier(organisatieId: string, naam: string): URLSearchParams {
  const f = new URLSearchParams()
  f.set('type', 'express')
  f.set('country', 'NL')
  f.set('default_currency', 'eur')
  f.set('capabilities[card_payments][requested]', 'true')
  f.set('capabilities[transfers][requested]', 'true')
  f.set('capabilities[ideal_payments][requested]', 'true')
  f.set('business_profile[name]', naam.slice(0, 80))
  f.set('metadata[organisatie_id]', organisatieId)
  return f
}

export async function maakAccount(sleutel: string, organisatieId: string, naam: string): Promise<string | null> {
  const json = await stripeVraag(sleutel, '/accounts', { method: 'POST', body: accountFormulier(organisatieId, naam), idempotentie: `club_connect_${organisatieId}` })
  return idOf(json, 'acct_')
}

/** Een eenmalige link naar de onboarding van Stripe (verloopt na een paar minuten). */
export async function maakAccountLink(sleutel: string, account: string, terugUrl: string, opnieuwUrl: string): Promise<string | null> {
  const f = new URLSearchParams({ account, refresh_url: opnieuwUrl, return_url: terugUrl, type: 'account_onboarding' })
  return urlOf(await stripeVraag(sleutel, '/account_links', { method: 'POST', body: f }))
}

/** Een inloglink voor het Express-dashboard (uitbetalingen en saldo van de sportschool). */
export async function maakDashboardLink(sleutel: string, account: string): Promise<string | null> {
  return urlOf(await stripeVraag(sleutel, `/accounts/${encodeURIComponent(account)}/login_links`, { method: 'POST', body: new URLSearchParams() }))
}

export async function haalAccount(sleutel: string, account: string): Promise<unknown | null> {
  return stripeVraag(sleutel, `/accounts/${encodeURIComponent(account)}`, { method: 'GET' })
}

// ─── Afrekenen en terugbetalen ──────────────────────────────────────────────

export interface CheckoutInvoer {
  verkoopId: string
  organisatieId: string
  productNaam: string
  bedragCent: number
  platformFeeCent: number
  email: string | null
  succesUrl: string
  terugUrl: string
}

/** De velden van de Checkout Session (PUUR, getest). Het bedrag komt altijd uit onze database. */
export function checkoutFormulier(c: CheckoutInvoer): URLSearchParams {
  const f = new URLSearchParams()
  f.set('mode', 'payment')
  f.set('payment_method_types[0]', 'ideal')
  f.set('payment_method_types[1]', 'card')
  f.set('line_items[0][quantity]', '1')
  f.set('line_items[0][price_data][currency]', 'eur')
  f.set('line_items[0][price_data][unit_amount]', String(c.bedragCent))
  f.set('line_items[0][price_data][product_data][name]', c.productNaam.slice(0, 80))
  f.set('success_url', c.succesUrl)
  f.set('cancel_url', c.terugUrl)
  f.set('client_reference_id', c.verkoopId)
  f.set('locale', 'nl')
  f.set('metadata[verkoop_id]', c.verkoopId)
  f.set('metadata[organisatie_id]', c.organisatieId)
  f.set('payment_intent_data[metadata][verkoop_id]', c.verkoopId)
  f.set('payment_intent_data[description]', c.productNaam.slice(0, 80))
  if (c.platformFeeCent > 0) f.set('payment_intent_data[application_fee_amount]', String(c.platformFeeCent))
  if (c.email) f.set('customer_email', c.email)
  return f
}

export async function maakCheckoutSessie(sleutel: string, account: string, c: CheckoutInvoer): Promise<{ id: string; url: string } | null> {
  const json = await stripeVraag(sleutel, '/checkout/sessions', { method: 'POST', body: checkoutFormulier(c), idempotentie: `club_verkoop_${c.verkoopId}`, account })
  const id = idOf(json, 'cs_')
  const url = urlOf(json)
  return id && url ? { id, url } : null
}

/** Het hele bedrag terugbetalen (op het account van de sportschool). De webhook werkt de verkoop bij. */
export async function maakTerugbetaling(sleutel: string, account: string, paymentIntent: string, verkoopId: string, metFee: boolean): Promise<boolean> {
  const f = new URLSearchParams({ payment_intent: paymentIntent, 'metadata[verkoop_id]': verkoopId })
  if (metFee) f.set('refund_application_fee', 'true')
  const json = await stripeVraag(sleutel, '/refunds', { method: 'POST', body: f, idempotentie: `club_refund_${verkoopId}`, account })
  return idOf(json, 're_') !== null
}
