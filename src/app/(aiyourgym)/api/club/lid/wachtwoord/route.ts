// POST /api/club/lid/wachtwoord  { email, wachtwoord }
// Voor een lid dat nog met een oude pincode-sessie in de app is: kies in Profiel
// een e-mailadres en sterk wachtwoord, dan werkt inloggen voortaan zo (de
// pincode verdwijnt, deze sessie blijft). Alleen zolang er nog geen wachtwoord
// is; een wachtwoord veranderen gaat met een nieuwe link (wachtwoord vergeten).
// Het lid komt altijd uit de sessie; in de voorvertoning van Kane verandert er niets.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { normaalEmail, wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { kiesWachtwoordInApp } from '@/lib/club/ledenlogin/opslag'
import { EMAIL_BEZET } from '@/lib/club/ledenlogin/inlog-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  if (l.voorvertoning || !l.account) return clubFout('In de voorvertoning kun je geen wachtwoord kiezen.', 403)
  if (l.account.wachtwoordHash) return clubFout('Je hebt al een wachtwoord. Vergeten? Vraag een nieuwe link aan.', 409)
  const gelezen = await leesJsonOfTeGroot(req, 1000)
  if (gelezen instanceof NextResponse) return gelezen
  const body = typeof gelezen.body === 'object' && gelezen.body !== null ? (gelezen.body as Record<string, unknown>) : {}
  const email = normaalEmail(body.email)
  if (!email) return clubFout('Vul een geldig e-mailadres in.', 400)
  const zwak = wachtwoordFout(body.wachtwoord, { email, naam: volledigeNaam(l.lid) })
  if (zwak || typeof body.wachtwoord !== 'string') return clubFout(zwak ?? 'Kies een wachtwoord.', 400)

  const uit = await kiesWachtwoordInApp(l.admin, l.account, email, body.wachtwoord, new Date())
  if (uit.staat === 'ok') return clubJson({ staat: 'ok' })
  if (uit.staat === 'al_gekozen') return clubFout('Je hebt al een wachtwoord. Vergeten? Vraag een nieuwe link aan.', 409)
  if (uit.staat === 'email_bezet') return clubFout(EMAIL_BEZET, 409)
  return clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
}
