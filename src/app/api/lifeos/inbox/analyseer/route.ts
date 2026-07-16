// POST /api/lifeos/inbox/analyseer — mail-metadata → taak/agenda-suggesties.
//
// FUNCTIE 2, het AI-deel. De client stuurt de afzender + het onderwerp mee die
// de triage al toonde, zodat we Gmail NIET opnieuw hoeven te raken. We halen hier
// dus niets bij Gmail op, lezen geen body, en slaan niets op — de inbox-grenzen
// uit `gmail.ts` gelden onverkort. Het enige externe dat we bellen is het
// intentiebrein (Claude), en alleen om afzender+onderwerp te classificeren.
//
// Niets gebeurt automatisch: dit endpoint stelt alleen vóór. Kane maakt de taak
// of afspraak pas aan met een klik (zie `InboxKaart`). Een mail-classificatie kan
// ernaast zitten, en een automatisch geplande afspraak op een verkeerde datum is
// erger dan een knop.
//
// Founder-gate = `vereisLifeosToegang`: LifeOS binnen MentaForce is single-tenant
// en founder-only. Deze route leest alleen (raakt de LifeOS-DB niet), maar zit
// net als elke andere LifeOS-route achter dezelfde poort: geen founder → 401/403.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { maakAnthropicModel } from '@/lib/lifeos/intentie/intentie-model'
import { type IntentieModel } from '@/lib/lifeos/intentie/intentie'
import { analyseerMails, leesAnalyseVerzoek, naarSuggestieJson } from '@/lib/lifeos/inbox/analyse'

// `no-store`: dit gaat over afzenders en onderwerpen van derden. Geen enkele
// cache — browser, CDN of proxy — mag hier een kopie van houden. `Vary` staat er
// als tweede slot alsnog bij, net als bij `/api/lifeos/inbox/vandaag`.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const verzoek = leesAnalyseVerzoek(body)
  if (!verzoek.ok) {
    return NextResponse.json({ fout: verzoek.fout }, { status: 400 })
  }

  // Leeg lijstje = niets te analyseren. Geen modelaanroep, gewoon een leeg
  // antwoord — dat is geen fout.
  if (verzoek.berichten.length === 0) {
    return NextResponse.json({ suggesties: [] }, { headers: CACHE_HEADERS })
  }

  let model: IntentieModel
  try {
    model = maakAnthropicModel()
  } catch {
    // Geen API-sleutel = we kunnen niet analyseren. Dat is een storing, geen
    // "geen suggesties": een leeg lijstje zou zeggen dat er niets in de mails zit
    // terwijl we niet gekeken hebben. Fout ≠ leeg.
    return NextResponse.json({ fout: 'De AI-analyse is nu niet beschikbaar.' }, { status: 503 })
  }

  const suggesties = await analyseerMails(verzoek.berichten, model)
  return NextResponse.json(
    { suggesties: suggesties.map(naarSuggestieJson) },
    { headers: CACHE_HEADERS },
  )
}
