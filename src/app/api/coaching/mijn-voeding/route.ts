import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { getMijnRichtlijn } from '@/lib/coaching/voeding-server'

// GET /api/coaching/mijn-voeding → de eigen actieve voedingsrichtlijn van de
// ingelogde klant (of null). Elke ingelogde gebruiker mag dit voor zichzelf.

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const richtlijn = await getMijnRichtlijn(admin, user.id)
  return NextResponse.json({ richtlijn })
}
