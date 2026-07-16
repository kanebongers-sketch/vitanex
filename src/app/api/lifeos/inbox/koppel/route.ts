// GET /api/lifeos/inbox/koppel — start de Gmail-koppeling.
//
// Alleen lezen: we vragen `gmail.readonly` en niets meer. LifeOS verstuurt nooit
// een mail, markeert niets als gelezen en archiveert niets — dus vraagt het ook
// geen toestemming om dat te mogen. Zie `src/lib/lifeos/inbox/gmail.ts`.
//
// Achter de founder-gate: alleen de founder mag een mailbox koppelen. Het cookie
// dat we hier zetten draagt het vaste LifeOS-eigenaar-id naar de callback, die
// géén Authorization-header krijgt (Google redirect is een top-level GET).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { maakState } from '@/lib/lifeos/auth/oauth-state'
import { autorisatieUrl, gmailConfig } from '@/lib/lifeos/inbox/gmail'
import { KOPPEL_COOKIE, KOPPEL_COOKIE_PAD, KOPPEL_COOKIE_SECONDEN } from '@/lib/lifeos/inbox/koppeling'

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const config = gmailConfig()
  if (!config) {
    // Geen client-id ingesteld = deze koppeling staat uit. Dat is een
    // serverconfiguratie, geen gebruikersfout — en we lekken niet wélke env-var.
    return NextResponse.json(
      { fout: 'De Gmail-koppeling is op deze server niet ingericht.' },
      { status: 503 },
    )
  }

  // De state is aan de dienst gebonden: een geldige state voor de agenda is
  // straks geen toestemming om hier een mailbox te koppelen. Zie de callback.
  const state = maakState('gmail')
  const url = autorisatieUrl(config, state)

  // Twee smaken, want een OAuth-flow is een top-level navigatie maar auth loopt
  // via de Authorization-header:
  //   fetch (Accept: application/json) → { url }, de client navigeert zelf
  //   directe hit                      → 302 naar Google
  const wilJson = req.headers.get('accept')?.includes('application/json') ?? false
  const antwoord = wilJson ? NextResponse.json({ url }) : NextResponse.redirect(url)

  antwoord.cookies.set(KOPPEL_COOKIE, toegang.userId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: KOPPEL_COOKIE_PAD,
    maxAge: KOPPEL_COOKIE_SECONDEN,
  })

  return antwoord
}
