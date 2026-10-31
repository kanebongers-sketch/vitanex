// POST /api/club/platform/tweestaps  { actie: 'start' | 'bevestig' | 'uit', code? }
// Tweestapsverificatie van het master account instellen (pagina
// /club/platform/beveiliging). Alleen het account van de eigen sessiecookie,
// nooit een id uit de browser; iedereen anders een 404.
//   start:    nieuw geheim, terug als QR-code en als tekst (nog niet aan).
//   bevestig: met een code uit de app aanzetten; tien herstelcodes gaan een keer
//             terug en andere toestellen worden uitgelogd.
//   uit:      alleen met een geldige code of herstelcode.
// Zonder CLUB_2FA_SLEUTEL kan niets aan (code geen_sleutel).

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { clubJson } from '@/lib/club/toegang'
import { qrDataUrl } from '@/lib/club/checkin/qr-beeld'
import { huidigPlatformAccount } from '@/lib/club/platform-login/huidig'
import { logAndereToestellenUit } from '@/lib/club/platform-login/opslag'
import { platformCookie } from '@/lib/club/platform-login/platform'
import { beginInstellen, bevestigInstellen, zetTweestapsUit } from '@/lib/club/tweestaps/opslag'
import { geheimInGroepjes, otpauthUrl } from '@/lib/club/tweestaps/totp'
import { tweestapsHoofdsleutel } from '@/lib/club/tweestaps/versleutelen'
import { codeFout, tweestapsFout } from '@/lib/club/tweestaps/antwoord'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UITGEVER = 'AI Your Gym'

export async function POST(req: NextRequest) {
  const account = await huidigPlatformAccount()
  if (!account) return clubJson({ fout: 'Niet gevonden.' }, 404)
  if (!isZelfdeOorsprong(req.headers)) return clubJson({ fout: 'Dit verzoek komt niet van de app zelf.' }, 403)
  const body = await leesJsonBegrensd(req, 1024)
  const { actie, code } = (typeof body === 'object' && body !== null ? body : {}) as { actie?: unknown; code?: unknown }
  const sleutel = tweestapsHoofdsleutel()
  if (!sleutel && actie !== 'uit') return tweestapsFout('geen_sleutel')
  const admin = clubDatabase()
  const nu = new Date()

  if (actie === 'start') {
    const uit = await beginInstellen(admin, account.id, sleutel as Buffer)
    if (uit.staat === 'al_aan') return tweestapsFout('al_aan')
    if (uit.staat !== 'ok') return tweestapsFout('algemeen')
    const qr = await qrDataUrl(otpauthUrl(uit.geheim, account.email, UITGEVER))
    return clubJson({ staat: 'ok', qr, geheim: geheimInGroepjes(uit.geheim) })
  }

  if (typeof code !== 'string' || !code.trim()) return tweestapsFout('leeg')

  if (actie === 'bevestig') {
    const uit = await bevestigInstellen(admin, account.id, code, sleutel, nu)
    if (uit.staat !== 'ok') return codeFout(uit)
    const token = req.cookies.get(platformCookie())?.value
    if (token) await logAndereToestellenUit(admin, account.id, token)
    return clubJson({ staat: 'ok', herstelcodes: uit.herstelcodes })
  }

  if (actie === 'uit') {
    const uit = await zetTweestapsUit(admin, account.id, code, sleutel, nu)
    return uit.staat === 'ok' ? clubJson({ staat: 'ok' }) : codeFout(uit)
  }

  return clubJson({ fout: 'Onbekende actie.' }, 400)
}
