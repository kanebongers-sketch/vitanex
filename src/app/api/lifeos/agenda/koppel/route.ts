// GET /api/lifeos/agenda/koppel — start de Google-koppeling.
//
// Lezen én schrijven: we vragen de `calendar.events`-scope aan (zie
// `GOOGLE_BEREIK` in `@/lib/lifeos/agenda/google`), zodat LifeOS je dag kan
// tonen én afspraken kan toevoegen/wijzigen/verwijderen. Wie eerder read-only
// koppelde moet één keer opnieuw koppelen voordat schrijven werkt.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { maakState } from '@/lib/lifeos/auth/oauth-state'
import { autorisatieUrl, googleConfig } from '@/lib/lifeos/agenda/google'
import { KOPPEL_COOKIE, KOPPEL_COOKIE_SECONDEN } from '@/lib/lifeos/agenda/koppeling'

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const config = googleConfig()
  if (!config) {
    // Geen client-id ingesteld = deze koppeling staat uit. Dat is een
    // serverconfiguratie, geen gebruikersfout — en we lekken niet wélke env-var.
    return NextResponse.json(
      { fout: 'De Google-agendakoppeling is op deze server niet ingericht.' },
      { status: 503 },
    )
  }

  const state = maakState('google_calendar')
  const url = autorisatieUrl(config, state)

  // Twee smaken, want een OAuth-flow is een top-level navigatie maar auth loopt
  // via de Authorization-header:
  //   fetch (Accept: application/json) → { url }, de client navigeert zelf
  //   directe hit                      → 302 naar Google
  const wilJson = req.headers.get('accept')?.includes('application/json') ?? false
  const antwoord = wilJson ? NextResponse.json({ url }) : NextResponse.redirect(url)

  // Het vaste eigenaar-id meegeven aan de callback: die krijgt geen
  // Authorization-header van Google en leest 'm daarom uit dit HttpOnly-cookie.
  antwoord.cookies.set(KOPPEL_COOKIE, toegang.userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/lifeos/agenda',
    maxAge: KOPPEL_COOKIE_SECONDEN,
  })

  return antwoord
}
