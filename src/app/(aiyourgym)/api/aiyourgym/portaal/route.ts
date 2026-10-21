import { NextResponse, type NextRequest } from 'next/server'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { isKlantId, portaalFormulier, portaalTerugUrl } from '@/lib/aiyourgym/abonnement'
import { vindAbonnement } from '@/lib/aiyourgym/abonnement-opslag'
import { stripeSleutel } from '@/lib/aiyourgym/config'
import { maakPortaalSessie } from '@/lib/aiyourgym/stripe-api'
import { aygFout, aygJson, publiekeHost } from '@/lib/aiyourgym/api'

// POST /api/aiyourgym/portaal
// De eigenaar van een sportschool (of Kane) opent het Stripe Customer Portal:
// facturen, betaalgegevens en opzeggen. Alleen voor de eigen sportschool, alleen
// vanaf de app zelf (vereisBeheerdersBeheer controleert ook de oorsprong) en
// begrensd. Zonder Stripe-koppeling (Fit Factory, demo, testaccount) een nette
// melding. Het antwoord is alleen de url van Stripe; er gaat niets anders mee.

export const dynamic = 'force-dynamic'

const MISLUKT = 'Facturen en betaalgegevens konden niet worden geopend. Probeer het later opnieuw.'

export async function POST(req: NextRequest) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  if (isRateLimited(`ayg-portaal:${t.userId}`, 10, 10 * 60_000)) return aygFout('Te veel pogingen. Probeer het over een paar minuten opnieuw.', 429)

  const gelezen = await vindAbonnement(t.admin, t.userId)
  if (gelezen.soort === 'fout') return aygFout(MISLUKT, 500)
  const rij = gelezen.soort === 'gevonden' ? gelezen.rij : null
  if (!rij || rij.status === 'test' || !isKlantId(rij.stripeKlantId)) return aygFout('Deze sportschool heeft geen abonnement bij Stripe.', 409)

  const sleutel = stripeSleutel()
  if (!sleutel) return aygFout('Betalen is nog niet ingesteld.', 503)
  const terug = portaalTerugUrl(publiekeHost(req))
  if (!terug) return aygFout(MISLUKT, 400)

  const url = await maakPortaalSessie(sleutel, portaalFormulier(rij.stripeKlantId, terug))
  return url ? aygJson({ url }) : aygFout(MISLUKT, 502)
}
