// POST /api/club/inloggen/[code]/wachtwoord  { wachtwoord }
// Een uitgenodigde eigenaar of clubmanager kiest met de uitnodigingslink een
// keer een sterk wachtwoord en is daarna meteen ingelogd op dit toestel. Daarna
// werkt de link niet meer en logt hij in op /inloggen met e-mailadres en
// wachtwoord (besluit Kane 23-10-2026: geen pincode of controlecode meer).

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isGeremd } from '@/lib/club/kern/rem-db'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { hashWachtwoord, wachtwoordFout } from '@/lib/club/kern/wachtwoord'
import { clubFout, clubJson, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { kiesBeheerderWachtwoord, vindBeheerder } from '@/lib/club/beheerders/beheerder-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'
import { zetClubSessie } from '@/lib/club/kern/sessie-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  if (!CLUB_EIGEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (await isGeremd({ soort: 'club-uitnodiging', max: 10, vensterMs: 15 * 60_000, bijStoring: 'geheugen' }, ipVan(req))) return clubFout('Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  const { code } = await ctx.params
  const admin = clubDatabase()
  const b = await vindBeheerder(admin, code)
  if (!b || b.wachtwoordHash) return clubFout('Niet gevonden.', 404)
  // Op het subdomein van een andere sportschool bestaat deze link niet.
  const { organisatie } = await haalEigenOrganisatie(admin, b.organisatieId)
  if (!organisatie || !(await hostPastBij(organisatie))) return clubFout('Niet gevonden.', 404)
  const body = await leesJsonBegrensd(req, 2048)
  const wachtwoord = typeof body === 'object' && body !== null ? (body as { wachtwoord?: unknown }).wachtwoord : null
  const fout = wachtwoordFout(wachtwoord, { email: b.email, naam: b.naam })
  if (fout) return clubFout(fout, 400)

  const uit = await kiesBeheerderWachtwoord(admin, b, await hashWachtwoord(String(wachtwoord)), new Date())
  if (uit.staat === 'al_gekozen') return clubFout('Met deze link is al een wachtwoord gekozen. Log in met je e-mailadres en wachtwoord.', 409)
  if (uit.staat === 'email_bezet') return clubFout('Met dit e-mailadres is al een account. Vraag de eigenaar om je met een ander adres uit te nodigen.', 409)
  if (uit.staat === 'db') return clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
  return zetClubSessie(clubJson({ staat: 'ok' }), 'beheerder', uit.token, uit.verlooptOp)
}
