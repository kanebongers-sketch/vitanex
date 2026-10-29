// ─── AI Your Gym: een Stripe-event lezen (PUUR) ─────────────────────────────
// Systeemgrens: de body van de webhook (na de handtekeningcontrole) wordt hier
// een klein, getypt bericht. Alleen de velden die we gebruiken; de rest negeren
// we. Werkt met oude en nieuwe Stripe-API-versies (bij facturen staat het
// abonnement sinds 2025 onder parent.subscription_details).

export type AygEvent =
  | { soort: 'sessie_afgerond'; id: string; sessie: AfgerondeSessie }
  | { soort: 'abonnement'; id: string; abonnementId: string; stripeStatus: string; prijzen: string[] }
  | { soort: 'abonnement_weg'; id: string; abonnementId: string }
  | { soort: 'betaling_mislukt'; id: string; abonnementId: string }
  | { soort: 'overig'; id: string; type: string }

export interface AfgerondeSessie {
  sessieId: string
  aanmeldingId: string | null
  status: string | null
  /** paid of no_payment_required (proefperiode); unpaid = nog niet binnen. */
  betaalStatus: string | null
  mode: string | null
  klantId: string | null
  abonnementId: string | null
}

type Obj = Record<string, unknown>

function obj(v: unknown): Obj | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Obj) : null
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 && v.length <= 255 ? v : null
}

/** Een id, of het id van een uitgeklapt object. */
function idVan(v: unknown): string | null {
  return str(v) ?? str(obj(v)?.id)
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Een Checkout Session (uit een event of opgehaald voor de welkomstpagina). */
export function leesSessie(v: unknown): AfgerondeSessie | null {
  const s = obj(v)
  const sessieId = str(s?.id)
  if (!s || !sessieId || !sessieId.startsWith('cs_')) return null
  const ruw = str(obj(s.metadata)?.aanmelding_id) ?? str(s.client_reference_id)
  return {
    sessieId,
    aanmeldingId: ruw && UUID.test(ruw) ? ruw.toLowerCase() : null,
    status: str(s.status),
    betaalStatus: str(s.payment_status),
    mode: str(s.mode),
    klantId: idVan(s.customer),
    abonnementId: idVan(s.subscription),
  }
}

/** De prijs-id's van de regels van een abonnement (een regel per los pakket). */
export function prijzenVanAbonnement(a: Obj): string[] {
  const items = obj(a.items)?.data
  if (!Array.isArray(items)) return []
  return items.map((i) => idVan(obj(i)?.price)).filter((p): p is string => p !== null && p.startsWith('price_'))
}

function abonnementVanFactuur(f: Obj): string | null {
  return idVan(f.subscription) ?? idVan(obj(obj(f.parent)?.subscription_details)?.subscription)
}

export function leesEvent(body: unknown): AygEvent | null {
  const e = obj(body)
  const id = str(e?.id)
  const type = str(e?.type)
  const object = obj(obj(e?.data)?.object)
  if (!e || !id || !id.startsWith('evt_') || !type || !object) return null
  switch (type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded': {
      const sessie = leesSessie(object)
      return sessie ? { soort: 'sessie_afgerond', id, sessie } : { soort: 'overig', id, type }
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const abonnementId = str(object.id)
      const stripeStatus = str(object.status)
      return abonnementId && stripeStatus ? { soort: 'abonnement', id, abonnementId, stripeStatus, prijzen: prijzenVanAbonnement(object) } : { soort: 'overig', id, type }
    }
    case 'customer.subscription.deleted': {
      const abonnementId = str(object.id)
      return abonnementId ? { soort: 'abonnement_weg', id, abonnementId } : { soort: 'overig', id, type }
    }
    case 'invoice.payment_failed': {
      const abonnementId = abonnementVanFactuur(object)
      return abonnementId ? { soort: 'betaling_mislukt', id, abonnementId } : { soort: 'overig', id, type }
    }
    default:
      return { soort: 'overig', id, type }
  }
}

/** Is deze sessie echt afgerond (betaald, of proefperiode zonder betaling nu)? */
export function sessieKlaar(s: AfgerondeSessie): boolean {
  return s.status === 'complete' && s.mode === 'subscription' && (s.betaalStatus === 'paid' || s.betaalStatus === 'no_payment_required')
}

export const SESSIE_ID = /^cs_(test|live)_[A-Za-z0-9]{10,250}$/
