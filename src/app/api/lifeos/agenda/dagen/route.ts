// GET /api/lifeos/agenda/dagen — meerdere dagen tegelijk (default 3), voor de
// meerdaagse ("3 dagen") weergave à la Google Calendar.
//
// Leest de cache, niet Google — net als /vandaag. De sync vult `agenda_events`
// met vandaag t/m +7 dagen (zie sync/route.ts), dus voor 3 dagen lezen we gewoon
// een breder venster uit dezelfde cache en groeperen we per (lokale) startdag.
// Eén dag zonder afspraken is een lege lijst, geen fout.
//
// `?aantal=3` (default 3, geklemd 1–7). Verder vooruit dan de sync-horizon (7)
// heeft geen zin: dan zou een dag leeg lijken omdat niemand 'm ophaalde.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { koppelingStaat } from '@/lib/lifeos/agenda/koppeling'
import { haalEventsUitCache, laatsteSync } from '@/lib/lifeos/agenda/opslag'
import { datumSleutel } from '@/lib/lifeos/datum/datum'
import {
  groepeerAfsprakenPerDag,
  naarAfspraakJson,
  type AgendaDagen,
} from '@/lib/lifeos/agenda/agenda'

// Zelfde cache-strategie als /vandaag: `private` (jouw dag, geen CDN-materiaal),
// `Vary: Authorization` zodat een gedeelde cache nooit de dag van de ene
// gebruiker aan de andere serveert. De client bust de 60s met `no-store` bij een
// geforceerde herlaad (na re-sync/toevoegen) — zelfde patroon als /vandaag.
const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=60',
  Vary: 'Authorization',
} as const

const STANDAARD_AANTAL = 3
const MIN_AANTAL = 1
/** De sync-horizon is 7 dagen; verder lezen zou lege dagen tonen die niemand ophaalde. */
const MAX_AANTAL = 7

/** `?aantal=` → een geklemd geheel getal, met de standaard bij onzin of ontbreken. */
function leesAantal(ruw: string | null): number {
  if (ruw === null) return STANDAARD_AANTAL
  const n = Number.parseInt(ruw, 10)
  if (!Number.isFinite(n)) return STANDAARD_AANTAL
  return Math.min(MAX_AANTAL, Math.max(MIN_AANTAL, n))
}

/** De `aantal` opeenvolgende dagsleutels vanaf `van` (lokale dagen). */
function bouwDagSleutels(van: Date, aantal: number): string[] {
  const sleutels: string[] = []
  for (let i = 0; i < aantal; i++) {
    const d = new Date(van)
    d.setDate(d.getDate() + i)
    sleutels.push(datumSleutel(d))
  }
  return sleutels
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const aantal = leesAantal(req.nextUrl.searchParams.get('aantal'))

  const staat = await koppelingStaat(toegang.admin, toegang.userId)
  if (staat.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon de koppeling niet lezen.' }, { status: 502 })
  }
  if (staat.staat === 'niet_gekoppeld') {
    // Eigen tak, geen lege lijst: "niet gekoppeld" is geen "geen afspraken".
    const antwoord: AgendaDagen = { gekoppeld: false }
    return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
  }

  const van = new Date()
  van.setHours(0, 0, 0, 0)
  const tot = new Date(van)
  tot.setDate(tot.getDate() + aantal)

  const [events, sync] = await Promise.all([
    haalEventsUitCache(toegang.admin, toegang.userId, van, tot),
    laatsteSync(toegang.admin, toegang.userId),
  ])

  if (!events.ok || !sync.ok) {
    return NextResponse.json({ fout: 'Kon je agenda niet lezen.' }, { status: 502 })
  }

  const dagen = groepeerAfsprakenPerDag(
    events.waarde.map(naarAfspraakJson),
    bouwDagSleutels(van, aantal),
  )

  const antwoord: AgendaDagen = {
    gekoppeld: true,
    laatsteSync: sync.waarde,
    dagen,
  }

  return NextResponse.json(antwoord, { headers: CACHE_HEADERS })
}
