// /api/lifeos/pt-gesprekken/verplaatsen | alle coachgesprekken naar "Coachgesprekken PT".
//
//   GET   de voorvertoning: wat er met elke afspraak gebeurt (niets wordt gewijzigd).
//   POST  { sleutels: string[] } voert de aangevinkte voorstellen uit en geeft per
//         afspraak terug of het lukte, en zo niet waarom.
//
// Venster: 18 maanden terug tot 12 maanden vooruit. Alleen de gekozen agenda en
// "Coachgesprekken PT" worden gelezen; alleen de gekozen agenda wordt leeggehaald.
// Auth: de founder-gate uit `@/lib/lifeos/admin` (alleen Kane).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { maakVoorvertoning, VerplaatsFout, voerVerplaatsenUit } from '@/lib/lifeos/pt-gesprek/verplaatsen-google'
import { leesAangevinkt, type Uitvoering } from '@/lib/lifeos/pt-gesprek/verplaatsen'
import { AgendaSchrijfFout } from '@/lib/lifeos/agenda/schrijven'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEEN_CACHE = { 'Cache-Control': 'private, no-store' } as const

/** Een lopende uitvoering tegelijk: een dubbelklik mag niets dubbel doen. */
let bezig = false

function foutAntwoord(fout: unknown): NextResponse {
  if (fout instanceof VerplaatsFout) return NextResponse.json({ fout: fout.message }, { status: fout.status, headers: GEEN_CACHE })
  if (fout instanceof AgendaSchrijfFout && fout.soort === 'niet_gekoppeld') {
    return NextResponse.json({ fout: 'Je Google Agenda is niet gekoppeld. Koppel hem opnieuw.' }, { status: 409, headers: GEEN_CACHE })
  }
  console.error('[verplaatsen] onverwachte fout', fout instanceof Error ? fout.message : fout)
  return NextResponse.json({ fout: 'Kon je agenda niet lezen. Probeer het opnieuw.' }, { status: 502, headers: GEEN_CACHE })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  try {
    const { voorvertoning } = await maakVoorvertoning(toegang.admin, toegang.userId, new Date())
    return NextResponse.json(voorvertoning, { headers: GEEN_CACHE })
  } catch (fout) {
    return foutAntwoord(fout)
  }
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const aangevinkt = leesAangevinkt(await req.json().catch(() => null))
  if (!aangevinkt) return NextResponse.json({ fout: 'Ongeldige keuze.' }, { status: 400, headers: GEEN_CACHE })
  if (aangevinkt.size === 0) return NextResponse.json({ fout: 'Vink minstens een afspraak aan.' }, { status: 400, headers: GEEN_CACHE })
  if (bezig) return NextResponse.json({ fout: 'Er loopt al een verplaatsing. Wacht tot die klaar is.' }, { status: 409, headers: GEEN_CACHE })

  bezig = true
  try {
    const resultaten = await voerVerplaatsenUit(toegang.admin, toegang.userId, aangevinkt, new Date())
    const antwoord: Uitvoering = { resultaten }
    return NextResponse.json(antwoord, { headers: GEEN_CACHE })
  } catch (fout) {
    return foutAntwoord(fout)
  } finally {
    bezig = false
  }
}
