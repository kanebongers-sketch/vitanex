// ─── AI Your Gym: het blok Staffel per vestiging laden (SERVER-ONLY) ────────
// Voor /club/beheer/abonnement: de live telling per vestiging (dezelfde regel
// als de cron), de abonnementen per vestiging en het bedrag dat Stripe
// teruggeeft (getrapte prijs, met de staffels opgehaald). Nooit een bedrag uit
// de code. Zonder Stripe (testbetaling) alleen de telling en de staffel.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { dagInNederland } from '@/lib/club/leden/actief-tellen'
import { isAbonnementId, leesStripeAbonnement, prijsTekst, somBedrag, type AbonnementRij, type Bedrag } from './abonnement'
import { stripeSleutel } from './config'
import { actieveLedenPerVestiging, staffelWijzigingen, vestigingAbonnementen } from './staffel-opslag'
import { grensNaam, staffelOverzicht, type StaffelRegel } from './staffel-weergave'
import { haalAbonnementMetStaffels } from './stripe-api'
import type { Taal } from './taal/taal'
import { formatDatum } from './taal/formaat'
import { STAFFEL } from './taal/woorden/club/staffel'

export interface StaffelBlok {
  regels: StaffelRegel[]
  metBedrag: boolean
  metAbonnementen: boolean
  wijzigingen: string[]
  /** Het totaal van alle vestigingsabonnementen samen, of null. */
  totaal: Bedrag | null
}

const WIJZIGINGEN_DAGEN = 90

export async function laadStaffelBlok(admin: SupabaseClient, organisatieId: string, vestigingen: readonly VestigingInfo[], rij: AbonnementRij | null, taal: Taal, nu: Date): Promise<StaffelBlok> {
  const dag = dagInNederland(nu)
  const sinds = dagInNederland(new Date(nu.getTime() - WIJZIGINGEN_DAGEN * 86_400_000))
  const [leden, rijen, log] = await Promise.all([actieveLedenPerVestiging(admin, organisatieId, dag), vestigingAbonnementen(admin, organisatieId), staffelWijzigingen(admin, organisatieId, sinds)])
  const lopend = (rijen ?? []).filter((r) => r.status === 'actief' && isAbonnementId(r.abonnementId))
  const sleutel = stripeSleutel()
  const echtStripe = sleutel !== null && rij !== null && rij.status !== 'test' && isAbonnementId(rij.stripeAbonnementId)

  const bedragen: Record<string, Bedrag | null> = {}
  if (echtStripe && sleutel) {
    const opgehaald = await Promise.all(lopend.map(async (r) => [r.vestiging, leesStripeAbonnement(await haalAbonnementMetStaffels(sleutel, r.abonnementId as string))?.bedrag ?? null] as const))
    for (const [vestiging, bedrag] of opgehaald) bedragen[vestiging] = bedrag
  }
  const tekst = Object.fromEntries(Object.entries(bedragen).map(([v, b]) => [v, b ? prijsTekst(b, taal) : null]))
  const namen = new Map(vestigingen.map((v) => [v.sleutel, v.naam]))
  return {
    regels: staffelOverzicht(vestigingen, leden, new Set(lopend.map((r) => r.vestiging)), tekst, taal),
    metBedrag: echtStripe && lopend.length > 0,
    metAbonnementen: echtStripe && lopend.length > 0,
    wijzigingen: log.slice(0, 5).map((w) => STAFFEL[taal].wijziging(namen.get(w.vestiging) ?? w.vestiging, grensNaam(w.staffelOud, taal), grensNaam(w.staffelNieuw, taal), formatDatum(w.dag, taal))),
    totaal: lopend.length > 0 ? somBedrag(lopend.map((r) => bedragen[r.vestiging] ?? null)) : null,
  }
}
