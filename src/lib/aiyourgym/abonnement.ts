// ─── AI Your Gym: het abonnement van een sportschool tonen (PUUR) ───────────
// Voor /club/beheer/abonnement: wat de eigenaar ziet (pakket, vestigingen,
// status) en de velden voor een sessie in het Stripe Customer Portal. Puur en
// zonder Next of env, zodat het te testen is.

import { slugUitHost } from '@/lib/club/kern/subdomein'
import { oorsprongVan } from './links'
import { OUDE_PAKKETTEN, PROEFDAGEN, leesPakketKeuze, type PakketSleutel } from './pakketten'
import { pakkettenTekst } from './taal/woorden/algemeen/pakketten'
import { isAanmeldStatus, type AanmeldStatus } from './status'
import type { Taal } from './taal/taal'
import { formatDatum, formatEuroCenten } from './taal/formaat'
import { ABONNEMENT_STATUS } from './taal/woorden/club/abonnement-status'

/** Het pad van de abonnementspagina (op een subdomein gaat /club gewoon door). */
export const ABONNEMENT_PAD = '/club/beheer/abonnement'

/** De aanmelding achter een sportschool, met wat de pagina nodig heeft. */
export interface AbonnementRij {
  /** 'los' (losse pakketten) of een oud pakket (start, club, keten). */
  pakket: string
  /** De losse pakketten bij het aanmelden, of null bij een oude aanmelding. */
  pakketten: PakketSleutel[] | null
  aantalVestigingen: number
  status: AanmeldStatus
  stripeKlantId: string | null
  stripeAbonnementId: string | null
  aangemaaktOp: string
}

/** Wat we van een Stripe-abonnement gebruiken (alles optioneel: Stripe kan velden weglaten). */
export interface StripeAbonnement {
  status: string | null
  proefTot: Date | null
  periodeTot: Date | null
  stoptOp: Date | null
  stoptAanEindPeriode: boolean
  aantal: number | null
  /** De prijs-id's van de regels (een per los pakket, of de bundel). */
  prijzen: string[]
  /** Het bedrag per maand van alle regels samen, uit Stripe; null als we het niet zeker weten. */
  bedrag: Bedrag | null
}

/** Een bedrag per maand uit Stripe (nooit uit de code: prijzen staan alleen in Stripe). */
export interface Bedrag {
  centen: number
  /** Alleen euro tonen we; een andere munt = geen bedrag. */
  valuta: 'eur'
  inclBtw: boolean
}

function tekstOfNull(v: unknown): string | null {
  return typeof v === 'string' && v ? v : null
}

function datumUitUnix(v: unknown): Date | null {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? new Date(v * 1000) : null
}

export function abonnementUitRij(rij: unknown): AbonnementRij | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (!isAanmeldStatus(r.status)) return null
  return {
    pakket: typeof r.pakket === 'string' ? r.pakket : '',
    pakketten: leesPakketKeuze(r.pakketten),
    aantalVestigingen: typeof r.aantal_vestigingen === 'number' ? r.aantal_vestigingen : 1,
    status: r.status,
    stripeKlantId: tekstOfNull(r.stripe_customer_id),
    stripeAbonnementId: tekstOfNull(r.stripe_subscription_id),
    aangemaaktOp: typeof r.aangemaakt_op === 'string' ? r.aangemaakt_op : '',
  }
}

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

/**
 * Het bedrag per maand van alle regels samen: prijs per stuk maal aantal. Alleen
 * als elke regel een maandprijs in euro heeft; anders null (liever niets dan fout).
 * Kortingen en btw rekent Stripe op de factuur; hier alleen het tarief.
 */
export function bedragVanRegels(items: readonly unknown[]): Bedrag | null {
  if (items.length === 0) return null
  let centen = 0
  let inclusief = 0
  for (const ruw of items) {
    const item = obj(ruw)
    const prijs = obj(item?.price)
    const terug = obj(prijs?.recurring)
    const stuk = prijs?.unit_amount
    const aantal = item?.quantity
    if (typeof stuk !== 'number' || !Number.isInteger(stuk) || stuk < 0 || typeof aantal !== 'number' || !Number.isInteger(aantal) || aantal < 1) return null
    if (prijs?.currency !== 'eur' || terug?.interval !== 'month' || (terug.interval_count ?? 1) !== 1) return null
    centen += stuk * aantal
    if (prijs.tax_behavior === 'inclusive') inclusief += 1
  }
  return { centen, valuta: 'eur', inclBtw: inclusief === items.length }
}

/**
 * Een Stripe-abonnement (ruwe JSON). Sinds API-versie 2025-03-31 staat het
 * einde van de periode op het abonnementsitem; oudere versies op het abonnement.
 */
export function leesStripeAbonnement(json: unknown): StripeAbonnement | null {
  if (typeof json !== 'object' || json === null) return null
  const s = json as Record<string, unknown>
  if (typeof s.id !== 'string') return null
  const items = (s.items as { data?: unknown } | undefined)?.data
  const eerste = Array.isArray(items) && typeof items[0] === 'object' && items[0] !== null ? (items[0] as Record<string, unknown>) : null
  const aantal = eerste && typeof eerste.quantity === 'number' ? eerste.quantity : null
  const regels = Array.isArray(items) ? items : []
  const prijzen = regels.flatMap((i) => {
    const p = obj(i)?.price
    const id = typeof p === 'string' ? p : obj(p)?.id
    return typeof id === 'string' && id.startsWith('price_') ? [id] : []
  })
  return {
    status: tekstOfNull(s.status),
    proefTot: datumUitUnix(s.trial_end),
    periodeTot: datumUitUnix(s.current_period_end) ?? datumUitUnix(eerste?.current_period_end),
    stoptOp: datumUitUnix(s.cancel_at),
    stoptAanEindPeriode: s.cancel_at_period_end === true,
    aantal,
    prijzen,
    bedrag: bedragVanRegels(regels),
  }
}

export type Toon = 'goed' | 'let' | 'fout' | 'neutraal'

export interface AbonnementWeergave {
  pakket: string
  vestigingen: number
  status: string
  toon: Toon
  /** Een korte zin onder de status, of null. */
  toelichting: string | null
  /** Kan de eigenaar facturen en betaalgegevens openen (Stripe Customer Portal)? */
  portaal: boolean
  /** Het bedrag per maand uit Stripe, opgemaakt in de taal, of null. */
  prijs: string | null
  /** Staat de bundelprijs (alle zes pakketten) op het abonnement? */
  bundel: boolean
}

/** Een datum als "3 november 2026" (Nederlandse tijd). */
export function nlDatum(d: Date): string {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }).format(d)
}

function lopendeStatus(s: StripeAbonnement | null, nu: Date, taal: Taal): { status: string; toon: Toon; toelichting: string | null } {
  const t = ABONNEMENT_STATUS[taal]
  const datum = (d: Date) => formatDatum(d, taal)
  if (s?.stoptAanEindPeriode || (s?.stoptOp && s.stoptOp > nu)) {
    const eind = s.stoptOp ?? s.periodeTot
    return { status: t.opgezegd, toon: 'let', toelichting: eind ? t.loptTot(datum(eind)) : t.loptTotEinde }
  }
  if (s?.status === 'trialing' && s.proefTot && s.proefTot > nu) {
    return { status: t.proefTot(datum(s.proefTot)), toon: 'goed', toelichting: t.daarnaBetaling }
  }
  return { status: t.actief, toon: 'goed', toelichting: s?.periodeTot ? t.volgendeFactuur(datum(s.periodeTot)) : null }
}

const DAG_MS = 24 * 60 * 60 * 1000

/**
 * Afgerond met een testbetaling (geen Stripe-klant en geen abonnement, zie
 * testbetaling.ts): er wordt niets afgeschreven. Dezelfde belofte als op de
 * testbetaalpagina: eerst de proefperiode, daarna spreken we samen af hoe de
 * sportschool betaalt.
 */
function zonderStripe(a: AbonnementRij, nu: Date, taal: Taal): { status: string; toon: Toon; toelichting: string } {
  const t = ABONNEMENT_STATUS[taal]
  const start = Date.parse(a.aangemaaktOp)
  const proefTot = Number.isNaN(start) ? null : new Date(start + PROEFDAGEN * DAG_MS)
  if (proefTot && proefTot > nu) return { status: t.proefTot(formatDatum(proefTot, taal)), toon: 'goed', toelichting: t.zonderStripe }
  return { status: t.actief, toon: 'goed', toelichting: t.zonderStripe }
}

/** Het bedrag als "€ 238,00 per maand, excl. btw". */
export function prijsTekst(b: Bedrag, taal: Taal): string {
  const t = ABONNEMENT_STATUS[taal]
  return t.perMaand(formatEuroCenten(b.centen, taal), b.inclBtw)
}

/**
 * Wat de pagina toont, uit onze aanmelding en (als die er is) het abonnement bij
 * Stripe. bundelPrijs = AIYOURGYM_STRIPE_PRIJS_ALLES (de pagina leest env, dit blijft puur).
 */
export function abonnementWeergave(a: AbonnementRij, s: StripeAbonnement | null, nu: Date, taal: Taal = 'nl', bundelPrijs: string | null = null): AbonnementWeergave {
  const t = ABONNEMENT_STATUS[taal]
  const bundel = bundelPrijs !== null && (s?.prijzen.includes(bundelPrijs) ?? false)
  const namen = a.pakketten ? pakkettenTekst(a.pakketten, taal) : (OUDE_PAKKETTEN[a.pakket] ?? t.onbekendPakket)
  const pakket = bundel ? t.bundel : namen
  const vestigingen = s?.aantal ?? a.aantalVestigingen
  const portaal = a.stripeKlantId !== null && a.status !== 'test'
  const prijs = s?.bedrag && a.status !== 'test' ? prijsTekst(s.bedrag, taal) : null
  const basis = { pakket, vestigingen, portaal, prijs, bundel }
  switch (a.status) {
    case 'actief':
      return { ...basis, ...(a.stripeKlantId === null && a.stripeAbonnementId === null ? zonderStripe(a, nu, taal) : lopendeStatus(s, nu, taal)) }
    case 'betaling_mislukt':
      return { ...basis, status: t.mislukt, toon: 'fout', toelichting: t.mislukUitleg }
    case 'gepauzeerd':
      return { ...basis, status: t.gepauzeerd, toon: 'let', toelichting: t.gepauzeerdUitleg }
    case 'opgezegd':
      return { ...basis, status: t.opgezegd, toon: 'neutraal', toelichting: t.opgezegdUitleg }
    case 'test':
      return { ...basis, portaal: false, status: t.test, toon: 'neutraal', toelichting: t.testUitleg }
    default:
      return { ...basis, status: t.inrichten, toon: 'neutraal', toelichting: t.inrichtenUitleg }
  }
}

/** Stripe-id's: alleen wat op een id lijkt gaat naar Stripe. */
export function isKlantId(v: unknown): v is string {
  return typeof v === 'string' && /^cus_[A-Za-z0-9]{6,250}$/.test(v)
}

export function isAbonnementId(v: unknown): v is string {
  return typeof v === 'string' && /^sub_[A-Za-z0-9]{6,250}$/.test(v)
}

/**
 * De terug-url voor het Customer Portal: deze pagina, op de host waar de
 * eigenaar nu is. Alleen eigen hosts (zoals links.ts) plus het subdomein van
 * een sportschool; een zelfbedachte Host-kop wordt nooit het doel.
 */
export function portaalTerugUrl(host: string | null | undefined): string | null {
  const eigen = oorsprongVan(host)
  if (eigen) return `${eigen}${ABONNEMENT_PAD}`
  const h = (host ?? '').trim().toLowerCase()
  if (!/^[a-z0-9.-]+$/.test(h) || !slugUitHost(h)) return null
  return `${h.endsWith('.localhost') ? 'http' : 'https'}://${h}${ABONNEMENT_PAD}`
}

/** De velden voor POST /v1/billing_portal/sessions. */
export function portaalFormulier(klantId: string, terugUrl: string): URLSearchParams {
  const f = new URLSearchParams()
  f.set('customer', klantId)
  f.set('return_url', terugUrl)
  f.set('locale', 'nl')
  return f
}
