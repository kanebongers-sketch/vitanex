import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { getCoachesVoorKlant } from '@/lib/coaching/server'

// GET /api/coaching/mijn-coaches → de coach(es) van de ingelogde klant.
// Gebruikt door de /mijn-coach pagina om inzage te beheren.

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const coaches = await getCoachesVoorKlant(admin, user.id)
  return NextResponse.json({ coaches })
}

// POST /api/coaching/mijn-coaches { coach_id } → de KLANT beëindigt de koppeling
// en trekt daarmee ook zijn inzage-toestemming in.
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  let body: { coach_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }
  if (!body.coach_id) {
    return NextResponse.json({ error: 'coach_id is verplicht.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('coach_klanten')
    .update({ status: 'beeindigd', inzage_toestemming: false })
    .eq('klant_id', user.id)
    .eq('coach_id', body.coach_id)

  if (error) return NextResponse.json({ error: 'Beëindigen mislukt.' }, { status: 500 })
  return NextResponse.json({ succes: true })
}
