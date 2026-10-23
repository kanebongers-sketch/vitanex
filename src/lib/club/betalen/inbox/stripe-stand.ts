// ─── Club, lidgeld-inbox: opgehaalde Stripe-objecten lezen (PUUR) ───────────
// Alles wat de inbox actueel ophaalt wordt hier een klein, getypt overzicht.
// We lezen alleen ids, bedragen, statussen en onze eigen metadata.

import { geheel, idVan, leesMetadata, obj, str, type Metadata, type Obj } from './lees'
import type { GeschilStand, StripeBetaalStand, Terugbetaling } from './overgang'

/** Een betaling zoals Stripe hem nu ziet, met onze koppeling. */
export interface BetaalBron {
  paymentIntent: string | null
  meta: Metadata
  bedragCent: number | null
  valuta: string | null
  livemode: boolean
  stand: StripeBetaalStand
  /** Totaal terugbetaald volgens de charge (alleen voor een losse verkoop). */
  terugTotaalCent: number
}

function basisUitIntent(o: Obj): StripeBetaalStand['basis'] {
  switch (o.status) {
    case 'succeeded':
      return 'geslaagd'
    case 'processing':
    case 'requires_capture':
      return 'in_behandeling'
    case 'canceled':
      return 'geannuleerd'
    case 'requires_payment_method':
      // Zonder fout is er nog niet betaald; met fout is de poging mislukt.
      return obj(o.last_payment_error) ? 'mislukt' : 'aangeboden'
    default:
      return 'aangeboden'
  }
}

const GESCHIL_GEWICHT: Readonly<Record<GeschilStand, number>> = { geen: 0, gewonnen: 1, open: 2, verloren: 3 }

function geschilVan(status: unknown): GeschilStand {
  switch (status) {
    case 'needs_response':
    case 'under_review':
      return 'open'
    case 'lost':
      return 'verloren'
    case 'won':
      return 'gewonnen'
    default:
      // warning_* is een vraag van de bank zonder dat er geld weg is.
      return 'geen'
  }
}

/** De zwaarste stand uit een lijst geschillen (GET /v1/disputes?payment_intent=...). */
export function leesGeschillen(lijst: unknown): GeschilStand {
  const data = obj(lijst)?.data
  if (!Array.isArray(data)) return 'geen'
  let zwaarst: GeschilStand = 'geen'
  for (const d of data) {
    const g = geschilVan(obj(d)?.status)
    if (GESCHIL_GEWICHT[g] > GESCHIL_GEWICHT[zwaarst]) zwaarst = g
  }
  return zwaarst
}

/** Geslaagde terugbetalingen uit charge.refunds (uitgebreid opgehaald). */
function leesTerugbetalingen(charge: Obj | null): Terugbetaling[] {
  const data = obj(charge?.refunds)?.data
  if (!Array.isArray(data)) return []
  const uit: Terugbetaling[] = []
  for (const r of data) {
    const o = obj(r)
    const id = idVan(o?.id, 're_')
    const cent = geheel(o?.amount)
    if (id && cent !== null && cent > 0 && o?.status === 'succeeded') uit.push({ id, cent })
  }
  return uit
}

/** Een opgehaalde PaymentIntent (met latest_charge.refunds uitgebreid) plus de geschillen. */
export function bronUitIntent(v: unknown, geschil: GeschilStand): BetaalBron | null {
  const o = obj(v)
  const id = idVan(o?.id, 'pi_')
  if (!o || !id) return null
  const charge = obj(o.latest_charge)
  return {
    paymentIntent: id,
    meta: leesMetadata(o.metadata),
    bedragCent: geheel(o.amount),
    valuta: str(o.currency),
    livemode: o.livemode === true,
    stand: { basis: basisUitIntent(o), terugbetalingen: leesTerugbetalingen(charge), geschil },
    terugTotaalCent: geheel(charge?.amount_refunded) ?? 0,
  }
}

/** Een Checkout Session van lidgeld; met een PaymentIntent haalt de inbox die op. */
export interface SessieOverzicht {
  sessieId: string
  modus: 'payment' | 'setup' | 'anders'
  paymentIntent: string | null
  setupIntent: string | null
  bron: BetaalBron
}

export function leesSessie(v: unknown): SessieOverzicht | null {
  const o = obj(v)
  const sessieId = idVan(o?.id, 'cs_')
  if (!o || !sessieId) return null
  const modus = o.mode === 'payment' || o.mode === 'setup' ? o.mode : 'anders'
  const basis: StripeBetaalStand['basis'] = o.status === 'expired' ? 'geannuleerd' : o.status === 'complete' && o.payment_status === 'paid' ? 'geslaagd' : 'aangeboden'
  return {
    sessieId,
    modus,
    paymentIntent: idVan(o.payment_intent, 'pi_'),
    setupIntent: idVan(o.setup_intent, 'seti_'),
    bron: { paymentIntent: null, meta: leesMetadata(o.metadata), bedragCent: geheel(o.amount_total), valuta: str(o.currency), livemode: o.livemode === true, stand: { basis, terugbetalingen: [], geschil: 'geen' }, terugTotaalCent: 0 },
  }
}

/** Het id van de PaymentIntent bij een charge, refund of dispute. */
export function intentVan(v: unknown): string | null {
  return idVan(obj(v)?.payment_intent, 'pi_')
}

export interface SetupOverzicht {
  id: string
  gelukt: boolean
  klant: string | null
  betaalmethode: string | null
  mandaat: string | null
  meta: Metadata
  livemode: boolean
}

export function leesSetupIntent(v: unknown): SetupOverzicht | null {
  const o = obj(v)
  const id = idVan(o?.id, 'seti_')
  if (!o || !id) return null
  return {
    id,
    gelukt: o.status === 'succeeded',
    klant: idVan(o.customer, 'cus_'),
    betaalmethode: idVan(o.payment_method, 'pm_'),
    mandaat: idVan(o.mandate, 'mandate_'),
    meta: leesMetadata(o.metadata),
    livemode: o.livemode === true,
  }
}

export type MandaatStatus = 'actief' | 'in_afwachting' | 'ingetrokken'

export interface MandaatOverzicht {
  id: string
  betaalmethode: string | null
  status: MandaatStatus
}

export function leesMandaat(v: unknown): MandaatOverzicht | null {
  const o = obj(v)
  const id = idVan(o?.id, 'mandate_')
  if (!o || !id) return null
  const status: MandaatStatus = o.status === 'active' ? 'actief' : o.status === 'pending' ? 'in_afwachting' : 'ingetrokken'
  return { id, betaalmethode: idVan(o.payment_method, 'pm_'), status }
}

export interface BetaalmethodeOverzicht {
  id: string
  soort: string
  /** Alleen de laatste vier cijfers; nooit het hele rekeningnummer. */
  laatste4: string | null
  klant: string | null
}

export function leesBetaalmethode(v: unknown): BetaalmethodeOverzicht | null {
  const o = obj(v)
  const id = idVan(o?.id, 'pm_')
  if (!o || !id) return null
  const soort = str(o.type) ?? 'onbekend'
  const ruw = str(obj(o[soort])?.last4)
  return { id, soort: soort.slice(0, 40), laatste4: ruw && /^[0-9]{4}$/.test(ruw) ? ruw : null, klant: idVan(o.customer, 'cus_') }
}
