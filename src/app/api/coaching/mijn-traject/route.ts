import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { getActiefTrajectVoorKlant } from '@/lib/coaching/traject-server'

// GET /api/coaching/mijn-traject → klant: eigen actieve traject + huidige fase.
// Geen coach-rol vereist; de gebruiker leest uitsluitend zijn eigen traject.

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const traject = await getActiefTrajectVoorKlant(admin, user.id)
  return NextResponse.json({ traject })
}
