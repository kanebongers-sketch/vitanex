// GET /api/lifeos/taken/dagplan — welke taak in welk gat van je dag.
//
//   ?dag=YYYY-MM-DD   welke dag (default: vandaag, servertijd)
//   ?energie=laag|midden|hoog   hoeveel energie je nu hebt (optioneel)
//
// Legt de takenlijst op de agenda: `vrijeBlokken` zegt wat er over is,
// `ordenTaken` zegt wat het zwaarst weegt, `maakDagplan` legt ze op elkaar.
//
// Het antwoord bevat expliciet wat NIET geplaatst kon worden en waarom. Dat is
// geen extra: een plan dat alleen toont wat past, verzwijgt precies de taken
// waar je iets aan moet doen (zie `dagplan.ts`).
//
// Leest de agenda-CACHE, niet Google: dit endpoint moet snel zijn en mag niet
// afhangen van een externe API die traag doet. Vullen is het werk van
// /api/lifeos/agenda/sync.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { koppelingStaat } from '@/lib/lifeos/agenda/koppeling'
import { haalEventsUitCache } from '@/lib/lifeos/agenda/opslag'
import { vrijeBlokken, werkVenster } from '@/lib/lifeos/agenda/vrije-blokken'
import { datumSleutel, leesDatumSleutel } from '@/lib/lifeos/datum/datum'
import { haalTaken } from '@/lib/lifeos/taken/opslag'
import { isEnergieNiveau } from '@/lib/lifeos/taken/prioriteit'
import {
  kandidatenVoorVandaag,
  maakDagplan,
  naarInplanningJson,
  naarNietGeplaatstJson,
  type DagplanJson,
} from '@/lib/lifeos/taken/dagplan'

// Geen max-age: je plan verandert zodra je een taak afvinkt of een schatting
// invult. Een plan dat de oude stand toont is erger dan een extra round-trip.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const params = req.nextUrl.searchParams

  const dagParam = params.get('dag')
  const dag = dagParam ? leesDatumSleutel(dagParam) : new Date()
  if (!dag) {
    return NextResponse.json({ fout: 'Ongeldige dag; gebruik YYYY-MM-DD.' }, { status: 400 })
  }

  // Energie is optioneel, maar onzin is geen "geen opgave": als je 'hoogg'
  // stuurt, bedoelde je iets, en dat stil negeren geeft je een plan dat je niet
  // vroeg.
  const energieParam = params.get('energie')
  if (energieParam !== null && !isEnergieNiveau(energieParam)) {
    return NextResponse.json(
      { fout: "Energie is 'laag', 'midden' of 'hoog'." },
      { status: 400 },
    )
  }

  const staat = await koppelingStaat(toegang.admin, toegang.userId)
  if (staat.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon de koppeling niet lezen.' }, { status: 502 })
  }
  if (staat.staat === 'niet_gekoppeld') {
    // Eigen tak, geen leeg plan. Zonder agenda weten we niet welke tijd je vrij
    // hebt — dan is "geen ruimte" een leugen en "de hele dag vrij" ook.
    const antwoord: DagplanJson = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }

  const dagStart = new Date(dag)
  dagStart.setHours(0, 0, 0, 0)
  const dagEind = new Date(dagStart)
  dagEind.setDate(dagEind.getDate() + 1)

  const [events, taken] = await Promise.all([
    haalEventsUitCache(toegang.admin, toegang.userId, dagStart, dagEind),
    haalTaken(toegang.admin, toegang.userId, { alleenOpen: true }),
  ])

  if (!events.ok) {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }
  if (!taken.ok) {
    return NextResponse.json({ fout: 'Kon je taken niet lezen.' }, { status: 502 })
  }

  const nu = new Date()
  const dagKey = datumSleutel(dag)
  const isVandaag = datumSleutel(nu) === dagKey

  // Alleen voor vandaag knippen we het verleden weg: een blok dat om 09:00 begon
  // terwijl het 14:00 is, is geen ruimte. Plan je morgen, dan telt het hele
  // werkvenster.
  const blokken = vrijeBlokken(events.waarde, werkVenster(dag), isVandaag ? { nu } : {})

  const plan = maakDagplan(kandidatenVoorVandaag(taken.waarde, dagKey), blokken, {
    vandaagSleutel: dagKey,
    energieNu: energieParam,
  })

  const antwoord: DagplanJson = {
    gekoppeld: true,
    dag: dagKey,
    inplanningen: plan.inplanningen.map(naarInplanningJson),
    nietGeplaatst: plan.nietGeplaatst.map(naarNietGeplaatstJson),
    restMinuten: plan.restMinuten,
  }

  return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
}
