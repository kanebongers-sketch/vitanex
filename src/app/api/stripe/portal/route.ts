import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { getStripe, BETALEN_NIET_BESCHIKBAAR } from '@/lib/stripe'
import { isRateLimited } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Opent het Stripe-klantportaal (facturen, betaalmethode, opzeggen) voor het
 * bedrijf van de ingelogde HR-manager.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    if (isRateLimited(`stripe-portal:${user.id}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Te veel pogingen in korte tijd. Probeer het over een minuut opnieuw.' },
        { status: 429 },
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
        { error: 'Alleen HR-beheerders kunnen het abonnement beheren.' },
        { status: 403 },
      )
    }

    const stripe = getStripe()
    if (!stripe) {
      return NextResponse.json({ error: BETALEN_NIET_BESCHIKBAAR }, { status: 503 })
    }

    const { data: bedrijf } = await admin
      .from('bedrijven')
      .select('stripe_customer_id')
      .eq('id', profiel.bedrijf_id)
      .single()

    if (!bedrijf?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Er is nog geen online abonnement voor jullie organisatie.' },
        { status: 400 },
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const sessie = await stripe.billingPortal.sessions.create({
      customer: bedrijf.stripe_customer_id,
      return_url: `${appUrl}/hr/abonnement`,
    })

    return NextResponse.json({ url: sessie.url })
  } catch (err) {
    console.error('[stripe portal]', err instanceof Error ? err.message : String(err))
    return NextResponse.json(
      { error: 'Het portaal kon niet worden geopend. Probeer het later opnieuw.' },
      { status: 500 },
    )
  }
}
