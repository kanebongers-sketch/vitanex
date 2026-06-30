import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { detectNudge } from '@/lib/coach/nudges'

export const dynamic = 'force-dynamic'

/**
 * Proactieve coach-nudge voor de ingelogde gebruiker.
 * Wordt opgehaald bij het openen van de app (pull-on-open) en levert
 * hooguit één relevante nudge op basis van echte, eigen data.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  try {
    const nudge = await detectNudge(user.id)
    return NextResponse.json(
      { nudge },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (err) {
    console.error('[api/coach/nudge]', err)
    // Faal zacht: een ontbrekende nudge mag de app nooit breken.
    return NextResponse.json(
      { nudge: null },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
