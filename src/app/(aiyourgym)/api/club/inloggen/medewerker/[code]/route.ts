// POST /api/club/inloggen/medewerker/[code]  { wachtwoord }
// [code] is de eenmalige uitnodigingstoken. De medewerker kiest een sterk
// wachtwoord en is meteen binnen: een httpOnly-sessiecookie voor dit toestel.
// Daarna logt hij in op /inloggen met e-mailadres en wachtwoord. Met de
// schakelaar uit, een onbekende, gebruikte of verlopen uitnodiging, of een
// medewerker uit dienst: een gewone 404.

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { wachtwoordFout } from '@/lib/club/kern/wachtwoord'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { kiesWachtwoord, vindUitnodiging } from '@/lib/club/medewerker-login/opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { zetClubSessie } from '@/lib/club/kern/sessie-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Een wachtwoord kiezen gebeurt een keer; meer dan dit per IP is geen mens. */
const IP_MAX = 10
const IP_VENSTER_MS = 15 * 60_000

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  if (!CLUB_EIGEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (isRateLimited(`club-mw-uitnodiging:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return clubFout('Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const { code } = await ctx.params
  const admin = clubDatabase()
  const nu = new Date()
  const gevonden = await vindUitnodiging(admin, code, nu)
  if (!gevonden) return clubFout('Niet gevonden.', 404)
  // Op het subdomein van een andere sportschool bestaat deze uitnodiging niet.
  const { organisatie } = await haalEigenOrganisatie(admin, gevonden.toegang.userId)
  if (!organisatie || !(await hostPastBij(organisatie))) return clubFout('Niet gevonden.', 404)

  const body = await leesJsonBegrensd(req, 2048)
  if (body === 'te-groot') return clubFout('Het verzoek is te groot.', 413)
  const wachtwoord = typeof body === 'object' && body !== null ? (body as { wachtwoord?: unknown }).wachtwoord : undefined
  const fout = wachtwoordFout(wachtwoord, { email: gevonden.toegang.email, naam: gevonden.medewerker.naam })
  if (fout !== null || typeof wachtwoord !== 'string') return clubFout(fout ?? 'Kies een wachtwoord.', 400)

  const uit = await kiesWachtwoord(admin, gevonden, code, wachtwoord, nu)
  switch (uit.staat) {
    case 'ok': {
      return zetClubSessie(clubJson({ staat: 'ok' }), 'medewerker', uit.token, uit.verlooptOp)
    }
    case 'email_bezet':
      return clubFout('Dit e-mailadres hoort al bij een ander account. Vraag je leidinggevende om je met een ander adres uit te nodigen.', 409)
    case 'verlopen':
      return clubFout('Deze uitnodiging is al gebruikt of verlopen. Vraag je leidinggevende om een nieuwe.', 410)
    default:
      return clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
  }
}
