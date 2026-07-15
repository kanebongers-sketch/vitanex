import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { haalPijlerWeek } from '@/lib/pijlers/week-server'

// GET /api/pijlers/week
// Per dag van de afgelopen 7 dagen: voor welke van de 6 canonieke pijlers is er
// data gelogd. Voedt de pijler-strip in de navigatie (WeekRingen).
//
// Waarom server-side i.p.v. rechtstreeks vanuit de client: dit raakt 8 tabellen.
// Vanuit de browser was dat 8 round-trips per mount, en zou een RLS-blokkade op
// één tabel stilletjes als "niet gelogd" renderen. Hier lezen we met de
// admin-client, exact zoals /api/pijlers, en faalt de hele route zichtbaar.
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  try {
    const admin = createAdminClient()
    const dagen = await haalPijlerWeek(admin, user.id)
    return NextResponse.json({ dagen }, {
      headers: {
        // 60s = de TTL van de client-cache in WeekRingen; samen dekken ze de
        // 2-3 mounts per paginanavigatie af.
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=60',
        // Zonder Vary cachet de browser puur op URL: logt gebruiker B binnen 60s
        // in op hetzelfde apparaat, dan kreeg die de logdata van gebruiker A uit
        // de HTTP-cache. Gezondheidsdata — dus AVG-lek.
        Vary: 'Authorization',
      },
    })
  } catch (err) {
    console.error('[api/pijlers/week] ophalen mislukt:', err)
    return NextResponse.json({ error: 'Kon je week niet ophalen.' }, { status: 500 })
  }
}
