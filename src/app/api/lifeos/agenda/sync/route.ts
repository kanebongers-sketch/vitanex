// POST /api/lifeos/agenda/sync — haalt vandaag t/m +7 dagen op uit ALLE zichtbare
// agenda's en zet ze in de cache.
//
// De sync-logica zelf staat in `@/lib/lifeos/agenda/sync` zodat ze OOK server-to-
// server draait (cron + vlak vóór de briefing), niet alleen wanneer de agenda-
// kaart hem aanroept. Deze route is de sessie-ingang: gate → sync → antwoord.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { syncAgenda } from '@/lib/lifeos/agenda/sync'

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const uitkomst = await syncAgenda(toegang.admin, toegang.userId)

  switch (uitkomst.staat) {
    case 'ok':
      return NextResponse.json({
        gesynct: uitkomst.gesynct,
        van: uitkomst.van.toISOString(),
        tot: uitkomst.tot.toISOString(),
      })
    case 'niet_gekoppeld':
      return NextResponse.json({ fout: 'Je agenda is niet gekoppeld.' }, { status: 409 })
    case 'verlopen':
      return NextResponse.json({ fout: 'De agendakoppeling is verlopen. Koppel opnieuw.' }, { status: 409 })
    case 'onbereikbaar':
      // Uitdrukkelijk 502 en niet "leeg": Google even niet bereikbaar is iets
      // anders dan een lege agenda.
      return NextResponse.json({ fout: 'Google is niet bereikbaar.' }, { status: 502 })
    case 'opslag_fout':
      return NextResponse.json({ fout: uitkomst.melding }, { status: 502 })
  }
}
