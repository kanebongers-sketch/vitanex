// POST /api/club/inloggen  { email, wachtwoord }
// Een eigenaar of clubmanager logt op aiyourgym.com in met e-mailadres en
// wachtwoord (besluit Kane 23-10-2026). Goed: een httpOnly-sessiecookie voor dit
// toestel. Een onbekend adres en een fout wachtwoord krijgen hetzelfde antwoord
// (en ongeveer dezelfde rekentijd), zodat niemand kan uitzoeken wie een account heeft.

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { clubFout, clubJson, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { beheerderCookie } from '@/lib/club/beheerders/beheerder'
import { logInMetWachtwoord, vindBeheerderOpEmail } from '@/lib/club/beheerders/beheerder-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { hashWachtwoord, MAX_LENGTE, wachtwoordKlopt } from '@/lib/club/kern/wachtwoord'

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

export async function POST(req: NextRequest) {
  if (!CLUB_EIGEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (isRateLimited(`club-wachtwoord:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return clubFout('Te veel inlogpogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const body = await leesJsonBegrensd(req, 2048)
  if (body === 'te-groot') return clubFout('Het verzoek is te groot.', 413)
  const { email, wachtwoord } = (typeof body === 'object' && body !== null ? body : {}) as { email?: unknown; wachtwoord?: unknown }
  if (typeof wachtwoord !== 'string' || wachtwoord.length === 0 || wachtwoord.length > MAX_LENGTE) return clubFout('Vul je e-mailadres en wachtwoord in.', 400)

  const admin = clubDatabase()
  const b = await vindBeheerderOpEmail(admin, email)
  const { organisatie } = b ? await haalEigenOrganisatie(admin, b.organisatieId) : { organisatie: null }
  if (!b || !organisatie || !(await hostPastBij(organisatie))) {
    schijnControle(wachtwoord)
    return clubFout(FOUT, 401)
  }

  const uit = await logInMetWachtwoord(admin, b, wachtwoord, new Date())
  switch (uit.staat) {
    case 'ok': {
      const res = clubJson({ staat: 'ok' })
      res.cookies.set(beheerderCookie(), uit.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: uit.verlooptOp })
      return res
    }
    case 'fout':
    case 'niet_actief':
      return clubFout(FOUT, 401)
    case 'geblokkeerd':
      return clubFout(`Te vaak een fout wachtwoord. Probeer het na ${TIJD.format(new Date(uit.totOp))} opnieuw.`, 429)
    case 'gesloten':
      return clubFout('Te vaak een fout wachtwoord: dit account is dicht. Neem contact met ons op.', 429)
    default:
      return clubFout('Inloggen mislukt. Probeer het opnieuw.', 502)
  }
}
