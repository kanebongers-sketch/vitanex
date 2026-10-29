import { NextResponse, type NextRequest } from 'next/server'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { isAbonnementId } from '@/lib/aiyourgym/abonnement'
import { vindAbonnement } from '@/lib/aiyourgym/abonnement-opslag'
import { afsluitbaar, stripePrijs, stripeSleutel } from '@/lib/aiyourgym/config'
import { testbetalen } from '@/lib/aiyourgym/testbetaling'
import { leesPakketVerzoek, naWijziging, pakketWeg } from '@/lib/aiyourgym/pakket-wijziging'
import { bewaarWijziging, sluitAanvraag, zetPakketten } from '@/lib/aiyourgym/pakket-opslag'
import { voegRegelToe } from '@/lib/aiyourgym/stripe-api'
import { aygFout, aygJson } from '@/lib/aiyourgym/api'
import { metEngels } from '@/lib/aiyourgym/taal/woorden/website/meldingen'

// POST /api/aiyourgym/pakketten  { pakket, actie: 'erbij' | 'opzeggen' }
// Een pakket erbij nemen of opzeggen vanuit Club, Abonnement (besluit Kane
// 29-10-2026: losse pakketten). Alleen Kane en de eigenaar, alleen voor de
// eigen sportschool, alleen vanaf de app zelf (vereisBeheerdersBeheer). De
// regels (wanneer Stripe, testbetaling, direct of een aanvraag) staan in
// src/lib/aiyourgym/pakket-wijziging.ts. Er gaat geen mail naar buiten.

export const dynamic = 'force-dynamic'

const MISLUKT = 'Het pakket kon niet worden aangepast. Probeer het later opnieuw.'
const FOUT: Record<'onbekend' | 'al' | 'niet' | 'laatste', string> = {
  onbekend: 'Kies een pakket.',
  al: 'Dit pakket heb je al.',
  niet: 'Dit pakket heb je niet.',
  laatste: 'Je houdt minstens een pakket. Wil je helemaal stoppen, zeg dan je abonnement op.',
}

export async function POST(req: NextRequest) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  if (isRateLimited(`ayg-pakketten:${t.userId}`, 20, 10 * 60_000)) return aygFout('Te veel pogingen. Probeer het over een paar minuten opnieuw.', 429)

  const body = await leesJsonBegrensd(req, 1_024)
  if (body === 'te-groot') return aygFout('Het verzoek is te groot.', 413)
  const verzoek = leesPakketVerzoek(body, t.organisatie.afgenomen)
  if (!verzoek.ok) return aygJson(metEngels({ fout: FOUT[verzoek.fout] }), 400)
  const { pakket, actie } = verzoek.waarde

  const gelezen = await vindAbonnement(t.admin, t.userId)
  if (gelezen.soort === 'fout') return aygFout(MISLUKT, 500)
  const rij = gelezen.soort === 'gevonden' ? gelezen.rij : null
  const abonnementId = rij && rij.status !== 'test' && isAbonnementId(rij.stripeAbonnementId) ? rij.stripeAbonnementId : null
  const weg = pakketWeg({ actie, platformEigenaar: t.isPlatformEigenaar, stripeAbonnement: abonnementId !== null, afsluitbaar: afsluitbaar(pakket), testbetalen: testbetalen(pakket) })
  const nieuw = naWijziging(t.organisatie.afgenomen, verzoek.waarde)

  if (weg === 'aanvraag') {
    const uit = await bewaarWijziging(t.admin, t.userId, pakket, actie, 'aanvraag', t.naam)
    if (uit === 'fout') return aygFout(MISLUKT, 500)
    await logActie(t, actie === 'erbij' ? 'Pakket aangevraagd' : 'Opzegging pakket aangevraagd', pakket, null)
    return aygJson({ weg, afgenomen: t.organisatie.afgenomen })
  }

  if (weg === 'stripe') {
    const sleutel = stripeSleutel()
    const prijs = stripePrijs(pakket)
    if (!sleutel || !prijs || !abonnementId || !rij) return aygFout(MISLUKT, 503)
    const regel = await voegRegelToe(sleutel, abonnementId, pakket, prijs, rij.aantalVestigingen)
    if (!regel) return aygFout(MISLUKT, 502)
  }

  if (!(await zetPakketten(t.admin, t.userId, nieuw))) return aygFout(MISLUKT, 500)
  await bewaarWijziging(t.admin, t.userId, pakket, actie, weg === 'stripe' ? 'stripe' : weg === 'test' ? 'test' : 'verwerkt', t.naam)
  await sluitAanvraag(t.admin, t.userId, pakket)
  await logActie(t, actie === 'erbij' ? 'Pakket erbij genomen' : 'Pakket opgezegd', pakket, null)
  return aygJson({ weg, afgenomen: nieuw })
}
