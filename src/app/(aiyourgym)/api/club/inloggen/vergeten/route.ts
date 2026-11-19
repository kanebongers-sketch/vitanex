// POST /api/club/inloggen/vergeten  { email }
// Wachtwoord vergeten voor een eigenaar, clubmanager of medewerker: met het
// e-mailadres zelf een link aanvragen om een nieuw wachtwoord te kiezen.
// Openbaar (geen sessie), dus streng:
//   - alleen van onze eigen pagina, en hooguit een klein verzoek;
//   - een rem per netwerk (429) en per e-mailadres (stil geen mail meer), beide
//     in de database op een HMAC van de waarde, nooit het IP of adres zelf;
//   - altijd hetzelfde antwoord, of het adres nu bekend is of niet. Het zoeken,
//     de nieuwe code en de mail komen pas na het antwoord (after), zodat ook de
//     tijd niets verraadt.
// Het bestaande wachtwoord en de toestellen blijven werken tot de persoon met
// de link een nieuw wachtwoord kiest: een vreemde die een adres intikt sluit
// niemand buiten en logt niemand uit. Het master account van het platform doet
// niet mee (eigen startlink). Zonder mail-afzender gebeurt er niets, behalve
// een melding voor de platform-eigenaar.

import { after, type NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isGeremd } from '@/lib/club/kern/rem-db'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { getSiteTaal } from '@/lib/aiyourgym/taal/server'
import { vraagNieuweLinkAan } from '@/lib/club/wachtwoord-vergeten/aanvraag'
import { NEUTRAAL, REM_IP, VERGETEN_MAX_BODY, leesVergeten } from '@/lib/club/wachtwoord-vergeten/regels'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (await isGeremd(REM_IP, ipVan(req))) return clubFout('Te veel aanvragen. Probeer het over een kwartier opnieuw.', 429)
  const body = await leesJsonBegrensd(req, VERGETEN_MAX_BODY)
  if (body === 'te-groot') return clubFout('Het verzoek is te groot.', 413)
  const email = leesVergeten(body)
  if (!email) return clubFout('Vul een geldig e-mailadres in.', 400)

  const taal = await getSiteTaal()
  const nu = new Date()
  // De database pas in after openen: ook een storing geeft zo hetzelfde antwoord.
  after(() => vraagNieuweLinkAan(clubDatabase(), email, taal, nu))
  return clubJson(NEUTRAAL)
}
