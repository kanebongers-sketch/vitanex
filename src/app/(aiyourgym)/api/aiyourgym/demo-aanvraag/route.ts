import type { NextRequest } from 'next/server'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { isRobot } from '@/lib/aiyourgym/aanmelding'
import { DEMO_MAX_BODY_BYTES, leesDemoAanvraag } from '@/lib/aiyourgym/demo-aanvraag'
import { isPrijsAanvraag, leesPrijsAanvraag } from '@/lib/aiyourgym/prijs-aanvraag'
import { bewaarDemoAanvraag, ipHash, teVeelDemoAanvragen } from '@/lib/aiyourgym/demo-aanvraag-opslag'
import { adminOfNull, aygFout, aygJson, poortOpen } from '@/lib/aiyourgym/api'
import { metEngels } from '@/lib/aiyourgym/taal/woorden/website/meldingen'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'

// POST /api/aiyourgym/demo-aanvraag
// Een sportschool vraagt een gratis demo aan. We bewaren de aanvraag in
// ayg_demo_aanvragen (migratie 436); Kane ziet hem op /club/platform en
// neemt zelf contact op. Er gaat geen mail naar buiten.
// Met doel 'prijs' komt hij van /aiyourgym/prijs-op-maat: dezelfde tabel en rem,
// met pakket en aantal leden in de opmerking (src/lib/aiyourgym/prijs-aanvraag.ts).

export const dynamic = 'force-dynamic'

const MISLUKT = 'Versturen lukte niet. Probeer het later opnieuw.'
const TE_VEEL = 'Te veel aanvragen. Probeer het later opnieuw.'

/** Een stap die misging vastleggen in club_fouten (zonder gegevens van de aanvrager). */
async function mislukt(stap: string) {
  await meldFout({ fout: `Demo-aanvraag mislukt: ${stap}`, route: '/api/aiyourgym/demo-aanvraag', methode: 'POST', soort: 'handmatig' })
  return aygFout(MISLUKT, 500)
}

export async function POST(req: NextRequest) {
  if (!(await poortOpen())) return aygFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return aygFout('Dit verzoek komt niet van de website zelf.', 403)
  const ip = ipVan(req)
  if (isRateLimited(`ayg-demo:${ip}`, 5, 10 * 60_000)) return aygFout(TE_VEEL, 429)

  const body = await leesJsonBegrensd(req, DEMO_MAX_BODY_BYTES)
  if (body === 'te-groot') return aygFout('Het verzoek is te groot.', 413)
  // Een robot krijgt hetzelfde antwoord als een mens, maar we bewaren niets.
  if (isRobot(body)) return aygJson({ ok: true })
  const invoer = isPrijsAanvraag(body) ? leesPrijsAanvraag(body) : leesDemoAanvraag(body)
  if (!invoer.ok) return aygJson(metEngels({ fout: 'Controleer de gemarkeerde velden.', fouten: invoer.fouten }), 400)

  const admin = adminOfNull()
  if (!admin) return aygFout(MISLUKT, 503)
  const nu = new Date()
  const hash = ipHash(ip)
  // Harde rem in de database (de rate limit hierboven is per serverinstantie).
  const teVeel = await teVeelDemoAanvragen(admin, invoer.waarde.email, hash, nu)
  if (teVeel === null) return mislukt('rem lezen')
  if (teVeel) return aygFout(TE_VEEL, 429)
  if (!(await bewaarDemoAanvraag(admin, invoer.waarde, hash, nu))) return mislukt('bewaren')
  return aygJson({ ok: true })
}
