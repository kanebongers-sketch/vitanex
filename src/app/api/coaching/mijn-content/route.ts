import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { getContentVoorLezer } from '@/lib/coaching/content-server'

// GET /api/coaching/mijn-content → de gepubliceerde content die de ingelogde
// klant mag lezen: persoonlijk aan hem gericht + algemene content van coaches
// met een actieve koppeling. Elke ingelogde gebruiker mag dit voor zichzelf.

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const content = await getContentVoorLezer(admin, user.id)
  return NextResponse.json({ content })
}
