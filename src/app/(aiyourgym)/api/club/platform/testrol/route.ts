import { type NextRequest } from 'next/server'
import { clubFout, clubJson, echtePlatformToegang } from '@/lib/club/toegang'
import { isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { TESTROL_COOKIE, TESTROL_MAX_SECONDEN, cookieWaarde, magTestRol, testRollenUitBody } from '@/lib/club/rollen/testrol'

// POST /api/club/platform/testrol  { rollen: ['trainer'] }   (leeg: stoppen)
// Het master account test Club als een of meer rollen (rollen/testrol.ts).
// Alleen het master account zelf, ook als hij al als een rol test (daarom
// echtePlatformToegang en niet vereisPlatformEigenaar); iedereen anders een 404.
// Nooit in de eigen omgeving (Fit Factory).

export async function POST(req: NextRequest) {
  const t = await echtePlatformToegang()
  if (!t) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  const body: unknown = await req.json().catch(() => null)
  const rollen = testRollenUitBody(body)
  if (!rollen) return clubFout('Onbekende rol.', 400)
  if (rollen.length > 0 && !magTestRol(t.organisatie, t.beheerderId)) return clubFout('Testen als een rol kan niet in je eigen omgeving.', 400)
  const antwoord = clubJson({ ok: true, rollen })
  const opties = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/' }
  if (rollen.length === 0) antwoord.cookies.set(TESTROL_COOKIE, '', { ...opties, maxAge: 0 })
  else antwoord.cookies.set(TESTROL_COOKIE, cookieWaarde(rollen), { ...opties, maxAge: TESTROL_MAX_SECONDEN })
  return antwoord
}
