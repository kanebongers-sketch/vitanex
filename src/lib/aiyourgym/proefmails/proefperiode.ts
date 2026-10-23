// ─── AI Your Gym: wanneer loopt de proefperiode af (PUUR) ───────────────────
// Met Stripe: het einde dat Stripe noemt (trial_end), alleen zolang het
// abonnement op "trialing" staat. Zonder Stripe (afgerond met een testbetaling):
// de aanmelding plus PROEFDAGEN, net als op de abonnementspagina. Anders null:
// dan tonen en mailen we niets over een proefperiode.

import type { AanmeldStatus } from '../status'
import { nlDatum, type StripeAbonnement } from '../abonnement'
import { PROEFDAGEN } from '../pakketten'

export const DAG_MS = 24 * 60 * 60 * 1000

export interface ProefBron {
  status: AanmeldStatus
  aangemaaktOp: string
  /** Hoort er een Stripe-klant of -abonnement bij? */
  metStripe: boolean
}

/** Het einde van de proefperiode, of null als die er niet (meer) is of niet bekend is. */
export function proefTotVan(bron: ProefBron, stripe: StripeAbonnement | null): Date | null {
  if (bron.status !== 'actief') return null
  if (bron.metStripe) return stripe?.status === 'trialing' && stripe.proefTot ? stripe.proefTot : null
  const start = Date.parse(bron.aangemaaktOp)
  return Number.isNaN(start) ? null : new Date(start + PROEFDAGEN * DAG_MS)
}

export interface ProefTeller {
  kop: string
  dagen: string
}

/** "Proefperiode tot 6 november" met "nog 9 dagen", of null als hij voorbij is. Rustig: alleen de datum. */
export function proefTeller(tot: Date | null, nu: Date): ProefTeller | null {
  if (!tot || tot.getTime() <= nu.getTime()) return null
  const over = Math.ceil((tot.getTime() - nu.getTime()) / DAG_MS)
  return { kop: `Proefperiode tot ${nlDatum(tot)}`, dagen: over <= 1 ? 'nog een dag' : `nog ${over} dagen` }
}
