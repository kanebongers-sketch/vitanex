import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach, getKlantenVoorCoach, koppelKlantViaEmail } from '@/lib/coaching/server'

// GET  /api/coaching/klanten        → lijst van klanten van de ingelogde coach
// POST /api/coaching/klanten {email} → koppel bestaande gebruiker als klant

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const klanten = await getKlantenVoorCoach(admin, user.id)
  return NextResponse.json({ klanten })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const resultaat = await koppelKlantViaEmail(admin, user.id, body.email ?? '')
  if (!resultaat.ok) {
    return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  }
  return NextResponse.json({ succes: true, klant_id: resultaat.klant_id })
}
