import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { getStripe, stripePriceIdVoorPlan, BETALEN_NIET_BESCHIKBAAR } from '@/lib/stripe'
import { normaliseerPlan, PLAN_INFO } from '@/lib/plan'
import { isRateLimited } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Start een Stripe Checkout-sessie (abonnement, per gebruiker) voor het
 * bedrijf van de ingelogde HR-manager. Body: { plan: 'starter' | 'groei' }.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    if (isRateLimited(`stripe-checkout:${user.id}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Te veel pogingen in korte tijd. Probeer het over een minuut opnieuw.' },
        { status: 429 },
      )
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
    }
    const gewenstPlan = normaliseerPlan((body as Record<string, unknown> | null)?.plan)
    if (!PLAN_INFO[gewenstPlan].zelfService) {
      return NextResponse.json(
        { error: 'Dit plan sluit je niet online af. Neem contact op via info@mentaforce.nl.' },
        { status: 400 },
      )
    }

    const admin = createAdminClient()
    const { data: profiel } = await admin
      .from('profiles')
      .select('rol, bedrijf_id')
      .eq('id', user.id)
      .single()

    if (!profiel?.bedrijf_id || !['hr', 'admin'].includes(profiel.rol ?? '')) {
      return NextResponse.json(
        { error: 'Alleen HR-beheerders kunnen het abonnement wijzigen.' },
        { status: 403 },
      )
    }

    const stripe = getStripe()
    const priceId = stripePriceIdVoorPlan(gewenstPlan)
    if (!stripe || !priceId) {
      return NextResponse.json({ error: BETALEN_NIET_BESCHIKBAAR }, { status: 503 })
    }

    const { data: bedrijf, error: bedrijfFout } = await admin
      .from('bedrijven')
      .select('id, naam, plan, stripe_customer_id')
      .eq('id', profiel.bedrijf_id)
      .single()

    if (bedrijfFout || !bedrijf) {
      return NextResponse.json({ error: 'Bedrijf niet gevonden.' }, { status: 404 })
    }
    if (normaliseerPlan(bedrijf.plan) === gewenstPlan) {
      return NextResponse.json({ error: 'Dit is al jullie huidige plan.' }, { status: 400 })
    }

    // Per-seat: het aantal profielen van het bedrijf bepaalt de quantity.
    const { count } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('bedrijf_id', bedrijf.id)
    const aantalGebruikers = Math.max(1, count ?? 1)

    // Hergebruik de Stripe-customer van het bedrijf, of maak er één aan.
    let customerId = bedrijf.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: bedrijf.naam,
        email: user.email ?? undefined,
        metadata: { bedrijf_id: bedrijf.id },
      })

      // Atomaire claim: alleen schrijven als er nog geen customer-id staat.
      // Verliest deze request de race (parallel tabblad/collega), dan gebruiken
      // we de winnende customer en ruimen we de zojuist aangemaakte op.
      const { data: claim, error: opslaanFout } = await admin
        .from('bedrijven')
        .update({ stripe_customer_id: customer.id })
        .eq('id', bedrijf.id)
        .is('stripe_customer_id', null)
        .select('stripe_customer_id')

      if (opslaanFout) {
        console.error('[stripe checkout] customer-id opslaan mislukt:', opslaanFout.message)
        return NextResponse.json(
          { error: 'Het abonnement kon niet worden gestart. Probeer het later opnieuw.' },
          { status: 500 },
        )
      }

      if (claim && claim.length > 0) {
        customerId = customer.id
      } else {
        const { data: winnaar } = await admin
          .from('bedrijven')
          .select('stripe_customer_id')
          .eq('id', bedrijf.id)
          .single()
        customerId = winnaar?.stripe_customer_id ?? customer.id
        if (customerId !== customer.id) {
          try {
            await stripe.customers.del(customer.id)
          } catch {
            // Best effort: een verweesde, lege customer factureert niets.
          }
        }
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const sessie = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: aantalGebruikers }],
        success_url: `${appUrl}/hr/abonnement?status=succes`,
        cancel_url: `${appUrl}/hr/abonnement?status=geannuleerd`,
        metadata: { bedrijf_id: bedrijf.id, plan: gewenstPlan },
        subscription_data: { metadata: { bedrijf_id: bedrijf.id, plan: gewenstPlan } },
      },
      // Dubbelklik/netwerk-retry binnen dezelfde minuut hergebruikt de sessie
      // in plaats van een tweede aan te maken.
      { idempotencyKey: `checkout_${bedrijf.id}_${gewenstPlan}_${Math.floor(Date.now() / 60_000)}` },
    )

    if (!sessie.url) {
      return NextResponse.json(
        { error: 'Het abonnement kon niet worden gestart. Probeer het later opnieuw.' },
        { status: 500 },
      )
    }
    return NextResponse.json({ url: sessie.url })
  } catch (err) {
    console.error('[stripe checkout]', err instanceof Error ? err.message : String(err))
    return NextResponse.json(
      { error: 'Het abonnement kon niet worden gestart. Probeer het later opnieuw.' },
      { status: 500 },
    )
  }
}
