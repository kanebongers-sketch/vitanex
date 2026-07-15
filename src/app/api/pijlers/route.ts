import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { berekenPijlerOverzicht } from '@/lib/pijlers/pijlers-server'

// GET /api/pijlers
// De canonieke 6-pijler-scores + wellbeing + trends voor de ingelogde gebruiker.
// Eén endpoint voor Home, de pijler-detailpagina's en Progress.
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  try {
    const admin = createAdminClient()
    const overzicht = await berekenPijlerOverzicht(admin, user.id)
    return NextResponse.json(overzicht, {
      headers: {
        'Cache-Control': 'private, max-age=120, stale-while-revalidate=60',
        // Zonder Vary cachet de browser puur op URL: logt gebruiker B binnen
        // 120s in op hetzelfde apparaat, dan kreeg die de pijlerdata van
        // gebruiker A uit de HTTP-cache. Gezondheidsdata — dus AVG-lek.
        Vary: 'Authorization',
      },
    })
  } catch (err) {
    console.error('[api/pijlers] berekening mislukt:', err)
    return NextResponse.json({ error: 'Kon je pijlers niet berekenen.' }, { status: 500 })
  }
}
