// GET  /api/lifeos/training — wat er op een dag (of in een reeks dagen) staat
// POST /api/lifeos/training — een training loggen, of er een plannen
//
// Vervangt de workout-logger. Niet door er een na te bouwen — LifeOS logt wat je
// deed en schrijft je geen programma voor.
//
// ─── gepland ≠ gedaan ───────────────────────────────────────────────────────
// `gepland: true` is een voornemen, `gepland: false` is een meting. Deze route
// bewaakt die grens samen met de check-constraint uit migratie 070: een
// voornemen draagt nooit een duur, een RPE of actieve minuten. Vita mag alleen
// op metingen af, en dat kan alleen als "van plan" nooit als "gedaan" kan
// binnenkomen.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`. Die levert de service-role
// client op het LifeOS-project (`toegang.admin`) en het vaste eigenaar-id
// (`toegang.userId`) waarop alle queries filteren.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesNieuweTraining } from '@/lib/lifeos/training/training'
import { haalTrainingen, maakTraining, type TrainingVenster } from '@/lib/lifeos/training/opslag'
import { foutAntwoord } from '@/lib/lifeos/training/antwoord'
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

// Geen max-age: je logt terwijl je kijkt. Een kaart die na een reload je net
// gelogde sessie niet toont, is erger dan een extra round-trip. `Vary` staat er
// alsnog — mocht er ooit iets tussen zitten dat wél cachet, dan mag het antwoord
// van de ene sessie nooit bij een andere terechtkomen.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

/** Plafond op een reeks. Voorkomt dat één request de hele historie ophaalt. */
const MAX_REEKS_DAGEN = 92

/** Hoeveel hele dagen zitten er tussen twee dagsleutels? Rekent in UTC; zomertijd doet niets. */
function dagenTussen(vanaf: Date, tot: Date): number {
  return Math.round((tot.getTime() - vanaf.getTime()) / 86_400_000)
}

type VensterLezing = { ok: true; venster: TrainingVenster } | { ok: false; fout: string }

/**
 * Leest het gevraagde venster uit de querystring.
 *
 * Bewust geen stille standaard ("vandaag"): de server kent jouw tijdzone niet.
 * Zou hij hier `new Date()` gebruiken, dan is dat op Vercel de UTC-dag — en dan
 * mist je log om 01:00 zomertijd de verkeerde dag. De client weet welke dag het
 * voor hém is en stuurt die mee.
 */
function leesVenster(params: URLSearchParams): VensterLezing {
  const datum = params.get('datum')
  if (datum !== null) {
    if (leesDatumSleutel(datum) === null) {
      return { ok: false, fout: 'Ongeldige datum; gebruik YYYY-MM-DD.' }
    }
    return { ok: true, venster: { soort: 'dag', datum } }
  }

  const vanaf = params.get('vanaf')
  const tot = params.get('tot')
  if (vanaf === null || tot === null) {
    return { ok: false, fout: 'Geef `datum`, of `vanaf` en `tot` (YYYY-MM-DD).' }
  }

  const vanafDag = leesDatumSleutel(vanaf)
  const totDag = leesDatumSleutel(tot)
  if (vanafDag === null || totDag === null) {
    return { ok: false, fout: 'Ongeldige datum; gebruik YYYY-MM-DD.' }
  }

  const dagen = dagenTussen(vanafDag, totDag)
  if (dagen < 0) return { ok: false, fout: '`tot` ligt vóór `vanaf`.' }
  if (dagen >= MAX_REEKS_DAGEN) {
    return { ok: false, fout: `Een reeks is maximaal ${MAX_REEKS_DAGEN} dagen.` }
  }

  return { ok: true, venster: { soort: 'reeks', vanaf, tot } }
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const venster = leesVenster(req.nextUrl.searchParams)
  if (!venster.ok) {
    return NextResponse.json({ fout: venster.fout }, { status: 400 })
  }

  const uitkomst = await haalTrainingen(toegang.admin, toegang.userId, venster.venster)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ trainingen: uitkomst.waarde }, { headers: CACHE_HEADERS })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const nieuw = leesNieuweTraining(body)
  if (!nieuw.ok) {
    return NextResponse.json({ fout: nieuw.fout }, { status: 400 })
  }

  const uitkomst = await maakTraining(toegang.admin, toegang.userId, nieuw.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ training: uitkomst.waarde }, { status: 201 })
}
