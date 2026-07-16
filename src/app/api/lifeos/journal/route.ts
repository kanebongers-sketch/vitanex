// GET /api/lifeos/journal?datum=YYYY-MM-DD — de journal van een dag (+ schreef je gisteren?)
// PUT /api/lifeos/journal                   — opslaan; lege tekst = wissen
//
// Vervangt je journal-app. Voor het Avond-moment: "Hoe ging het?" Twee minuten.
//
// PUT en geen POST: dit is idempotent. Auto-save stuurt dezelfde dag tientallen
// keren, en elke keer is de uitkomst "de journal van die dag ís nu dit". Een
// POST zou suggereren dat er elke keer iets bijkomt.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'
import { leesJournalOpslaan, vorigeDagSleutel } from '@/lib/lifeos/journal/journal'
import { haalJournals, schrijfJournal, wisJournal, type Reden } from '@/lib/lifeos/journal/opslag'

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

function foutAntwoord(reden: Reden) {
  if (reden === 'bezet') {
    // De partiële unieke index uit 050 hield twee gelijktijdige schrijvers uit
    // elkaar. `schrijfJournal` vangt dit normaal zelf op met een tweede update;
    // komt het hier tóch, dan is het een echte botsing en geen "je bent niet
    // ingelogd" of "je hebt niets geschreven".
    return NextResponse.json(
      { fout: 'Je journal werd elders net gewijzigd. Laad de pagina opnieuw.' },
      { status: 409 },
    )
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die tekst kan niet opgeslagen worden.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Die journal bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je journal niet opslaan.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const datum = req.nextUrl.searchParams.get('datum')
  if (datum === null || leesDatumSleutel(datum) === null) {
    return NextResponse.json({ fout: 'Geef datum=YYYY-MM-DD mee.' }, { status: 400 })
  }

  const gisteren = vorigeDagSleutel(datum)
  // `gisteren` kan hier niet null zijn (datum is al gevalideerd), maar dat
  // afdwingen met een `!` is een belofte in plaats van een controle.
  const dagen = gisteren === null ? [datum] : [datum, gisteren]

  const uitkomst = await haalJournals(toegang.admin, toegang.userId, dagen)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  const journal = uitkomst.waarde.find((n) => n.datum === datum) ?? null
  const gisterenGeschreven = gisteren !== null && uitkomst.waarde.some((n) => n.datum === gisteren)

  return NextResponse.json({ journal, gisterenGeschreven }, { headers: CACHE_HEADERS })
}

export async function PUT(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const opslaan = leesJournalOpslaan(body)
  if (!opslaan.ok) {
    return NextResponse.json({ fout: opslaan.fout }, { status: 400 })
  }

  // Lege tekst = wissen. Zie `leesJournalOpslaan`: auto-save vuurt ook als je je
  // reflectie weer weghaalt, en dan hoort de rij weg — niet een 400 die de
  // indicator op "mislukt" zet terwijl er niets mis is.
  if (opslaan.waarde.tekst.length === 0) {
    const gewist = await wisJournal(toegang.admin, toegang.userId, opslaan.waarde.datum)
    if (!gewist.ok) return foutAntwoord(gewist.reden)
    return NextResponse.json({ journal: null }, { headers: CACHE_HEADERS })
  }

  const uitkomst = await schrijfJournal(
    toegang.admin,
    toegang.userId,
    opslaan.waarde.datum,
    opslaan.waarde.tekst,
  )
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ journal: uitkomst.waarde }, { headers: CACHE_HEADERS })
}
