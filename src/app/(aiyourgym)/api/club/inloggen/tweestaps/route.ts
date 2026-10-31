// POST /api/club/inloggen/tweestaps  { code }
// De tweede stap van inloggen voor het master account: na een goed wachtwoord
// staat er een wachtcookie (vijf minuten, tweestaps/cookie.ts). Hier de code uit
// de authenticator-app of een herstelcode; pas dan ontstaat de sessie. Rem in
// drie lagen: per IP (gehasht), per account (blokkade die verdubbelt, daarna
// dicht) en per wachtstap (die vervalt na vijf minuten).

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { remSleutel } from '@/lib/club/kern/rem-hash'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubJson } from '@/lib/club/toegang'
import { rondPlatformLoginAf } from '@/lib/club/platform-login/opslag'
import { zetPlatformCookie } from '@/lib/club/platform-login/route-hulp'
import { controleerCode, leesPlatformTweestaps, verwijderWacht, vindWacht } from '@/lib/club/tweestaps/opslag'
import { tweestapsHoofdsleutel } from '@/lib/club/tweestaps/versleutelen'
import { wachtCookie, wisWachtCookie } from '@/lib/club/tweestaps/cookie'
import { codeFout, tweestapsFout } from '@/lib/club/tweestaps/antwoord'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IP_MAX = 10
const IP_VENSTER_MS = 15 * 60_000

export async function POST(req: NextRequest) {
  if (!isZelfdeOorsprong(req.headers)) return clubJson({ fout: 'Dit verzoek komt niet van de app zelf.' }, 403)
  if (isRateLimited(`tweestaps-inloggen:${remSleutel('tweestaps-inloggen', ipVan(req))}`, IP_MAX, IP_VENSTER_MS)) return tweestapsFout('geremd')
  const token = req.cookies.get(wachtCookie())?.value
  const admin = clubDatabase()
  const nu = new Date()
  const accountId = await vindWacht(admin, token, nu)
  if (!token || !accountId) return wisWachtCookie(tweestapsFout('verlopen'))

  const body = await leesJsonBegrensd(req, 1024)
  const code = typeof body === 'object' && body !== null ? (body as { code?: unknown }).code : null
  if (typeof code !== 'string' || !code.trim()) return tweestapsFout('leeg')

  const l = await leesPlatformTweestaps(admin, accountId)
  if (l.staat === 'db') return tweestapsFout('algemeen')
  // Intussen uitgezet (of de tabel is weg): het wachtwoord was al goed, dus gewoon inloggen.
  if (l.staat === 'ok' && l.rij?.aan) {
    const uit = await controleerCode(admin, accountId, l.rij, code, tweestapsHoofdsleutel(), nu)
    if (uit.staat !== 'ok') {
      // Dicht of geblokkeerd: deze wachtstap heeft geen zin meer.
      if (uit.staat === 'gesloten' || uit.staat === 'geblokkeerd') await verwijderWacht(admin, token)
      return codeFout(uit)
    }
    return afronden(admin, accountId, token, nu, uit.herstel ? uit.herstelOver : null)
  }
  return afronden(admin, accountId, token, nu, null)
}

async function afronden(admin: ReturnType<typeof clubDatabase>, accountId: string, token: string, nu: Date, herstelOver: number | null) {
  await verwijderWacht(admin, token)
  const sessie = await rondPlatformLoginAf(admin, accountId, nu)
  if (!sessie) return tweestapsFout('algemeen')
  const res = clubJson({ staat: 'ok', herstelOver })
  return wisWachtCookie(zetPlatformCookie(res, sessie.token, sessie.verlooptOp))
}
