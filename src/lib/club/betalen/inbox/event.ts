// ─── Club, lidgeld-inbox: een Connect-event lezen en een kanaal kiezen (PUUR) ─
// Het event zelf vertrouwen we alleen voor het WELK (type, account, object-id).
// De toestand halen we bij het verwerken altijd actueel op bij Stripe.
//
// Kanaal: losse verkoop (bestaande verwerking, verwerk.ts) of de inbox van
// lidgeld. Zonder CLUB_LIDGELD_ACTIEF gaat alles naar de losse verkoop, precies
// zoals voorheen.

import { ACCOUNT_ID, idVan, leesMetadata, obj, str } from './lees'

/** Welk object de inbox moet ophalen om een event te verwerken. */
export type InboxObject = 'payment_intent' | 'charge' | 'refund' | 'dispute' | 'setup_intent' | 'mandate' | 'payment_method' | 'checkout_session' | 'account'

const TYPES = new Map<string, InboxObject>(Object.entries({
  'payment_intent.processing': 'payment_intent',
  'payment_intent.succeeded': 'payment_intent',
  'payment_intent.payment_failed': 'payment_intent',
  'payment_intent.canceled': 'payment_intent',
  'charge.refunded': 'charge',
  'charge.refund.updated': 'refund',
  'refund.updated': 'refund',
  'charge.dispute.created': 'dispute',
  'charge.dispute.updated': 'dispute',
  'charge.dispute.closed': 'dispute',
  'charge.dispute.funds_withdrawn': 'dispute',
  'charge.dispute.funds_reinstated': 'dispute',
  'mandate.updated': 'mandate',
  'setup_intent.succeeded': 'setup_intent',
  'setup_intent.setup_failed': 'setup_intent',
  'checkout.session.completed': 'checkout_session',
  'checkout.session.async_payment_succeeded': 'checkout_session',
  'checkout.session.async_payment_failed': 'checkout_session',
  'checkout.session.expired': 'checkout_session',
  'payment_method.detached': 'payment_method',
  'account.updated': 'account',
  'account.application.deauthorized': 'account',
} satisfies Record<string, InboxObject>))

const VOORVOEGSEL: Readonly<Record<InboxObject, string>> = {
  payment_intent: 'pi_',
  charge: 'ch_',
  refund: 're_',
  dispute: 'dp_',
  setup_intent: 'seti_',
  mandate: 'mandate_',
  payment_method: 'pm_',
  checkout_session: 'cs_',
  account: 'acct_',
}

/** Een event zoals de inbox het bewaart: alleen ids, geen payload, geen persoonsgegevens. */
export interface InboxEvent {
  eventId: string
  type: string
  object: InboxObject
  /** Het account van de sportschool (veld `account` van het event). */
  account: string | null
  /** Het id van het object waar het event over gaat. */
  objectId: string
  livemode: boolean
}

export function isInboxType(type: string): boolean {
  return TYPES.has(type)
}

/** Welk object bij dit type hoort (voor rijen die alleen het type bewaren). */
export function objectVanType(type: string): InboxObject | null {
  return TYPES.get(type) ?? null
}

function objectIdVan(soort: InboxObject, type: string, o: Record<string, unknown>, account: string | null): string | null {
  // Bij deauthorized is het object een application; het account staat op het event.
  if (type === 'account.application.deauthorized') return account
  return idVan(o.id, VOORVOEGSEL[soort])
}

/** Het event lezen (PUUR, getest); null bij een onbekend of ongeldig event. */
export function leesInboxEvent(body: unknown): InboxEvent | null {
  const e = obj(body)
  const eventId = str(e?.id)
  const type = str(e?.type)
  const o = obj(obj(e?.data)?.object)
  if (!e || !eventId || !/^evt_[A-Za-z0-9_]{6,250}$/.test(eventId) || !type || !o || !isInboxType(type)) return null
  const soort = TYPES.get(type)
  if (!soort) return null
  const ruwAccount = str(e.account)
  const account = ruwAccount && ACCOUNT_ID.test(ruwAccount) ? ruwAccount : null
  const objectId = objectIdVan(soort, type, o, account)
  if (!objectId) return null
  return { eventId, type, object: soort, account, objectId, livemode: e.livemode === true }
}

export type Kanaal = 'verkoop' | 'inbox'

/**
 * Welk kanaal een event krijgt (PUUR, getest). Events die al bestonden voor de
 * losse verkoop blijven daar, tenzij het object duidelijk van lidgeld is.
 */
export function kiesKanaal(body: unknown, lidgeldAan: boolean): Kanaal {
  if (!lidgeldAan) return 'verkoop'
  const e = obj(body)
  const type = str(e?.type)
  const o = obj(obj(e?.data)?.object)
  if (!type || !o || !isInboxType(type)) return 'verkoop'
  const m = leesMetadata(o.metadata)
  if (type.startsWith('checkout.session.')) {
    return m.betalingId || m.factuurId || o.mode === 'setup' ? 'inbox' : 'verkoop'
  }
  if (type === 'charge.refunded') {
    // Een verkoop met eigen metadata blijft bij de verkoop; de rest bekijkt de
    // inbox via de PaymentIntent (die stuurt een verkoop zo nodig terug).
    return m.verkoopId ? 'verkoop' : 'inbox'
  }
  return 'inbox'
}
