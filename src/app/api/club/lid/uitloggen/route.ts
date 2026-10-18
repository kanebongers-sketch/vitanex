// POST /api/club/lid/uitloggen  { overal?: boolean }
// Een lid logt dit toestel uit (de sessie verdwijnt uit de database en de
// cookie wordt gewist), of met overal = true alle toestellen tegelijk. De
// onthouden link blijft, zodat opnieuw inloggen alleen de pincode vraagt;
// bij "overal" verdwijnt ook die.

import { NextResponse, type NextRequest } from 'next/server'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { isZelfdeOorsprong } from '@/lib/lifeos/leads/toegang'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { lidCookie } from '@/lib/club/ledenlogin/regels'
import { lidVanSessie, logUitLid, wisSessies } from '@/lib/club/ledenlogin/opslag'
import { wisLidCookies } from '@/lib/club/ledenlogin/inlog-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!CLUB_LEDEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  const gelezen = await leesJsonOfTeGroot(req, 200)
  if (gelezen instanceof NextResponse) return gelezen
  const overal = typeof gelezen.body === 'object' && gelezen.body !== null && (gelezen.body as Record<string, unknown>).overal === true
  const token = req.cookies.get(lidCookie())?.value
  let gelukt = true
  if (token) {
    try {
      const admin = createLifeosAdminClient()
      const sessie = overal ? await lidVanSessie(admin, token, new Date()) : null
      gelukt = sessie ? await wisSessies(admin, sessie.toegang.userId, sessie.toegang.lidId) : await logUitLid(admin, token)
    } catch (fout) {
      console.error('[club/ledenlogin] uitloggen mislukt', fout instanceof Error ? fout.message : fout)
      gelukt = false
    }
  }
  // De cookie gaat hoe dan ook weg; mislukte het wissen in de database, dan zeggen we dat.
  const res = gelukt ? clubJson({ ok: true }) : clubFout('Uitgelogd op dit toestel, maar niet overal. Probeer het opnieuw.', 502)
  wisLidCookies(res, overal)
  return res
}
