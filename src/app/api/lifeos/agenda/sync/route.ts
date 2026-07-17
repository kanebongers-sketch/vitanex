// POST /api/lifeos/agenda/sync — haalt vandaag t/m +7 dagen op en zet ze in de
// cache.
//
// Idempotent: twee keer draaien = dezelfde rijen. De garantie zit in de unieke
// index (user_id, bron, extern_id) uit migratie 020, niet in deze route.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { forceerVernieuwing, geldigToken } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents, type EventsUitkomst } from '@/lib/lifeos/agenda/google'
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

  const uitkomst = await haalMetTweedeKans(
    toegang.admin,
    toegang.userId,
    token.toegangstoken,
    van,
    tot,
  )
  if (uitkomst.staat === 'verlopen') {
    // Een 401, en ook ná een geforceerde refresh nog steeds: de toestemming is
    // echt ingetrokken. Nu is "koppel opnieuw" het juiste antwoord — vóór de
    // retry was het een gok, want een token dat volgens ons nog goed was kon ook
    // gewoon net verlopen zijn.
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

/**
 * De events ophalen, met precies één tweede kans bij een 401 mid-flight.
 *
 * `geldigToken` ververst PROACTIEF (2 minuten marge). Dat dekt het normale geval
 * en niet het echte: een token dat volgens onze administratie nog 40 minuten goed
 * is, maar dat Google weigert omdat de toestemming is ingetrokken of het
 * wachtwoord is gewijzigd. Zonder deze retry kreeg Kane "koppel opnieuw" terwijl
 * één refresh het had opgelost.
 *
 * Precies één keer, geen lus: blijft het 401 ná een verse refresh, dan is de
 * toestemming echt weg.
 *
 * `forceerVernieuwing` houdt de discipline overeind: alleen `invalid_grant` wordt
 * `niet_gekoppeld`; een netwerkfout blijft `fout` en komt hier als `fout` terug —
 * dus nooit "je agenda is ontkoppeld" omdat Google net traag was.
 */
async function haalMetTweedeKans(
  admin: SupabaseClient,
  userId: string,
  token: string,
  van: Date,
  tot: Date,
): Promise<EventsUitkomst> {
  const eerste = await haalEvents(token, van, tot)
  if (eerste.staat !== 'verlopen') return eerste

  const vers = await forceerVernieuwing(admin, userId)
  if (vers.staat === 'niet_gekoppeld') return { staat: 'verlopen' }
  if (vers.staat === 'fout') return { staat: 'fout', reden: vers.reden }

  return haalEvents(vers.toegangstoken, van, tot)
}
