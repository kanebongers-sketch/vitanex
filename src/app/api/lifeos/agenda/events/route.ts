// POST /api/lifeos/agenda/events — maak een afspraak in je Google-agenda.
//
// Vervangt Google Calendar openen om iets in te plannen. LifeOS schrijft nu
// echt: de afspraak komt in je agenda én in de lokale cache, zodat je dag 'm
// meteen toont.
//
// Alleen wat de gebruiker vraagt: dit endpoint maakt precies één afspraak uit de
// meegestuurde velden. Niets verzonnen, geen dubbele — de unieke index (uit
// migratie 020) plus upsert in schrijven.ts sluiten dubbelen uit.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { leesNieuwEvent, maakAgendaEvent, schrijfFoutHttp } from '@/lib/lifeos/agenda/schrijven'

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  // Valideer op de grens, vóór we Google bellen: een lege titel hoeft geen
  // round-trip. schrijven.ts hervalideert defensief, dat is diepteverdediging.
  const body: unknown = await req.json().catch(() => null)
  const invoer = leesNieuwEvent(body)
  if (!invoer.ok) {
    return NextResponse.json({ fout: invoer.fout }, { status: 400 })
  }

  const kalenderId = await leesGekozenKalender(toegang.admin, toegang.userId)

  try {
    const event = await maakAgendaEvent(toegang.admin, toegang.userId, invoer.waarde, kalenderId)
    return NextResponse.json({ event }, { status: 201 })
  } catch (fout) {
    const http = schrijfFoutHttp(fout)
    if (http) return NextResponse.json({ fout: http.bericht }, { status: http.status })
    throw fout // onverwacht → 500, niet stil verzwolgen
  }
}
