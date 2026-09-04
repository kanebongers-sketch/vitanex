// GET /api/lifeos/pt-gesprekken — het 2-wekelijkse PT-coachgesprek per klant.
//
// Voor elk PT-teamlid (CRM-groep `pt_team`): staat er binnen de komende 14 dagen
// een afspraak "Coachgesprek PT - Kane (Naam)" in je agenda? Zo ja → geregeld;
// zo nee → nog inplannen. De detectie leest LIVE uit Google (de gekozen agenda,
// dezelfde waar de "Inplannen"-knop de afspraak in zet), zodat een net-gemaakte
// afspraak meteen afvinkt en er geen valse "nog inplannen" ontstaat door een
// cache die maar 7 dagen ver reikt.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents } from '@/lib/lifeos/agenda/google'
import { bepaalStatus, type PtEvent, type PtGesprekkenAntwoord } from '@/lib/lifeos/pt-gesprek/pt-gesprek'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VENSTER_DAGEN = 14

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  // 1. Het PT-team uit het CRM.
  const personen = await haalPersonen(toegang.admin, toegang.userId, 'pt_team')
  if (!personen.ok) {
    return NextResponse.json({ fout: 'Kon je PT-team niet lezen.' }, { status: 502 })
  }

  // 2. Het agenda-token. "Niet gekoppeld" is een eigen tak (de kaart toont dan de
  //    koppel-CTA), geen lege lijst die "alles geregeld" zou suggereren.
  const token = await geldigToken(toegang.admin, toegang.userId)
  if (token.staat === 'niet_gekoppeld') {
    const antwoord: PtGesprekkenAntwoord = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }
  if (token.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  // 3. De afspraken van de komende 14 dagen uit de gekozen agenda.
  const kalenderId = await leesGekozenKalender(toegang.admin, toegang.userId)
  const van = new Date()
  const tot = new Date(van.getTime() + VENSTER_DAGEN * 24 * 60 * 60 * 1000)

  const events = await haalEvents(token.toegangstoken, van, tot, kalenderId)
  if (events.staat === 'verlopen') {
    const antwoord: PtGesprekkenAntwoord = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }
  if (events.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  // 4. De regel toepassen (puur, getest in pt-gesprek.test.ts).
  const ptEvents: PtEvent[] = events.events.map((e) => ({
    titel: e.titel,
    startOp: e.startOp.toISOString(),
  }))
  const pts = bepaalStatus(
    personen.waarde.map((p) => ({ id: p.id, naam: p.naam, email: p.email })),
    ptEvents,
  )

  const antwoord: PtGesprekkenAntwoord = { gekoppeld: true, pts }
  return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
}
