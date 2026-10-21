// POST /api/club/uitloggen
// De platform-eigenaar, een eigenaar, clubmanager of medewerker logt dit toestel uit: de sessie
// verdwijnt uit de database en de cookie wordt gewist. Zegt niets over of er
// een sessie was.

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { beheerderCookie } from '@/lib/club/beheerders/beheerder'
import { logUitBeheerder } from '@/lib/club/beheerders/beheerder-opslag'
import { medewerkerCookie } from '@/lib/club/medewerker-login/medewerker-login'
import { logUitMedewerker } from '@/lib/club/medewerker-login/opslag'
import { platformCookie } from '@/lib/club/platform-login/platform'
import { logUitPlatform } from '@/lib/club/platform-login/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SOORTEN = [
  { naam: platformCookie, wis: logUitPlatform },
  { naam: beheerderCookie, wis: logUitBeheerder },
  { naam: medewerkerCookie, wis: logUitMedewerker },
] as const

export async function POST(req: NextRequest) {
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  let gelukt = true
  for (const soort of SOORTEN) {
    const token = req.cookies.get(soort.naam())?.value
    if (!token) continue
    try {
      gelukt = (await soort.wis(clubDatabase(), token)) && gelukt
    } catch (fout) {
      console.error('[club] uitloggen mislukt', fout instanceof Error ? fout.message : fout)
      gelukt = false
    }
  }
  // De cookies gaan hoe dan ook weg; mislukte het wissen in de database, dan zeggen we dat.
  const res = gelukt ? clubJson({ ok: true }) : clubFout('Uitgelogd op dit toestel, maar de sessie kon niet overal worden gewist.', 502)
  for (const soort of SOORTEN) {
    res.cookies.set(soort.naam(), '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  }
  return res
}
