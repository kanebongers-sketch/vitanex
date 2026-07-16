// POST /api/lifeos/agenda/sync — haalt vandaag t/m +7 dagen op en zet ze in de
// cache.
//
// Idempotent: twee keer draaien = dezelfde rijen. De garantie zit in de unieke
// index (user_id, bron, extern_id) uit migratie 020, niet in deze route.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { geldigToken } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents } from '@/lib/lifeos/agenda/google'
import { bewaarEvents } from '@/lib/lifeos/agenda/opslag'

/** Vandaag + 7. Verder vooruit kijken heeft geen doel: je dag runnen is het punt. */
const DAGEN_VOORUIT = 7

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const token = await geldigToken(toegang.admin, toegang.userId)
  if (token.staat === 'niet_gekoppeld') {
    return NextResponse.json({ fout: 'Je agenda is niet gekoppeld.' }, { status: 409 })
  }
  if (token.staat === 'fout') {
    // Uitdrukkelijk 502 en niet "leeg": Google even niet bereikbaar is iets
    // anders dan een lege agenda.
    return NextResponse.json({ fout: 'Google is niet bereikbaar.' }, { status: 502 })
  }

  const van = new Date()
  van.setHours(0, 0, 0, 0)
  const tot = new Date(van)
  tot.setDate(tot.getDate() + DAGEN_VOORUIT + 1)

  const uitkomst = await haalEvents(token.toegangstoken, van, tot)
  if (uitkomst.staat === 'verlopen') {
    // Net nog ververst en tóch een 401: de toestemming is ingetrokken.
    return NextResponse.json({ fout: 'De agendakoppeling is verlopen. Koppel opnieuw.' }, { status: 409 })
  }
  if (uitkomst.staat === 'fout') {
    return NextResponse.json({ fout: 'Google is niet bereikbaar.' }, { status: 502 })
  }

  const bewaard = await bewaarEvents(toegang.admin, toegang.userId, uitkomst.events, van, tot)
  if (!bewaard.ok) {
    return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 })
  }

  return NextResponse.json({
    gesynct: bewaard.waarde,
    van: van.toISOString(),
    tot: tot.toISOString(),
  })
}
