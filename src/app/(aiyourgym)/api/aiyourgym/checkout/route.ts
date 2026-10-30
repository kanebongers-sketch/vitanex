import type { NextRequest } from 'next/server'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { siteActief } from '@/lib/aiyourgym/schakelaar'
import { MAX_BODY_BYTES, isRobot, leesAanmelding } from '@/lib/aiyourgym/aanmelding'
import { NIET_OPEN, stripeRegels, stripeSleutel } from '@/lib/aiyourgym/config'
import { checkoutAdressen, oorsprongVan, testbetaalAdres } from '@/lib/aiyourgym/links'
import { nieuweTestSessie } from '@/lib/aiyourgym/testbetaling-opslag'
import { testbetalenVoor } from '@/lib/aiyourgym/testbetaling'
import { hashWachtwoord } from '@/lib/club/kern/wachtwoord'
import { vindBeheerderOpEmail } from '@/lib/club/beheerders/beheerder-opslag'
import { vindPlatformOpEmail } from '@/lib/club/platform-login/opslag'
import { koppelSessie, maakAanmelding, slugVrij, teVeelRecent } from '@/lib/aiyourgym/opslag'
import { maakCheckoutSessie } from '@/lib/aiyourgym/stripe-api'
import { adminOfNull, aygFout, aygJson, poortOpen, publiekeHost } from '@/lib/aiyourgym/api'
import { metEngels } from '@/lib/aiyourgym/taal/woorden/website/meldingen'
import { meldFout } from '@/lib/club/betrouwbaarheid/melden'

// POST /api/aiyourgym/checkout
// Een sportschool meldt zich aan met een of meer losse pakketten (besluit Kane
// 29-10-2026). Zijn ze allemaal online af te sluiten (Stripe-sleutel en per
// pakket een prijs in env), dan volgt Stripe Checkout met een regel per pakket
// en een proefperiode. Alle zes met een bundelprijs (AIYOURGYM_STRIPE_PRIJS_ALLES,
// besluit Kane 30-10-2026): een regel met de bundel (stripeRegels).
// Zonder Stripe volgt een nagespeelde betaling op onze eigen site
// (src/lib/aiyourgym/testbetaling.ts, besluit Kane 23-10-2026). Staat ook die
// uit, dan bewaren we de aanmelding als 'aanvraag' voor Kane en zeggen we
// eerlijk dat aanmelden nog niet open is. Er gaat geen mail naar buiten.

export const dynamic = 'force-dynamic'

const AANVRAAG = `${NIET_OPEN} We hebben je gegevens ontvangen en nemen zelf contact met je op.`
const MISLUKT = 'Aanmelden lukte niet. Probeer het later opnieuw.'

/** Een stap die misging vastleggen in club_fouten (zonder gegevens van de aanmelder). */
async function mislukt(stap: string, melding: string, status: number) {
  await meldFout({ fout: `Aanmelden mislukt: ${stap}`, route: '/api/aiyourgym/checkout', methode: 'POST', soort: 'handmatig' })
  return aygFout(melding, status)
}

export async function POST(req: NextRequest) {
  if (!(await poortOpen())) return aygFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return aygFout('Dit verzoek komt niet van de website zelf.', 403)
  if (isRateLimited(`ayg-checkout:${ipVan(req)}`, 5, 10 * 60_000)) return aygFout('Te veel pogingen. Probeer het over een paar minuten opnieuw.', 429)

  const body = await leesJsonBegrensd(req, MAX_BODY_BYTES)
  if (body === 'te-groot') return aygFout('Het verzoek is te groot.', 413)
  // Een robot krijgt hetzelfde antwoord als een aanvraag, maar we bewaren niets.
  if (isRobot(body)) return aygJson(metEngels({ staat: 'aanvraag', melding: AANVRAAG }))
  const invoer = leesAanmelding(body)
  if (!invoer.ok) return aygJson(metEngels({ fout: 'Controleer de gemarkeerde velden.', fouten: invoer.fouten }), 400)
  const a = invoer.waarde

  const admin = adminOfNull()
  if (!admin) return aygFout(NIET_OPEN, 503)
  const nu = new Date()
  // Harde rem in de database (de rate limit hierboven is per serverinstantie en per IP-kop).
  const teVeel = await teVeelRecent(admin, a.eigenaarEmail, nu)
  if (teVeel === null) return mislukt('rem lezen', MISLUKT, 500)
  if (teVeel) return aygFout('Te veel pogingen. Probeer het later opnieuw.', 429)
  const vrij = await slugVrij(admin, a.slug, nu)
  if (vrij === null) return mislukt('adres controleren', MISLUKT, 500)
  if (!vrij) return aygJson(metEngels({ fout: 'Controleer de gemarkeerde velden.', fouten: { slug: 'Dit adres is al bezet. Kies een ander.' } }), 409)
  // Inloggen gaat op e-mailadres: een adres met een account kan geen tweede eigenaar worden.
  if ((await vindBeheerderOpEmail(admin, a.eigenaarEmail)) || (await vindPlatformOpEmail(admin, a.eigenaarEmail))) {
    return aygJson(metEngels({ fout: 'Controleer de gemarkeerde velden.', fouten: { eigenaarEmail: 'Met dit e-mailadres is al een account. Log in, of gebruik een ander adres.' } }), 409)
  }

  const sleutel = stripeSleutel()
  const regels = stripeRegels(a.pakketten)
  const host = publiekeHost(req)
  const oorsprong = oorsprongVan(host)
  if (testbetalenVoor(a.pakketten)) {
    if (!oorsprong) return aygFout(MISLUKT, 400)
    const id = await maakAanmelding(admin, a, 'wacht_op_betaling', nu, hashWachtwoord(a.wachtwoord))
    const sessieId = nieuweTestSessie()
    if (!id || !(await koppelSessie(admin, id, sessieId))) return mislukt('testbetaling starten', MISLUKT, 500)
    return aygJson({ staat: 'testbetaling', url: testbetaalAdres(oorsprong, host, siteActief(), sessieId) })
  }
  if (!sleutel || !regels) {
    const id = await maakAanmelding(admin, a, 'aanvraag', nu)
    return id ? aygJson(metEngels({ staat: 'aanvraag', melding: AANVRAAG })) : mislukt('aanvraag bewaren', MISLUKT, 500)
  }

  if (!oorsprong) return aygFout(MISLUKT, 400)
  const id = await maakAanmelding(admin, a, 'wacht_op_betaling', nu, hashWachtwoord(a.wachtwoord))
  if (!id) return mislukt('aanmelding bewaren', MISLUKT, 500)
  const adressen = checkoutAdressen(oorsprong, host, siteActief())
  const sessie = await maakCheckoutSessie(sleutel, { aanmeldingId: id, aanmelding: a, regels, succesUrl: adressen.succes, terugUrl: adressen.terug })
  if (!sessie || !(await koppelSessie(admin, id, sessie.id))) return mislukt(sessie ? 'sessie koppelen' : 'Stripe-sessie maken', 'Betalen kon niet worden gestart. Probeer het later opnieuw.', 502)
  return aygJson({ staat: 'betalen', url: sessie.url })
}
