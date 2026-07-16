// GET /api/lifeos/inbox/vandaag — de triage.
//
// Leest Gmail LIVE. Bewust geen cache-tabel zoals de agenda die heeft, en dat is
// de belangrijkste beslissing in deze functie:
//
//   1. Er valt niets zinnigs te cachen. "Ongelezen van de laatste 24 uur" is per
//      definitie vers; een gecachet antwoord is meteen onwaar zodra je een mail
//      leest of er een binnenkomt.
//   2. Cachen zou betekenen: onderwerpregels en afzenders van derden opslaan in
//      Kane's database. Die mensen gaven daar nooit toestemming voor, en een
//      onderwerpregel lekt meer dan je denkt ("uitslag onderzoek", "je factuur
//      staat open"). Niet opslaan is hier geen beperking maar het ontwerp.
//   3. Het is snel genoeg: max 40 berichten, metadata-only.
//
// Gevolg: er is géén migratie voor deze functie. Het enige dat blijft staan is
// het OAuth-token, en dat hoort in `koppelingen` — die tabel bestaat al en heeft
// 'gmail' al in zijn check-constraint (001_fundament.sql).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { geldigToken } from '@/lib/lifeos/inbox/koppeling'
import { haalTriageMails } from '@/lib/lifeos/inbox/gmail'
import { triageer } from '@/lib/lifeos/inbox/classificeer'
import { naarInboxVandaag, type InboxVandaag } from '@/lib/lifeos/inbox/inbox'

// `no-store`, niet `max-age`: dit is post. Geen enkele cache — geen browser, geen
// CDN, geen proxy — mag hier een kopie van houden.
//
// `Vary: Authorization` staat er ondanks `no-store` toch bij, en dat is geen
// bijgeloof: een gedeelde cache die `no-store` negeert of verkeerd implementeert
// heeft dan alsnog de juiste sleutel. Twee sloten op een deur die dicht hoort te
// blijven. De les komt uit MentaForce (zie README).
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const token = await geldigToken(toegang.admin, toegang.userId)

  if (token.staat === 'fout') {
    // Fout ≠ leeg. Een 502 laat de kaart zijn foutstaat tonen; een lege lijst zou
    // Kane vertellen dat niemand iets van hem wil terwijl we niet gekeken hebben.
    return NextResponse.json({ fout: 'Kon je mailkoppeling niet lezen.' }, { status: 502 })
  }

  if (token.staat === 'niet_gekoppeld') {
    // Eigen tak, geen lege lijst. Dekt ook het geval dat Google de toestemming
    // heeft ingetrokken — bij een consent-scherm in "Testing" gebeurt dat elke
    // 7 dagen vanzelf. De weg terug is dan simpelweg: opnieuw koppelen.
    const antwoord: InboxVandaag = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }

  const mails = await haalTriageMails(token.toegangstoken)

  if (mails.staat === 'verlopen') {
    // Het token was volgens onze administratie geldig, maar Gmail zegt van niet.
    // Dat is een fout, geen lege inbox: we weten simpelweg niet wat er ligt.
    return NextResponse.json(
      { fout: 'Gmail accepteerde de koppeling niet meer. Koppel opnieuw.' },
      { status: 502 },
    )
  }

  if (mails.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je inbox niet lezen.' }, { status: 502 })
  }

  return NextResponse.json(naarInboxVandaag(triageer(mails.mails), mails.nietGelezen), {
    headers: CACHE_HEADERS,
  })
}
