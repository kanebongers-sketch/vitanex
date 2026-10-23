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

// ─── Lidgeld: aanroepen met een uitkomst (inbox en outbox) ──────────────────
// Anders dan stripeVraag hierboven geven deze aanroepen terug WAT er misging,
// want de outbox moet een time-out (opnieuw proberen, zelfde sleutel) kunnen
// onderscheiden van een weigering (niet opnieuw). Elke schrijfactie heeft een
// verplichte idempotentiesleutel en een verplicht Connect-account.

/** Hoe een aanroep afliep. `tijdelijk` = later opnieuw met dezelfde sleutel. */
export type StripeFoutSoort = 'tijdelijk' | 'afgewezen' | 'niet_gevonden' | 'geweigerd' | 'ongeldig'

export type StripeUitkomst<T> =
  | { ok: true; data: T }
  | { ok: false; soort: StripeFoutSoort; status: number; code: string | null }

const TIJDELIJKE_CODES = new Set(['lock_timeout', 'idempotency_key_in_use', 'rate_limit'])

/** Een HTTP-antwoord van Stripe indelen (PUUR, getest). Status 0 = geen antwoord (netwerk of time-out). */
export function deelFoutIn(status: number, code: string | null, type: string | null): StripeFoutSoort {
  if (status === 0 || status === 429 || status === 409 || status >= 500) return 'tijdelijk'
  if (code && TIJDELIJKE_CODES.has(code)) return 'tijdelijk'
  if (status === 402 || type === 'card_error') return 'afgewezen'
  if (status === 404) return 'niet_gevonden'
  if (status === 401 || status === 403) return 'geweigerd'
  return 'ongeldig'
}

interface Aanroep {
  method: 'GET' | 'POST' | 'DELETE'
  body?: URLSearchParams
  idempotentie?: string
  account?: string
}

/** Alleen gewone Stripe-ids in een pad (geen schuine strepen of vraagtekens). */
const STRIPE_ID = /^[a-z]{2,8}_[A-Za-z0-9_]{4,250}$/

function veiligId(id: string): boolean {
  return STRIPE_ID.test(id)
}

async function stripeAanroep(sleutel: string, pad: string, v: Aanroep): Promise<StripeUitkomst<unknown>> {
  const headers: Record<string, string> = { Authorization: `Bearer ${sleutel}` }
  if (v.body) headers['Content-Type'] = 'application/x-www-form-urlencoded'
  if (v.idempotentie) headers['Idempotency-Key'] = v.idempotentie
  if (v.account) headers['Stripe-Account'] = v.account
  const padLog = pad.split('?')[0].split('/').slice(0, 2).join('/')
  try {
    const res = await fetch(`${STRIPE}${pad}`, { method: v.method, headers, body: v.body?.toString(), signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' })
    const json: unknown = await res.json().catch(() => null)
    if (res.ok) return { ok: true, data: json }
    const fout = (json as { error?: { type?: unknown; code?: unknown } } | null)?.error
    const code = typeof fout?.code === 'string' ? fout.code.slice(0, 60) : null
    const type = typeof fout?.type === 'string' ? fout.type.slice(0, 60) : null
    // Alleen methode, pad, status, type en code: nooit de sleutel of gegevens van een lid.
    console.error('[club/betalen] stripe', v.method, padLog, res.status, type ?? '', code ?? '')
    return { ok: false, soort: deelFoutIn(res.status, code, type), status: res.status, code }
  } catch (err) {
    console.error('[club/betalen] stripe onbereikbaar', v.method, padLog, err instanceof Error ? err.name : 'onbekend')
    return { ok: false, soort: 'tijdelijk', status: 0, code: err instanceof Error && err.name === 'TimeoutError' ? 'timeout' : 'netwerk' }
  }
}

function metId<T extends { id: string }>(u: StripeUitkomst<unknown>, voorvoegsel: string, maak: (json: unknown, id: string) => T | null): StripeUitkomst<T> {
  if (!u.ok) return u
  const id = idOf(u.data, voorvoegsel)
  const data = id ? maak(u.data, id) : null
  return data ? { ok: true, data } : { ok: false, soort: 'ongeldig', status: 200, code: 'onverwacht_antwoord' }
}

function statusOf(json: unknown): string | null {
  const s = (json as { status?: unknown } | null)?.status
  return typeof s === 'string' ? s.slice(0, 40) : null
}

/** Vaste metadata op elk object van lidgeld: zo koppelt de inbox het terug. */
export interface LidgeldKoppeling {
  organisatieId: string
  factuurId: string | null
  betalingId: string | null
}

function zetKoppeling(f: URLSearchParams, voorvoegsel: string, k: LidgeldKoppeling): void {
  f.set(`${voorvoegsel}[organisatie_id]`, k.organisatieId)
  if (k.factuurId) f.set(`${voorvoegsel}[factuur_id]`, k.factuurId)
  if (k.betalingId) f.set(`${voorvoegsel}[betaling_id]`, k.betalingId)
}

// Klant

export interface KlantInvoer {
  organisatieId: string
  lidId: string
  /** Naam en e-mail zijn nodig voor een SEPA-machtiging; gaan alleen naar Stripe, nooit in een log. */
  naam: string
  email: string | null
}

export function klantFormulier(k: KlantInvoer): URLSearchParams {
  const f = new URLSearchParams()
  f.set('name', k.naam.slice(0, 120))
  if (k.email) f.set('email', k.email.slice(0, 254))
  f.set('preferred_locales[0]', 'nl')
  f.set('metadata[organisatie_id]', k.organisatieId)
  f.set('metadata[lid_id]', k.lidId)
  return f
}

export async function maakKlant(sleutel: string, account: string, idempotentie: string, k: KlantInvoer): Promise<StripeUitkomst<{ id: string }>> {
  const u = await stripeAanroep(sleutel, '/customers', { method: 'POST', body: klantFormulier(k), idempotentie, account })
  return metId(u, 'cus_', (_json, id) => ({ id }))
}

// Eerste betaling met iDEAL, die meteen een machtiging voor later oplevert

export interface EersteBetalingInvoer extends LidgeldKoppeling {
  betalingId: string
  klant: string
  omschrijving: string
  bedragCent: number
  platformFeeCent: number
  succesUrl: string
  terugUrl: string
}

/** Checkout met iDEAL en setup_future_usage off_session (PUUR, getest). Het bedrag komt uit onze factuur. */
export function eersteBetalingFormulier(c: EersteBetalingInvoer): URLSearchParams {
  const f = new URLSearchParams()
  f.set('mode', 'payment')
  f.set('customer', c.klant)
  f.set('payment_method_types[0]', 'ideal')
  f.set('line_items[0][quantity]', '1')
  f.set('line_items[0][price_data][currency]', 'eur')
  f.set('line_items[0][price_data][unit_amount]', String(c.bedragCent))
  f.set('line_items[0][price_data][product_data][name]', c.omschrijving.slice(0, 80))
  f.set('payment_intent_data[setup_future_usage]', 'off_session')
  f.set('payment_intent_data[description]', c.omschrijving.slice(0, 80))
  zetKoppeling(f, 'payment_intent_data[metadata]', c)
  zetKoppeling(f, 'metadata', c)
  if (c.platformFeeCent > 0) f.set('payment_intent_data[application_fee_amount]', String(c.platformFeeCent))
  f.set('client_reference_id', c.betalingId)
  f.set('success_url', c.succesUrl)
  f.set('cancel_url', c.terugUrl)
  f.set('locale', 'nl')
  return f
}

export async function maakEersteBetaalSessie(sleutel: string, account: string, idempotentie: string, c: EersteBetalingInvoer): Promise<StripeUitkomst<{ id: string; url: string }>> {
  const u = await stripeAanroep(sleutel, '/checkout/sessions', { method: 'POST', body: eersteBetalingFormulier(c), idempotentie, account })
  return metId(u, 'cs_', (json, id) => {
    const url = urlOf(json)
    return url ? { id, url } : null
  })
}

// Machtiging zonder betaling (SEPA-formulier van Stripe, bijvoorbeeld bij een proefperiode)

export interface MachtigingInvoer {
  organisatieId: string
  contractId: string | null
  klant: string
  succesUrl: string
  terugUrl: string
}

export function machtigingFormulier(m: MachtigingInvoer): URLSearchParams {
  const f = new URLSearchParams()
  f.set('mode', 'setup')
  f.set('currency', 'eur')
  f.set('customer', m.klant)
  f.set('payment_method_types[0]', 'sepa_debit')
  f.set('metadata[organisatie_id]', m.organisatieId)
  f.set('setup_intent_data[metadata][organisatie_id]', m.organisatieId)
  if (m.contractId) {
    f.set('metadata[contract_id]', m.contractId)
    f.set('setup_intent_data[metadata][contract_id]', m.contractId)
  }
  f.set('success_url', m.succesUrl)
  f.set('cancel_url', m.terugUrl)
  f.set('locale', 'nl')
  return f
}

export async function maakMachtigingSessie(sleutel: string, account: string, idempotentie: string, m: MachtigingInvoer): Promise<StripeUitkomst<{ id: string; url: string }>> {
  const u = await stripeAanroep(sleutel, '/checkout/sessions', { method: 'POST', body: machtigingFormulier(m), idempotentie, account })
  return metId(u, 'cs_', (json, id) => {
    const url = urlOf(json)
    return url ? { id, url } : null
  })
}

// Incasso: een PaymentIntent met sepa_debit, off_session, met de machtiging

export interface IncassoInvoer extends LidgeldKoppeling {
  betalingId: string
  factuurId: string
  klant: string
  betaalmethode: string
  mandaat: string
  bedragCent: number
  platformFeeCent: number
  omschrijving: string
}

export function incassoFormulier(i: IncassoInvoer): URLSearchParams {
  const f = new URLSearchParams()
  f.set('amount', String(i.bedragCent))
  f.set('currency', 'eur')
  f.set('customer', i.klant)
  f.set('payment_method', i.betaalmethode)
  f.set('payment_method_types[0]', 'sepa_debit')
  f.set('mandate', i.mandaat)
  f.set('confirm', 'true')
  f.set('off_session', 'true')
  f.set('description', i.omschrijving.slice(0, 80))
  zetKoppeling(f, 'metadata', i)
  if (i.platformFeeCent > 0) f.set('application_fee_amount', String(i.platformFeeCent))
  return f
}

export async function maakIncasso(sleutel: string, account: string, idempotentie: string, i: IncassoInvoer): Promise<StripeUitkomst<{ id: string; status: string | null }>> {
  const u = await stripeAanroep(sleutel, '/payment_intents', { method: 'POST', body: incassoFormulier(i), idempotentie, account })
  return metId(u, 'pi_', (json, id) => ({ id, status: statusOf(json) }))
}

// Terugbetalen van lidgeld (deel of geheel)

export interface LidTerugbetalingInvoer {
  organisatieId: string
  betalingId: string
  terugbetalingId: string
  paymentIntent: string
  bedragCent: number
  metFee: boolean
}

export function lidTerugbetalingFormulier(t: LidTerugbetalingInvoer): URLSearchParams {
  const f = new URLSearchParams()
  f.set('payment_intent', t.paymentIntent)
  f.set('amount', String(t.bedragCent))
  f.set('metadata[organisatie_id]', t.organisatieId)
  f.set('metadata[betaling_id]', t.betalingId)
  f.set('metadata[terugbetaling_id]', t.terugbetalingId)
  if (t.metFee) f.set('refund_application_fee', 'true')
  return f
}

export async function maakLidTerugbetaling(sleutel: string, account: string, idempotentie: string, t: LidTerugbetalingInvoer): Promise<StripeUitkomst<{ id: string; status: string | null }>> {
  const u = await stripeAanroep(sleutel, '/refunds', { method: 'POST', body: lidTerugbetalingFormulier(t), idempotentie, account })
  return metId(u, 're_', (json, id) => ({ id, status: statusOf(json) }))
}

// Ophalen (eerst ophalen, dan verwerken)

/** De objecten die de inbox actueel ophaalt, met hun pad bij Stripe. */
export const OPHAAL_PADEN = {
  payment_intent: { pad: '/payment_intents', voorvoegsel: 'pi_', uitbreiden: ['latest_charge.refunds'] },
  charge: { pad: '/charges', voorvoegsel: 'ch_', uitbreiden: [] },
  refund: { pad: '/refunds', voorvoegsel: 're_', uitbreiden: [] },
  dispute: { pad: '/disputes', voorvoegsel: 'dp_', uitbreiden: [] },
  setup_intent: { pad: '/setup_intents', voorvoegsel: 'seti_', uitbreiden: [] },
  mandate: { pad: '/mandates', voorvoegsel: 'mandate_', uitbreiden: [] },
  payment_method: { pad: '/payment_methods', voorvoegsel: 'pm_', uitbreiden: [] },
  checkout_session: { pad: '/checkout/sessions', voorvoegsel: 'cs_', uitbreiden: [] },
} as const

export type OphaalSoort = keyof typeof OPHAAL_PADEN

/** Een object actueel ophalen op het account van de sportschool. */
export async function haalObject(sleutel: string, account: string, soort: OphaalSoort, id: string): Promise<StripeUitkomst<unknown>> {
  const p = OPHAAL_PADEN[soort]
  if (!id.startsWith(p.voorvoegsel) || !veiligId(id)) return { ok: false, soort: 'ongeldig', status: 0, code: 'ongeldig_id' }
  const q = new URLSearchParams()
  for (const u of p.uitbreiden) q.append('expand[]', u)
  const query = q.toString()
  return stripeAanroep(sleutel, `${p.pad}/${encodeURIComponent(id)}${query ? `?${query}` : ''}`, { method: 'GET', account })
}

/** Alle geschillen bij een betaling (een lijst, meestal leeg of een). */
export async function haalGeschillen(sleutel: string, account: string, paymentIntent: string): Promise<StripeUitkomst<unknown>> {
  if (!paymentIntent.startsWith('pi_') || !veiligId(paymentIntent)) return { ok: false, soort: 'ongeldig', status: 0, code: 'ongeldig_id' }
  const q = new URLSearchParams({ payment_intent: paymentIntent, limit: '10' })
  return stripeAanroep(sleutel, `/disputes?${q.toString()}`, { method: 'GET', account })
}

/** Het Connect-account zelf (platformaanroep, zonder Stripe-Account), met uitkomst. */
export async function haalAccountUitkomst(sleutel: string, account: string): Promise<StripeUitkomst<unknown>> {
  if (!account.startsWith('acct_') || !veiligId(account)) return { ok: false, soort: 'ongeldig', status: 0, code: 'ongeldig_id' }
  return stripeAanroep(sleutel, `/accounts/${encodeURIComponent(account)}`, { method: 'GET' })
}

// Opruimen en annuleren (outbox)

/** Een Stripe-klant wissen (AVG). Bestaat hij al niet meer, dan is het ook goed. */
export async function verwijderKlant(sleutel: string, account: string, idempotentie: string, klant: string): Promise<StripeUitkomst<{ id: string }>> {
  if (!klant.startsWith('cus_') || !veiligId(klant)) return { ok: false, soort: 'ongeldig', status: 0, code: 'ongeldig_id' }
  const u = await stripeAanroep(sleutel, `/customers/${encodeURIComponent(klant)}`, { method: 'DELETE', idempotentie, account })
  if (!u.ok && u.soort === 'niet_gevonden') return { ok: true, data: { id: klant } }
  return metId(u, 'cus_', (_json, id) => ({ id }))
}

/** Een betaalmethode loskoppelen (de machtiging stopt daarmee). */
export async function koppelBetaalmethodeLos(sleutel: string, account: string, idempotentie: string, betaalmethode: string): Promise<StripeUitkomst<{ id: string }>> {
  if (!betaalmethode.startsWith('pm_') || !veiligId(betaalmethode)) return { ok: false, soort: 'ongeldig', status: 0, code: 'ongeldig_id' }
  const u = await stripeAanroep(sleutel, `/payment_methods/${encodeURIComponent(betaalmethode)}/detach`, { method: 'POST', body: new URLSearchParams(), idempotentie, account })
  return metId(u, 'pm_', (_json, id) => ({ id }))
}

/** Een PaymentIntent annuleren die nog niet verwerkt is. */
export async function annuleerBetaling(sleutel: string, account: string, idempotentie: string, paymentIntent: string): Promise<StripeUitkomst<{ id: string; status: string | null }>> {
  if (!paymentIntent.startsWith('pi_') || !veiligId(paymentIntent)) return { ok: false, soort: 'ongeldig', status: 0, code: 'ongeldig_id' }
  const u = await stripeAanroep(sleutel, `/payment_intents/${encodeURIComponent(paymentIntent)}/cancel`, { method: 'POST', body: new URLSearchParams(), idempotentie, account })
  return metId(u, 'pi_', (json, id) => ({ id, status: statusOf(json) }))
}
