// POST /api/club/inloggen/platform/[code]  { pin }
// De platform-eigenaar (master account van Kane) logt in met de pincode van
// zijn persoonlijke link. Goed: een httpOnly-sessiecookie voor dit toestel.
// Een onbekende of ingetrokken link: een gewone 404.

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { isZelfdeOorsprong, leesPin } from '@/lib/club/kern/verzoek'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { logInPlatform, vindPlatformAccount } from '@/lib/club/platform-login/opslag'
import { platformGeremd, zetPlatformCookie } from '@/lib/club/platform-login/route-hulp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (platformGeremd(req, 'inloggen')) return clubFout('Te veel inlogpogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  const { code } = await ctx.params
  const admin = clubDatabase()
  const account = await vindPlatformAccount(admin, code)
  if (!account) return clubFout('Niet gevonden.', 404)
  const pin = leesPin(await req.json().catch(() => null))
  if (!pin) return clubFout('Vul je pincode van 6 cijfers in.', 400)

  const uit = await logInPlatform(admin, account, pin, new Date())
  switch (uit.staat) {
    case 'ok':
      return zetPlatformCookie(clubJson({ staat: 'ok' }), uit.token, uit.verlooptOp)
    case 'fout':
      return clubFout(`Pincode klopt niet. Nog ${uit.over} poging${uit.over === 1 ? '' : 'en'}.`, 401)
    case 'geblokkeerd':
      return clubFout(`Te vaak een foute pincode. Probeer het na ${TIJD.format(new Date(uit.totOp))} opnieuw.`, 429)
    case 'gesloten':
      return clubFout('Te vaak een foute pincode: deze link is dicht. Maak een nieuwe startlink.', 429)
    case 'geen_pin':
      return clubFout('Kies eerst een pincode met je startlink.', 409)
    default:
      return clubFout('Inloggen mislukt. Probeer het opnieuw.', 502)
  }
}
