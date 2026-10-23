// POST /api/club/inloggen/platform/[code]/wachtwoord  { wachtwoord }
// De platform-eigenaar kiest met de startlink (24 uur geldig) een sterk
// wachtwoord en is daarna meteen ingelogd op dit toestel. Kan maar een keer: de
// link vervalt meteen. Een nieuw wachtwoord kan alleen via een nieuwe startlink
// (SQL-functie club_platform_startlink, migratie 458), nooit via een openbaar
// formulier. Daarna inloggen op /inloggen met e-mailadres en wachtwoord.

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { wachtwoordFout } from '@/lib/club/kern/wachtwoord'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { kiesPlatformWachtwoord, vindPlatformAccount } from '@/lib/club/platform-login/opslag'
import { platformGeremd, zetPlatformCookie } from '@/lib/club/platform-login/route-hulp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (platformGeremd(req, 'wachtwoord')) return clubFout('Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  const { code } = await ctx.params
  const admin = clubDatabase()
  const account = await vindPlatformAccount(admin, code)
  if (!account) return clubFout('Niet gevonden.', 404)
  const body = await leesJsonBegrensd(req, 2048)
  const wachtwoord = typeof body === 'object' && body !== null ? (body as { wachtwoord?: unknown }).wachtwoord : null
  const fout = wachtwoordFout(wachtwoord, { email: account.email, naam: account.naam })
  if (fout) return clubFout(fout, 400)

  const uit = await kiesPlatformWachtwoord(admin, account, String(wachtwoord), new Date())
  if (uit.staat === 'db') return clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
  if (uit.staat === 'niet_mogelijk') return clubFout('Met deze link kan geen wachtwoord meer gekozen worden. Maak een nieuwe startlink.', 409)
  return zetPlatformCookie(clubJson({ staat: 'ok' }), uit.token, uit.verlooptOp)
}
