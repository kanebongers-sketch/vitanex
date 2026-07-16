// GET /api/lifeos/herstel/week — de laatste 7 dagen, per dag samengevoegd.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`. Die levert de service-role
// client op het LifeOS-project (`toegang.admin`) en het vaste eigenaar-id
// (`toegang.userId`) waarop alle queries filteren.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesKoppelingen } from '@/lib/lifeos/herstel/koppelingen'
import { leesMetingen } from '@/lib/lifeos/herstel/opslag'
import { isoDatum, laatsteDagen, vandaagLokaal } from '@/lib/lifeos/herstel/tijd'
import { groepeerPerDag } from '@/lib/lifeos/herstel/week'

export const dynamic = 'force-dynamic'

const DAGEN = 7

export async function GET(request: NextRequest) {
  const toegang = await vereisLifeosToegang(request)
  if (toegang instanceof NextResponse) return toegang

  const gevraagd = request.nextUrl.searchParams.get('vandaag')
  const vandaag = isoDatum(gevraagd) ?? vandaagLokaal()
  const dagen = laatsteDagen(vandaag, DAGEN)
  const eerste = dagen[0] ?? vandaag

  let rijen
  let gekoppeld: string[]
  try {
    // Beide in één vlucht: ze zijn onafhankelijk, dus serieel wachten is puur
    // verlies.
    const [metingen, koppelingen] = await Promise.all([
      leesMetingen(toegang.admin, toegang.userId, eerste, vandaag),
      leesKoppelingen(toegang.admin, toegang.userId),
    ])
    rijen = groepeerPerDag(metingen, dagen)
    gekoppeld = koppelingen.map((k) => k.dienst)
  } catch (fout) {
    // Expliciet een fout-status: de kaart moet "er ging iets mis" tonen, nooit
    // "je hebt niets gemeten".
    console.error('[herstel] week lezen mislukt', fout)
    return NextResponse.json({ fout: 'herstelgegevens konden niet worden geladen' }, { status: 500 })
  }

  // `gekoppeld` hoort hier omdat de UI drie lege staten kent die niet hetzelfde
  // betekenen: "je hebt niets gekoppeld", "gekoppeld maar nog niets gemeten" en
  // "er ging iets mis". Zonder deze lijst zou de kaart de eerste twee moeten
  // gokken — en dan vertel je iemand met een lege Whoop-nacht dat hij geen
  // wearable heeft. Dat is dezelfde klasse fout als fout==leeg.
  return NextResponse.json(
    { vandaag, dagen: rijen, gekoppeld },
    {
      headers: {
        // Kort cachen scheelt een query bij het heen-en-weer klikken tussen de
        // momenten. `private`: dit is gezondheidsdata, die hoort nooit in een
        // gedeelde/CDN-cache.
        'cache-control': 'private, max-age=60',
        // Zonder Vary mag de browsercache dit antwoord hergebruiken voor een
        // request met een ánder Authorization-token. Dan serveer je de ene
        // sessie de gezondheidsdata van de andere — een AVG-lek, geen detail.
        vary: 'Authorization',
      },
    },
  )
}
