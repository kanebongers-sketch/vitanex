import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { getMijnTaken } from '@/lib/coaching/taken-server'

// GET /api/coaching/mijn-taken → de eigen actieve taken van de ingelogde klant,
// mét voortgang (vandaag afgevinkt + aantal deze week). Elke gebruiker mag dit.

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const taken = await getMijnTaken(admin, user.id)
  return NextResponse.json({ taken })
}
