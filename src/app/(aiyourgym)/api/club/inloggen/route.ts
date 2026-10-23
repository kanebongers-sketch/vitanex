// POST /api/club/inloggen  { email, wachtwoord }
// Inloggen op aiyourgym.com met e-mailadres en wachtwoord (besluit Kane
// 23-10-2026). Volgorde: het master account van het platform, dan eigenaren en
// clubmanagers, dan medewerkers (medewerker-login/wachtwoord-login.ts). Goed:
// een httpOnly-sessiecookie voor dit
// toestel. Een onbekend adres en een fout wachtwoord krijgen hetzelfde antwoord
// (en ongeveer dezelfde rekentijd), zodat niemand kan uitzoeken wie een account heeft.

import type { NextRequest, NextResponse } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { clubFout, clubJson, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { logInMetWachtwoord, vindBeheerderOpEmail } from '@/lib/club/beheerders/beheerder-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { zetClubSessie } from '@/lib/club/kern/sessie-cookie'
import { logInPlatform, vindPlatformOpEmail } from '@/lib/club/platform-login/opslag'
import { zetPlatformCookie } from '@/lib/club/platform-login/route-hulp'
import { hashWachtwoord, MAX_LENGTE, wachtwoordKlopt } from '@/lib/club/kern/wachtwoord'
import { logInAlsMedewerker } from '@/lib/club/medewerker-login/wachtwoord-login'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IP_MAX = 20
const IP_VENSTER_MS = 15 * 60_000
const FOUT = 'E-mailadres of wachtwoord klopt niet.'

/** Voor een onbekend adres: evenveel rekenwerk als een echte controle (een keer gemaakt, bij het eerste gebruik). */
let schijn: string | null = null
function schijnControle(wachtwoord: string): void {
  schijn ??= hashWachtwoord('schijn-wachtwoord-voor-gelijke-tijd')
  wachtwoordKlopt(wachtwoord, schijn)
}

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

type Uitkomst =
  | { staat: 'ok'; token: string; verlooptOp: Date }
  | { staat: 'geblokkeerd'; totOp: string }
  | { staat: 'gesloten' }
  | { staat: 'db' }
  | { staat: 'fout' | 'niet_actief' | 'geen_wachtwoord'; over?: number }

/** Een uitkomst als antwoord; bij succes zet `cookie` de juiste sessiecookie. */
function antwoord(uit: Uitkomst, cookie: (res: NextResponse, token: string, tot: Date) => NextResponse): NextResponse {
  switch (uit.staat) {
    case 'ok':
      return cookie(clubJson({ staat: 'ok' }), uit.token, uit.verlooptOp)
    case 'geblokkeerd':
      return clubFout(`Te vaak een fout wachtwoord. Probeer het na ${TIJD.format(new Date(uit.totOp))} opnieuw.`, 429)
    case 'gesloten':
      return clubFout('Te vaak een fout wachtwoord: dit account is dicht. Neem contact met ons op.', 429)
    case 'db':
      return clubFout('Inloggen mislukt. Probeer het opnieuw.', 502)
    default:
      return clubFout(FOUT, 401)
  }
}

function beheerderCookieZetten(res: NextResponse, token: string, tot: Date): NextResponse {
  return zetClubSessie(res, 'beheerder', token, tot)
}

export async function POST(req: NextRequest) {
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (isRateLimited(`club-wachtwoord:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return clubFout('Te veel inlogpogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const body = await leesJsonBegrensd(req, 2048)
  if (body === 'te-groot') return clubFout('Het verzoek is te groot.', 413)
  const { email, wachtwoord } = (typeof body === 'object' && body !== null ? body : {}) as { email?: unknown; wachtwoord?: unknown }
  if (typeof wachtwoord !== 'string' || wachtwoord.length === 0 || wachtwoord.length > MAX_LENGTE) return clubFout('Vul je e-mailadres en wachtwoord in.', 400)

  const admin = clubDatabase()
  const nu = new Date()
  // Eerst het master account van het platform; dat kan altijd, ook met de eigen login van sportscholen uit.
  const platform = await vindPlatformOpEmail(admin, email)
  if (platform) return antwoord(await logInPlatform(admin, platform, wachtwoord, nu), zetPlatformCookie)

  const b = CLUB_EIGEN_LOGIN ? await vindBeheerderOpEmail(admin, email) : null
  if (!b && CLUB_EIGEN_LOGIN) return logInAlsMedewerker(admin, email, wachtwoord)
  const { organisatie } = b ? await haalEigenOrganisatie(admin, b.organisatieId) : { organisatie: null }
  if (!b || !organisatie || !(await hostPastBij(organisatie))) {
    schijnControle(wachtwoord)
    return clubFout(FOUT, 401)
  }
  return antwoord(await logInMetWachtwoord(admin, b, wachtwoord, nu), beheerderCookieZetten)
}
