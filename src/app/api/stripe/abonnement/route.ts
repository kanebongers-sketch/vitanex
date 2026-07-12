import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { normaliseerPlan } from '@/lib/plan/plan'

export const dynamic = 'force-dynamic'

/**
 * Abonnementsoverzicht voor de HR-pagina. De stripe_*-kolommen zijn client-side
 * bewust niet leesbaar (kolom-grants, migratie 035); deze route levert alleen
 * de afgeleide, niet-gevoelige velden — na een server-side rol-check.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const admin = createAdminClient()
    const { data: profiel } = await admin
      .from('profiles')
      .select('rol, bedrijf_id')
      .eq('id', user.id)
      .single()

    if (!profiel?.bedrijf_id || !['hr', 'admin'].includes(profiel.rol ?? '')) {
      return NextResponse.json(
        { error: 'Alleen HR-beheerders kunnen het abonnement bekijken.' },
        { status: 403 },
      )
    }

    const [{ data: bedrijf, error: bedrijfFout }, { count }] = await Promise.all([
      admin
        .from('bedrijven')
        .select('naam, plan, stripe_customer_id, stripe_subscription_status')
        .eq('id', profiel.bedrijf_id)
        .single(),
      admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('bedrijf_id', profiel.bedrijf_id),
    ])

    if (bedrijfFout || !bedrijf) {
      return NextResponse.json({ error: 'Bedrijf niet gevonden.' }, { status: 404 })
    }

    return NextResponse.json({
      naam: bedrijf.naam,
      plan: normaliseerPlan(bedrijf.plan),
      heeftStripeKlant: Boolean(bedrijf.stripe_customer_id),
      abonnementStatus: bedrijf.stripe_subscription_status ?? null,
      aantalGebruikers: Math.max(1, count ?? 1),
    })
  } catch (err) {
    console.error('[stripe abonnement]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Kon het abonnement niet laden.' }, { status: 500 })
  }
}
