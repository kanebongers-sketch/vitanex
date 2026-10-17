import type { NextRequest } from 'next/server'
import { ipVan, isZelfdeOorsprong } from '@/lib/lifeos/leads/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { siteActief } from '@/lib/aiyourgym/schakelaar'
import { MAX_BODY_BYTES, isRobot, leesAanmelding } from '@/lib/aiyourgym/aanmelding'
import { NIET_OPEN, afsluitbaar, stripePrijs, stripeSleutel } from '@/lib/aiyourgym/config'
import { checkoutAdressen, oorsprongVan } from '@/lib/aiyourgym/links'
import { koppelSessie, maakAanmelding, slugVrij } from '@/lib/aiyourgym/opslag'
import { maakCheckoutSessie } from '@/lib/aiyourgym/stripe-api'
import { adminOfNull, aygFout, aygJson, poortOpen, publiekeHost } from '@/lib/aiyourgym/api'

// POST /api/aiyourgym/checkout
// Een sportschool meldt zich aan. Is het pakket online af te sluiten (Stripe-
// sleutel en prijs in env), dan volgt Stripe Checkout met een proefperiode.
// Anders bewaren we de aanmelding als 'aanvraag' voor Kane en zeggen we eerlijk
// dat aanmelden nog niet open is. Er gaat geen mail naar buiten.

export const dynamic = 'force-dynamic'

const AANVRAAG = `${NIET_OPEN} We hebben je gegevens ontvangen en nemen zelf contact met je op.`
const MISLUKT = 'Aanmelden lukte niet. Probeer het later opnieuw.'

export async function POST(req: NextRequest) {
  if (!(await poortOpen())) return aygFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return aygFout('Dit verzoek komt niet van de website zelf.', 403)
  if (isRateLimited(`ayg-checkout:${ipVan(req)}`, 5, 10 * 60_000)) return aygFout('Te veel pogingen. Probeer het over een paar minuten opnieuw.', 429)

  const body = await leesJsonBegrensd(req, MAX_BODY_BYTES)
  if (body === 'te-groot') return aygFout('Het verzoek is te groot.', 413)
  // Een robot krijgt hetzelfde antwoord als een aanvraag, maar we bewaren niets.
  if (isRobot(body)) return aygJson({ staat: 'aanvraag', melding: AANVRAAG })
  const invoer = leesAanmelding(body)
  if (!invoer.ok) return aygJson({ fout: 'Controleer de gemarkeerde velden.', fouten: invoer.fouten }, 400)
  const a = invoer.waarde

  const admin = adminOfNull()
  if (!admin) return aygFout(NIET_OPEN, 503)
  const nu = new Date()
  const vrij = await slugVrij(admin, a.slug, nu)
  if (vrij === null) return aygFout(MISLUKT, 500)
  if (!vrij) return aygJson({ fout: 'Controleer de gemarkeerde velden.', fouten: { slug: 'Dit adres is al bezet. Kies een ander.' } }, 409)

  const sleutel = stripeSleutel()
  const prijs = stripePrijs(a.pakket)
  if (!afsluitbaar(a.pakket) || !sleutel || !prijs) {
    const id = await maakAanmelding(admin, a, 'aanvraag', nu)
    return id ? aygJson({ staat: 'aanvraag', melding: AANVRAAG }) : aygFout(MISLUKT, 500)
  }

  const host = publiekeHost(req)
  const oorsprong = oorsprongVan(host)
  if (!oorsprong) return aygFout(MISLUKT, 400)
  const id = await maakAanmelding(admin, a, 'wacht_op_betaling', nu)
  if (!id) return aygFout(MISLUKT, 500)
  const adressen = checkoutAdressen(oorsprong, host, siteActief())
  const sessie = await maakCheckoutSessie(sleutel, { aanmeldingId: id, aanmelding: a, prijsId: prijs, succesUrl: adressen.succes, terugUrl: adressen.terug })
  if (!sessie || !(await koppelSessie(admin, id, sessie.id))) return aygFout('Betalen kon niet worden gestart. Probeer het later opnieuw.', 502)
  return aygJson({ staat: 'betalen', url: sessie.url })
}
