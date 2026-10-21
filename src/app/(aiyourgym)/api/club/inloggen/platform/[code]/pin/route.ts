// POST /api/club/inloggen/platform/[code]/pin  { pin }
// De platform-eigenaar kiest met de startlink (24 uur geldig) een pincode van 6
// cijfers en is daarna meteen ingelogd op dit toestel. Kan maar een keer: een
// nieuwe pincode kan alleen via een nieuwe startlink (SQL-functie
// club_platform_startlink, migratie 450). Nooit via een openbaar formulier.

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { isZelfdeOorsprong, leesPin } from '@/lib/club/kern/verzoek'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { isZwakkePin } from '@/lib/club/ledenlogin/pin-keuze'
import { kiesPlatformPin, vindPlatformAccount } from '@/lib/club/platform-login/opslag'
import { platformGeremd, zetPlatformCookie } from '@/lib/club/platform-login/route-hulp'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (platformGeremd(req, 'pin')) return clubFout('Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  const { code } = await ctx.params
  const admin = clubDatabase()
  const account = await vindPlatformAccount(admin, code)
  if (!account) return clubFout('Niet gevonden.', 404)
  const pin = leesPin(await req.json().catch(() => null))
  if (!pin) return clubFout('Kies een pincode van precies 6 cijfers.', 400)
  // Dit account ziet alle sportscholen: zeker geen pincode die iedereen als eerste probeert.
  if (isZwakkePin(pin)) return clubFout('Deze pincode is te makkelijk te raden. Kies een andere.', 400)

  const uit = await kiesPlatformPin(admin, account, pin, new Date())
  if (uit.staat === 'db') return clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
  if (uit.staat === 'niet_mogelijk') return clubFout('Met deze link kan geen pincode meer gekozen worden. Maak een nieuwe startlink.', 409)
  return zetPlatformCookie(clubJson({ staat: 'ok' }), uit.token, uit.verlooptOp)
}
