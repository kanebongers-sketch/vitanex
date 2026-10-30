import { NextResponse, type NextRequest } from 'next/server'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { isAbonnementId } from '@/lib/aiyourgym/abonnement'
import { vindAbonnement } from '@/lib/aiyourgym/abonnement-opslag'
import { eigenPrijzen, stripeRegels, stripeSleutel } from '@/lib/aiyourgym/config'
import { testbetalen } from '@/lib/aiyourgym/testbetaling'
import { aantalVanRegels, leesAbonnementRegels, leesPakketVerzoek, naWijziging, pakketWeg, regelWissel, wisselLeeg, type AbonnementRegel } from '@/lib/aiyourgym/pakket-wijziging'
import { bewaarWijziging, sluitAanvraag, zetPakketten } from '@/lib/aiyourgym/pakket-opslag'
import { haalAbonnement, wisselRegels } from '@/lib/aiyourgym/stripe-api'
import { aygFout, aygJson } from '@/lib/aiyourgym/api'
import { metEngels } from '@/lib/aiyourgym/taal/woorden/website/meldingen'

// POST /api/aiyourgym/pakketten  { pakket, actie: 'erbij' | 'opzeggen' }
// Een pakket erbij nemen of opzeggen vanuit Club, Abonnement (besluit Kane
// 29-10-2026: losse pakketten). Alleen Kane en de eigenaar, alleen voor de
// eigen sportschool, alleen vanaf de app zelf (vereisBeheerdersBeheer). De
// regels (wanneer Stripe, testbetaling, direct of een aanvraag) staan in
// src/lib/aiyourgym/pakket-wijziging.ts. Er gaat geen mail naar buiten.
// Bundel (besluit Kane 30-10-2026): alle zes = een bundelregel op Stripe; erbij
// naar zes zet de losse regels in een verzoek om naar de bundel. Opzeggen is
// altijd een aanvraag volgens het jaarcontract, ook vanuit de bundel.

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
  const nieuw = naWijziging(t.organisatie.afgenomen, verzoek.waarde)
  const sleutel = stripeSleutel()
  const doel = stripeRegels(nieuw)
  const weg = pakketWeg({
    actie,
    platformEigenaar: t.isPlatformEigenaar,
    stripeAbonnement: abonnementId !== null,
    afsluitbaar: sleutel !== null && doel !== null,
    testbetalen: testbetalen(pakket),
  })

  if (weg === 'aanvraag') {
    const uit = await bewaarWijziging(t.admin, t.userId, pakket, actie, 'aanvraag', t.naam)
    if (uit === 'fout') return aygFout(MISLUKT, 500)
    await logActie(t, actie === 'erbij' ? 'Pakket aangevraagd' : 'Opzegging pakket aangevraagd', pakket, null)
    return aygJson({ weg, afgenomen: t.organisatie.afgenomen })
  }

  if (weg === 'stripe') {
    if (!sleutel || !doel || !abonnementId || !rij) return aygFout(MISLUKT, 503)
    // Eerst de regels zoals ze nu bij Stripe staan.
    const regels: AbonnementRegel[] | null = leesAbonnementRegels(await haalAbonnement(sleutel, abonnementId))
    if (!regels) return aygFout(MISLUKT, 502)
    const eigen = eigenPrijzen()
    const wissel = regelWissel(regels, doel.map((r) => r.prijsId), eigen)
    // Staat het al zo bij Stripe (nog een keer geklikt), dan hoeft er niets.
    if (!wisselLeeg(wissel) && !(await wisselRegels(sleutel, abonnementId, regels.map((r) => r.id), wissel, aantalVanRegels(regels, eigen, rij.aantalVestigingen)))) return aygFout(MISLUKT, 502)
  }

  if (!(await zetPakketten(t.admin, t.userId, nieuw))) return aygFout(MISLUKT, 500)
  await bewaarWijziging(t.admin, t.userId, pakket, actie, weg === 'stripe' ? 'stripe' : weg === 'test' ? 'test' : 'verwerkt', t.naam)
  await sluitAanvraag(t.admin, t.userId, pakket)
  await logActie(t, actie === 'erbij' ? 'Pakket erbij genomen' : 'Pakket opgezegd', pakket, null)
  return aygJson({ weg, afgenomen: nieuw, bundel: weg === 'stripe' && doel?.[0]?.regel === 'alles' })
}
