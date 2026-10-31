// ─── AI Your Gym: een Stripe-abonnement per vestiging (PUUR) ────────────────
// Besluit Kane (31-10-2026): staffelprijzen per vestiging op aantal actieve
// leden. Stripe staat dezelfde prijs niet twee keer in een abonnement toe, dus
// elke vestiging heeft een eigen abonnement bij dezelfde Stripe-klant, met
// dezelfde pakketten. De hoeveelheid van elke regel is het aantal actieve leden.
//   - De eerste vestiging: het abonnement uit de checkout bij het aanmelden
//     (bron 'hoofd'), metadata soort=vestiging.
//   - Een vestiging die later in Club bijkomt: een nieuw abonnement via de API
//     (bron 'vestiging'), met de betaalmethode van het hoofdabonnement en
//     dezelfde factuurdatum (billing_cycle_anchor, naar rato tot die datum).
// Nooit dubbel: eerst een rij claimen in ayg_vestiging_abonnementen (uniek per
// vestiging), dan bij Stripe zoeken op metadata, pas dan maken met een vaste
// Idempotency-Key.

import type { StripeRegel } from './config'
import type { AbonnementRegel } from './pakket-wijziging'

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

/** Wat we van een Stripe-abonnement nodig hebben om een vestiging erbij te maken of te tellen. */
export interface AbonnementBasis {
  id: string
  status: string | null
  klantId: string | null
  betaalmethode: string | null
  /** Einde van de huidige periode (unix-seconden), of null. */
  periodeTot: number | null
  metadata: Readonly<Record<string, string>>
}

/** Een Stripe-abonnement (ruwe JSON), of null. Periode-einde op het abonnement of (nieuwe API) op het item. */
export function leesAbonnementBasis(json: unknown): AbonnementBasis | null {
  const s = obj(json)
  const id = str(s?.id)
  if (!s || !id || !id.startsWith('sub_')) return null
  const eerste = obj((obj(s.items)?.data as unknown[] | undefined)?.[0])
  const eind = typeof s.current_period_end === 'number' ? s.current_period_end : typeof eerste?.current_period_end === 'number' ? eerste.current_period_end : null
  const meta = obj(s.metadata) ?? {}
  return {
    id,
    status: str(s.status),
    klantId: idVan(s.customer),
    betaalmethode: idVan(s.default_payment_method),
    periodeTot: eind,
    metadata: Object.fromEntries(Object.entries(meta).filter((e): e is [string, string] => typeof e[1] === 'string')),
  }
}

/** Een abonnement dat (nog) telt: niet opgezegd en niet verlopen. */
export function abonnementLoopt(status: string | null): boolean {
  return status !== null && !['canceled', 'incomplete_expired'].includes(status)
}

/**
 * Bestaat er bij deze klant al een lopend abonnement voor deze vestiging (een
 * eerdere poging die wel bij Stripe lukte)? Dan nemen we dat over, nooit een tweede.
 * Invoer: de ruwe lijst van GET /v1/subscriptions?customer=...&status=all.
 */
export function bestaandVoorVestiging(lijst: unknown, organisatieId: string, vestiging: string): string | null {
  const data = obj(lijst)?.data
  if (!Array.isArray(data)) return null
  const hit = data.map(leesAbonnementBasis).find((a) => a !== null && abonnementLoopt(a.status) && a.metadata.organisatie_id === organisatieId && a.metadata.vestiging === vestiging)
  return hit?.id ?? null
}

/** De sleutel tegen dubbel maken: een per sportschool en vestiging. */
export function maakSleutel(organisatieId: string, vestiging: string): string {
  return `ayg_vest_${organisatieId}_${vestiging}`.slice(0, 255)
}

export interface NieuwVestigingAbonnement {
  klantId: string
  regels: readonly StripeRegel[]
  hoeveelheid: number
  organisatieId: string
  vestiging: string
  slug: string
  /** De betaalmethode van het hoofdabonnement, of null (dan de standaard van de klant). */
  betaalmethode: string | null
  /** Zelfde factuurdatum als het hoofdabonnement (unix-seconden), alleen als die in de toekomst ligt. */
  anker: number | null
}

/** De velden voor POST /v1/subscriptions (PUUR, getest). */
export function nieuwAbonnementFormulier(n: NieuwVestigingAbonnement, nuSec: number): URLSearchParams {
  const f = new URLSearchParams()
  f.set('customer', n.klantId)
  const hoeveelheid = String(Math.max(1, Math.trunc(n.hoeveelheid)))
  n.regels.forEach((r, i) => {
    f.set(`items[${i}][price]`, r.prijsId)
    f.set(`items[${i}][quantity]`, hoeveelheid)
  })
  if (n.betaalmethode) f.set('default_payment_method', n.betaalmethode)
  if (n.anker !== null && n.anker > nuSec + 60) {
    f.set('billing_cycle_anchor', String(n.anker))
    f.set('proration_behavior', 'create_prorations')
  }
  f.set('metadata[soort]', 'vestiging')
  f.set('metadata[organisatie_id]', n.organisatieId)
  f.set('metadata[vestiging]', n.vestiging)
  f.set('metadata[slug]', n.slug)
  return f
}

/** De metadata die het hoofdabonnement krijgt zodra de sportschool en de vestiging bekend zijn. */
export function hoofdMetadataFormulier(organisatieId: string, vestiging: string): URLSearchParams {
  const f = new URLSearchParams()
  f.set('metadata[soort]', 'vestiging')
  f.set('metadata[organisatie_id]', organisatieId)
  f.set('metadata[vestiging]', vestiging)
  return f
}

/**
 * Een abonnement uit het nieuwe model (een abonnement per vestiging)? Alleen
 * dan maken we automatisch abonnementen voor extra vestigingen. Een ouder
 * abonnement (hoeveelheid = aantal vestigingen) zetten we nooit vanzelf om:
 * dat zou dubbel rekenen. Kane zet het met de hand om.
 */
export function isVestigingModel(a: AbonnementBasis): boolean {
  return a.metadata.soort === 'vestiging'
}

/**
 * De hoeveelheid van alle eigen regels in een verzoek naar n zetten, zonder
 * verrekening: de nieuwe staffel geldt vanaf de volgende factuur.
 */
export function hoeveelheidFormulier(regels: readonly AbonnementRegel[], eigen: readonly string[], n: number): URLSearchParams {
  const f = new URLSearchParams()
  regels
    .filter((r) => eigen.includes(r.prijsId))
    .forEach((r, i) => {
      f.set(`items[${i}][id]`, r.id)
      f.set(`items[${i}][quantity]`, String(n))
    })
  f.set('proration_behavior', 'none')
  return f
}

/** De sleutel voor een hoeveelheid: zelfde abonnement, dag en aantal = een keer. */
export function hoeveelheidSleutel(abonnementId: string, dag: string, n: number): string {
  return `ayg_staffel_${abonnementId}_${dag}_${n}`
}

/** Een vestiging zoals de koppeling hem nodig heeft (uit club_vestigingen, op volgorde). */
export interface VestigingKort {
  sleutel: string
  standaard: boolean
}

/** Een bestaande rij in ayg_vestiging_abonnementen, kort. */
export interface RijKort {
  id: string
  vestiging: string
  abonnementId: string | null
  status: 'aanmaken' | 'actief' | 'opgezegd'
}

export interface KoppelPlan {
  /** De vestiging waar het hoofdabonnement bij hoort, als het nog niet gekoppeld is. */
  hoofdNaar: string | null
  /** Vestigingen zonder abonnement (of met een vastgelopen claim), in volgorde. */
  maken: string[]
}

/**
 * Wat er gekoppeld en gemaakt moet worden (PUUR, getest). Het hoofdabonnement
 * hoort bij de standaardvestiging (of de eerste); staat het al in een rij, dan
 * niet opnieuw. Elke andere vestiging zonder lopend abonnement krijgt er een,
 * maar pas als het hoofdabonnement gekoppeld is (anders kreeg de eerste
 * vestiging er twee). Een opgezegde rij maken we nooit vanzelf opnieuw.
 */
export function koppelPlan(vestigingen: readonly VestigingKort[], rijen: readonly RijKort[], hoofdAbonnementId: string): KoppelPlan {
  const hoofdRij = rijen.find((r) => r.abonnementId === hoofdAbonnementId)
  const metRij = new Set(rijen.filter((r) => r.status !== 'aanmaken' || r.abonnementId !== null).map((r) => r.vestiging))
  const eerste = vestigingen.find((v) => v.standaard && !metRij.has(v.sleutel)) ?? vestigingen.find((v) => !metRij.has(v.sleutel))
  const hoofdNaar = hoofdRij ? null : (eerste?.sleutel ?? null)
  if (!hoofdRij && !hoofdNaar) return { hoofdNaar: null, maken: [] }
  const maken = vestigingen.map((v) => v.sleutel).filter((s) => s !== hoofdNaar && !metRij.has(s))
  return { hoofdNaar, maken }
}
