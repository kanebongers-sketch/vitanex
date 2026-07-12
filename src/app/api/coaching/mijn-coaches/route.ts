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
