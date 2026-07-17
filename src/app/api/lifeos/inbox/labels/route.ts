// GET /api/lifeos/inbox/labels — de labels van je mailbox.
//
// Bestaat om één reden: `POST /api/lifeos/inbox/acties` met `soort: 'label'` wil
// label-ID's, en Gmail's id's (`Label_42`) zijn niet af te leiden uit de naam
// ("Facturen"). Zonder deze lijst is labelen dus alleen te gebruiken door wie de
// id's toevallig al kent — dat is geen feature, dat is een API-restant.
//
// Alleen lezen. Dit endpoint maakt geen labels aan en wijzigt er geen; het vertelt
// alleen welke er zijn. Labelnamen zijn van Kane zelf (niet van derden, anders dan
// afzenders en onderwerpen), dus hier is geen inbox-grens in het geding.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalLabels, actieFoutHttp } from '@/lib/lifeos/inbox/gmail-acties'

// `private, max-age=60`: je labellijst verandert zelden, en dit is jouw mailbox —
// geen CDN-materiaal. `Vary: Authorization` is niet optioneel; zonder dat serveert
// een gedeelde cache het antwoord van de ene gebruiker aan de andere.
const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=60',
  Vary: 'Authorization',
} as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  try {
    const labels = await haalLabels(toegang.admin, toegang.userId)
    return NextResponse.json({ labels }, { headers: CACHE_HEADERS })
  } catch (fout) {
    const http = actieFoutHttp(fout)
    if (http) return NextResponse.json({ fout: http.bericht }, { status: http.status })
    throw fout // onverwacht → 500, niet stil verzwolgen
  }
}
