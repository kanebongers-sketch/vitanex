// ─── AI Your Gym: het abonnement van een sportschool lezen (SERVER-ONLY) ────
// De aanmelding in ayg_aanmeldingen die bij een sportschool (organisatie_id)
// hoort, en het abonnement bij Stripe. Alleen via de service role.

import type { SupabaseClient } from '@supabase/supabase-js'
import { abonnementUitRij, isAbonnementId, leesStripeAbonnement, type AbonnementRij, type StripeAbonnement } from './abonnement'
import { stripeSleutel } from './config'
import { haalAbonnement } from './stripe-api'

/** Statussen waarin een sportschool echt een abonnement (of testaccount) heeft. */
const MET_ABONNEMENT = ['actief', 'betaling_mislukt', 'gepauzeerd', 'opgezegd', 'test'] as const

export type AbonnementLezen = { soort: 'gevonden'; rij: AbonnementRij } | { soort: 'geen' } | { soort: 'fout' }

/** De nieuwste aanmelding met abonnement van deze sportschool. */
export async function vindAbonnement(admin: SupabaseClient, organisatieId: string): Promise<AbonnementLezen> {
  const { data, error } = await admin
    .from('ayg_aanmeldingen')
    .select('pakket, aantal_vestigingen, status, stripe_customer_id, stripe_subscription_id, aangemaakt_op')
    .eq('organisatie_id', organisatieId)
    .in('status', MET_ABONNEMENT)
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[aiyourgym] abonnement lezen mislukt', error.code ?? '')
    return { soort: 'fout' }
  }
  const rij = abonnementUitRij(data)
  return rij ? { soort: 'gevonden', rij } : { soort: 'geen' }
}

/** Het abonnement bij Stripe, of null (geen sleutel, testaccount, of Stripe niet bereikbaar). */
export async function stripeAbonnementVan(rij: AbonnementRij): Promise<StripeAbonnement | null> {
  const sleutel = stripeSleutel()
  if (!sleutel || rij.status === 'test' || !isAbonnementId(rij.stripeAbonnementId)) return null
  return leesStripeAbonnement(await haalAbonnement(sleutel, rij.stripeAbonnementId))
}
