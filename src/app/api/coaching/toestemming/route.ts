import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { zetToestemming } from '@/lib/coaching/server'

// POST /api/coaching/toestemming { coach_id, waarde }
// De KLANT geeft of trekt inzage-toestemming voor een specifieke coach.
// Authenticatie = de klant zelf; hij kan alleen zijn eigen koppeling wijzigen.

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  let body: { coach_id?: string; waarde?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  if (!body.coach_id || typeof body.waarde !== 'boolean') {
    return NextResponse.json({ error: 'coach_id en waarde (boolean) zijn verplicht.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verifieer dat er echt een koppeling bestaat tussen deze klant en coach
  const { data: koppeling } = await admin
    .from('coach_klanten')
    .select('id')
    .eq('coach_id', body.coach_id)
    .eq('klant_id', user.id)
    .maybeSingle()

  if (!koppeling) {
    return NextResponse.json({ error: 'Geen koppeling met deze coach.' }, { status: 404 })
  }

  const resultaat = await zetToestemming(admin, user.id, body.coach_id, body.waarde)
  if (!resultaat.ok) {
    return NextResponse.json({ error: resultaat.fout }, { status: 500 })
  }
  return NextResponse.json({ succes: true, inzage_toestemming: body.waarde })
}
