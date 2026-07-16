// GET /api/lifeos/agenda/vandaag — je dag in één antwoord.
//
// Leest de cache, niet Google: dit endpoint moet snel zijn en mag niet afhangen
// van een externe API die traag doet. Vullen is het werk van
// /api/lifeos/agenda/sync.
//
// Het interessante deel zijn de vrije blokken. Je agenda vertelt wat je moet;
// dit vertelt wat er over is — en dáár kan Vita straks je training in plannen.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { koppelingStaat } from '@/lib/lifeos/agenda/koppeling'
import { haalEventsUitCache, laatsteSync } from '@/lib/lifeos/agenda/opslag'
import { datumSleutel, leesDatumSleutel } from '@/lib/lifeos/datum/datum'
import {
  naarAfspraakJson,
  naarVrijBlokJson,
  type AgendaVandaag,
} from '@/lib/lifeos/agenda/agenda'
import { eerstvolgendeAfspraak, vrijeBlokken, werkVenster } from '@/lib/lifeos/agenda/vrije-blokken'

// `private`: dit is jouw dag, geen CDN-materiaal. `Vary: Authorization` is niet
// optioneel — zonder dat serveert een gedeelde cache het antwoord van de ene
// gebruiker aan de andere. Die les komt uit MentaForce (zie README).
const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=60',
  Vary: 'Authorization',
} as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  // Welke dag? Default vandaag (servertijd — zet TZ=Europe/Amsterdam, zie
  // .env.example). `?dag=` laat de UI om morgen vragen zonder tweede endpoint.
  const dagParam = req.nextUrl.searchParams.get('dag')
  const dag = dagParam ? leesDatumSleutel(dagParam) : new Date()
  if (!dag) {
    return NextResponse.json({ fout: 'Ongeldige dag; gebruik YYYY-MM-DD.' }, { status: 400 })
  }

  const staat = await koppelingStaat(toegang.admin, toegang.userId)
  if (staat.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon de koppeling niet lezen.' }, { status: 502 })
  }
  if (staat.staat === 'niet_gekoppeld') {
    // Eigen tak, geen lege lijst: "niet gekoppeld" is geen "geen afspraken".
    const antwoord: AgendaVandaag = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }

  const dagStart = new Date(dag)
  dagStart.setHours(0, 0, 0, 0)
  const dagEind = new Date(dagStart)
  dagEind.setDate(dagEind.getDate() + 1)

  const [events, sync] = await Promise.all([
    haalEventsUitCache(toegang.admin, toegang.userId, dagStart, dagEind),
    laatsteSync(toegang.admin, toegang.userId),
  ])

  if (!events.ok || !sync.ok) {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  const nu = new Date()
  const isVandaag = datumSleutel(nu) === datumSleutel(dag)
  const venster = werkVenster(dag)

  const antwoord: AgendaVandaag = {
    gekoppeld: true,
    dag: datumSleutel(dag),
    laatsteSync: sync.waarde,
    events: events.waarde.map(naarAfspraakJson),
    volgende: (() => {
      const volgende = eerstvolgendeAfspraak(events.waarde, nu)
      return volgende ? naarAfspraakJson(volgende) : null
    })(),
    // Alleen vandaag knippen we het verleden weg. Vraag je om morgen, dan wil je
    // het hele venster zien en niet vanaf "nu".
    vrijeBlokken: vrijeBlokken(events.waarde, venster, isVandaag ? { nu } : {}).map(
      naarVrijBlokJson,
    ),
  }

  return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
}
