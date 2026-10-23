// ─── AI Your Gym: het abonnement van een sportschool tonen (PUUR) ───────────
// Voor /club/beheer/abonnement: wat de eigenaar ziet (pakket, vestigingen,
// status) en de velden voor een sessie in het Stripe Customer Portal. Puur en
// zonder Next of env, zodat het te testen is.

import { slugUitHost } from '@/lib/club/kern/subdomein'
import { oorsprongVan } from './links'
import { PROEFDAGEN, vindPakket } from './pakketten'
import { isAanmeldStatus, type AanmeldStatus } from './status'

/** Het pad van de abonnementspagina (op een subdomein gaat /club gewoon door). */
export const ABONNEMENT_PAD = '/club/beheer/abonnement'

/** De aanmelding achter een sportschool, met wat de pagina nodig heeft. */
export interface AbonnementRij {
  pakket: string
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
    aantalVestigingen: typeof r.aantal_vestigingen === 'number' ? r.aantal_vestigingen : 1,
    status: r.status,
    stripeKlantId: tekstOfNull(r.stripe_customer_id),
    stripeAbonnementId: tekstOfNull(r.stripe_subscription_id),
    aangemaaktOp: typeof r.aangemaakt_op === 'string' ? r.aangemaakt_op : '',
  }
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
  return {
    status: tekstOfNull(s.status),
    proefTot: datumUitUnix(s.trial_end),
    periodeTot: datumUitUnix(s.current_period_end) ?? datumUitUnix(eerste?.current_period_end),
    stoptOp: datumUitUnix(s.cancel_at),
    stoptAanEindPeriode: s.cancel_at_period_end === true,
    aantal,
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
}

/** Een datum als "3 november 2026" (Nederlandse tijd). */
export function nlDatum(d: Date): string {
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }).format(d)
}

function lopendeStatus(s: StripeAbonnement | null, nu: Date): { status: string; toon: Toon; toelichting: string | null } {
  if (s?.stoptAanEindPeriode || (s?.stoptOp && s.stoptOp > nu)) {
    const eind = s.stoptOp ?? s.periodeTot
    return { status: 'Opgezegd', toon: 'let', toelichting: eind ? `Loopt nog tot ${nlDatum(eind)}.` : 'Loopt tot het einde van de periode.' }
  }
  if (s?.status === 'trialing' && s.proefTot && s.proefTot > nu) {
    return { status: `Proefperiode tot ${nlDatum(s.proefTot)}`, toon: 'goed', toelichting: 'Daarna start de eerste betaling vanzelf.' }
  }
  return { status: 'Actief', toon: 'goed', toelichting: s?.periodeTot ? `Volgende factuur rond ${nlDatum(s.periodeTot)}.` : null }
}

const DAG_MS = 24 * 60 * 60 * 1000

/**
 * Afgerond met een testbetaling (geen Stripe-klant en geen abonnement, zie
 * testbetaling.ts): er wordt niets afgeschreven. Dezelfde belofte als op de
 * testbetaalpagina: eerst de proefperiode, daarna spreken we samen af hoe de
 * sportschool betaalt.
 */
function zonderStripe(a: AbonnementRij, nu: Date): { status: string; toon: Toon; toelichting: string } {
  const start = Date.parse(a.aangemaaktOp)
  const proefTot = Number.isNaN(start) ? null : new Date(start + PROEFDAGEN * DAG_MS)
  const uitleg = 'Online betalen is nog niet gekoppeld, dus er wordt niets afgeschreven. We spreken samen af hoe je verder betaalt.'
  if (proefTot && proefTot > nu) return { status: `Proefperiode tot ${nlDatum(proefTot)}`, toon: 'goed', toelichting: uitleg }
  return { status: 'Actief', toon: 'goed', toelichting: uitleg }
}

/** Wat de pagina toont, uit onze aanmelding en (als die er is) het abonnement bij Stripe. */
export function abonnementWeergave(a: AbonnementRij, s: StripeAbonnement | null, nu: Date): AbonnementWeergave {
  const pakket = vindPakket(a.pakket)?.naam ?? 'Onbekend pakket'
  const vestigingen = s?.aantal ?? a.aantalVestigingen
  const portaal = a.stripeKlantId !== null && a.status !== 'test'
  const basis = { pakket, vestigingen, portaal }
  switch (a.status) {
    case 'actief':
      return { ...basis, ...(a.stripeKlantId === null && a.stripeAbonnementId === null ? zonderStripe(a, nu) : lopendeStatus(s, nu)) }
    case 'betaling_mislukt':
      return { ...basis, status: 'Betaling mislukt', toon: 'fout', toelichting: 'Een factuur is niet betaald. Stripe probeert het opnieuw; controleer je betaalgegevens.' }
    case 'gepauzeerd':
      return { ...basis, status: 'Gepauzeerd', toon: 'let', toelichting: 'Het abonnement staat stil. Er worden geen facturen gemaakt.' }
    case 'opgezegd':
      return { ...basis, status: 'Opgezegd', toon: 'neutraal', toelichting: 'Het abonnement is beeindigd. Je oude facturen blijven op te vragen.' }
    case 'test':
      return { ...basis, portaal: false, status: 'Testaccount', toon: 'neutraal', toelichting: 'Dit is een testaccount: er is geen abonnement en er komen geen facturen.' }
    default:
      return { ...basis, status: 'Wordt ingericht', toon: 'neutraal', toelichting: 'Je aanmelding is nog niet afgerond.' }
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
