// ─── Club, betalen: een Connect-event van Stripe lezen (PUUR) ───────────────
// Systeemgrens: de body van de webhook (na de handtekeningcontrole) wordt een
// klein, getypt bericht. Bij Connect staat het account van de sportschool in
// het veld `account` van het event; zonder dat veld negeren we het event
// (behalve account.updated, waar het account het object zelf is).

export interface BetaaldeSessie {
  sessieId: string
  verkoopId: string | null
  status: string | null
  betaalStatus: string | null
  mode: string | null
  bedragCent: number | null
  valuta: string | null
  paymentIntent: string | null
}

export interface AccountStand {
  accountId: string
  chargesAan: boolean
  uitbetalenAan: boolean
  gegevensCompleet: boolean
}

export type ClubEvent =
  | { soort: 'sessie_betaald'; id: string; account: string; sessie: BetaaldeSessie }
  | { soort: 'sessie_mislukt'; id: string; account: string; sessieId: string; verkoopId: string | null; status: 'mislukt' | 'verlopen' }
  | { soort: 'terugbetaald'; id: string; account: string; paymentIntent: string; terugCent: number }
  | { soort: 'account'; id: string; stand: AccountStand }
  | { soort: 'overig'; id: string; type: string }

type Obj = Record<string, unknown>

function obj(v: unknown): Obj | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Obj) : null
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 && v.length <= 255 ? v : null
}

function idVan(v: unknown): string | null {
  return str(v) ?? str(obj(v)?.id)
}

function geheel(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ACCOUNT = /^acct_[A-Za-z0-9]{6,250}$/

function verkoopIdVan(s: Obj): string | null {
  const ruw = str(obj(s.metadata)?.verkoop_id) ?? str(s.client_reference_id)
  return ruw && UUID.test(ruw) ? ruw.toLowerCase() : null
}

export function leesBetaaldeSessie(v: unknown): BetaaldeSessie | null {
  const s = obj(v)
  const sessieId = str(s?.id)
  if (!s || !sessieId || !sessieId.startsWith('cs_')) return null
  const intent = idVan(s.payment_intent)
  return {
    sessieId,
    verkoopId: verkoopIdVan(s),
    status: str(s.status),
    betaalStatus: str(s.payment_status),
    mode: str(s.mode),
    bedragCent: geheel(s.amount_total),
    valuta: str(s.currency),
    paymentIntent: intent && intent.startsWith('pi_') ? intent : null,
  }
}

/** Is deze sessie echt betaald (en in euro)? */
export function sessieBetaald(s: BetaaldeSessie): boolean {
  return s.status === 'complete' && s.mode === 'payment' && s.betaalStatus === 'paid' && s.valuta === 'eur' && s.bedragCent !== null
}

function leesAccountStand(o: Obj): AccountStand | null {
  const accountId = str(o.id)
  if (!accountId || !ACCOUNT.test(accountId)) return null
  return { accountId, chargesAan: o.charges_enabled === true, uitbetalenAan: o.payouts_enabled === true, gegevensCompleet: o.details_submitted === true }
}

/** Een opgehaald account (GET /v1/accounts/:id) naar de stand. */
export function leesAccount(v: unknown): AccountStand | null {
  const o = obj(v)
  return o ? leesAccountStand(o) : null
}

function sessieEvent(id: string, type: string, account: string, object: Obj): ClubEvent {
  if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
    const sessie = leesBetaaldeSessie(object)
    return sessie ? { soort: 'sessie_betaald', id, account, sessie } : { soort: 'overig', id, type }
  }
  const sessieId = str(object.id)
  if (!sessieId?.startsWith('cs_')) return { soort: 'overig', id, type }
  return { soort: 'sessie_mislukt', id, account, sessieId, verkoopId: verkoopIdVan(object), status: type === 'checkout.session.expired' ? 'verlopen' : 'mislukt' }
}

export function leesClubEvent(body: unknown): ClubEvent | null {
  const e = obj(body)
  const id = str(e?.id)
  const type = str(e?.type)
  const object = obj(obj(e?.data)?.object)
  if (!e || !id || !id.startsWith('evt_') || !type || !object) return null
  if (type === 'account.updated') {
    const stand = leesAccountStand(object)
    return stand ? { soort: 'account', id, stand } : { soort: 'overig', id, type }
  }
  const account = str(e.account)
  if (!account || !ACCOUNT.test(account)) return { soort: 'overig', id, type }
  switch (type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      return sessieEvent(id, type, account, object)
    case 'charge.refunded': {
      const paymentIntent = idVan(object.payment_intent)
      const terugCent = geheel(object.amount_refunded)
      return paymentIntent?.startsWith('pi_') && terugCent !== null && terugCent > 0 ? { soort: 'terugbetaald', id, account, paymentIntent, terugCent } : { soort: 'overig', id, type }
    }
    default:
      return { soort: 'overig', id, type }
  }
}
