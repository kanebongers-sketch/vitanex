import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'
import { normaliseerPlan } from '@/lib/plan'

export const dynamic = 'force-dynamic'

/**
 * Stripe-webhook: houdt bedrijven.plan en de abonnementsstatus in sync.
 *
 * Beveiliging:
 * - De handtekening in `stripe-signature` is de toegangscontrole (constructEvent
 *   op de raw body); zonder geldige handtekening wordt de payload geweigerd.
 * - Replay-bescherming: elk event-id wordt geregistreerd in stripe_webhook_events;
 *   een tweede bezorging van hetzelfde event wordt overgeslagen.
 * - Out-of-order-bescherming: subscription-updates matchen op het subscription-id
 *   dat bij het bedrijf hoort, zodat een verlaat event van een oud abonnement een
 *   nieuwer abonnement niet kan overschrijven.
 */
export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe is niet geconfigureerd.' }, { status: 503 })
  }

  const handtekening = req.headers.get('stripe-signature')
  if (!handtekening) {
    return NextResponse.json({ error: 'Handtekening ontbreekt.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const payload = await req.text()
    event = stripe.webhooks.constructEvent(payload, handtekening, webhookSecret)
  } catch (err) {
    console.error('[stripe webhook] ongeldige handtekening:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Ongeldige handtekening.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Replay-bescherming: claim het event-id vóór verwerking. Bij een duplicaat
  // (unieke-sleutel-conflict) is het event al verwerkt → bevestig zonder actie.
  const { error: claimFout } = await admin
    .from('stripe_webhook_events')
    .insert({ event_id: event.id, type: event.type })
  if (claimFout) {
    if (claimFout.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error(`[stripe webhook] event ${event.id} registreren mislukt:`, claimFout.message)
    return NextResponse.json({ error: 'Verwerking mislukt.' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sessie = event.data.object as Stripe.Checkout.Session
        const bedrijfId = sessie.metadata?.bedrijf_id
        if (!bedrijfId) break

        const subscriptionId =
          typeof sessie.subscription === 'string' ? sessie.subscription : sessie.subscription?.id
        const customerId =
          typeof sessie.customer === 'string' ? sessie.customer : sessie.customer?.id

        const { error } = await admin
          .from('bedrijven')
          .update({
            plan: normaliseerPlan(sessie.metadata?.plan),
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId ?? null,
            stripe_subscription_status: 'active',
          })
          .eq('id', bedrijfId)
        if (error) throw new Error(`bedrijf ${bedrijfId} bijwerken mislukt: ${error.message}`)
        break
      }

      case 'customer.subscription.updated': {
        const abonnement = event.data.object as Stripe.Subscription
        const bedrijfId = abonnement.metadata?.bedrijf_id
        if (!bedrijfId) break

        // Alleen bijwerken als dit hét actieve abonnement van het bedrijf is;
        // een verlaat event van een oud/ander abonnement wordt genegeerd.
        const { error } = await admin
          .from('bedrijven')
          .update({ stripe_subscription_status: abonnement.status })
          .eq('id', bedrijfId)
          .eq('stripe_subscription_id', abonnement.id)
        if (error) throw new Error(`status bijwerken mislukt: ${error.message}`)
        break
      }

      case 'customer.subscription.deleted': {
        const abonnement = event.data.object as Stripe.Subscription
        const bedrijfId = abonnement.metadata?.bedrijf_id
        if (!bedrijfId) break

        // Abonnement beëindigd → terug naar het instapplan, maar alleen als het
        // beëindigde abonnement nog het gekoppelde abonnement is (een upgrade
        // die het oude abonnement verving mag niet worden teruggedraaid).
        const { error } = await admin
          .from('bedrijven')
          .update({
            plan: 'starter',
            stripe_subscription_id: null,
            stripe_subscription_status: 'canceled',
          })
          .eq('id', bedrijfId)
          .eq('stripe_subscription_id', abonnement.id)
        if (error) throw new Error(`downgrade mislukt: ${error.message}`)
        break
      }

      default:
        // Overige events zijn niet relevant; bevestig ontvangst zodat Stripe niet blijft retryen.
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(`[stripe webhook] ${event.type} ${event.id}:`, err instanceof Error ? err.message : String(err))
    // Claim vrijgeven zodat Stripe's retry het event opnieuw mag verwerken.
    await admin.from('stripe_webhook_events').delete().eq('event_id', event.id)
    return NextResponse.json({ error: 'Verwerking mislukt.' }, { status: 500 })
  }
}
