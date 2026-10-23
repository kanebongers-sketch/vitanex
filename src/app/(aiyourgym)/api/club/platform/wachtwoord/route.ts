// POST /api/club/platform/wachtwoord  { wachtwoord }
// De platform-eigenaar die nog met een oude pincode-sessie binnen is, zet hier
// zijn wachtwoord (besluit Kane 23-10-2026: geen pincode meer op aiyourgym.com).
// Alleen voor een account zonder wachtwoord; daarna kan dit niet meer en gaat
// een nieuw wachtwoord alleen via een startlink (SQL).

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { wachtwoordFout } from '@/lib/club/kern/wachtwoord'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { huidigPlatformAccount } from '@/lib/club/platform-login/huidig'
import { zetPlatformWachtwoord } from '@/lib/club/platform-login/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  const account = await huidigPlatformAccount()
  if (!account || account.wachtwoordHash) return clubFout('Niet gevonden.', 404)
  const body = await leesJsonBegrensd(req, 2048)
  const wachtwoord = typeof body === 'object' && body !== null ? (body as { wachtwoord?: unknown }).wachtwoord : null
  const fout = wachtwoordFout(wachtwoord, { email: account.email, naam: account.naam })
  if (fout) return clubFout(fout, 400)
  return (await zetPlatformWachtwoord(clubDatabase(), account, String(wachtwoord))) ? clubJson({ staat: 'ok' }) : clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
}
