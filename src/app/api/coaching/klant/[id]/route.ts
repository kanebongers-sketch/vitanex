import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach, getKlantDetail } from '@/lib/coaching/server'

// GET /api/coaching/klant/[id] → detail + welzijnssamenvatting van één klant.
// Welzijn wordt alleen teruggegeven als de klant inzage-toestemming gaf.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const { id: klantId } = await params
  const detail = await getKlantDetail(admin, user.id, klantId)

  // Geen koppeling = deze coach mag deze klant niet zien
  if (!detail) return NextResponse.json({ error: 'Klant niet gevonden.' }, { status: 404 })

  return NextResponse.json({ klant: detail })
}
