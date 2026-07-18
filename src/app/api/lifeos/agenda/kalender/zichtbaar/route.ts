// POST /api/lifeos/agenda/kalender/zichtbaar — zet één agenda aan of uit in de
// weergave (het vinkje).
//
// Body: `{ kalenderId: string, zichtbaar: boolean }`. Dit is de WEERGAVE-voorkeur,
// niet het schrijf-doel: `POST /agenda/kalender` (zonder /zichtbaar) kiest waar
// nieuwe afspraken heen gaan. Na een wijziging hoort de client opnieuw te syncen
// zodat het rooster de nieuwe selectie toont.
//
// Valideer op de systeemgrens: een lege id of een niet-boolean zichtbaar wordt
// geweigerd vóór we de database raken.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { koppelingStaat } from '@/lib/lifeos/agenda/koppeling'
import { leesZichtbaarKeuze } from '@/lib/lifeos/agenda/google'
import { zetZichtbaar } from '@/lib/lifeos/agenda/kalenders'

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  // Valideer op de grens, vóór we de database raken.
  const body: unknown = await req.json().catch(() => null)
  const keuze = leesZichtbaarKeuze(body)
  if (!keuze.ok) {
    return NextResponse.json({ fout: keuze.fout }, { status: 400 })
  }

  // Zichtbaarheid zetten zonder koppeling is zinloos: er zijn dan geen agenda's om
  // te tonen of te verbergen. Eerst checken, net als de schrijf-doel-route.
  const staat = await koppelingStaat(toegang.admin, toegang.userId)
  if (staat.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon de koppeling niet lezen.' }, { status: 502 })
  }
  if (staat.staat === 'niet_gekoppeld') {
    return NextResponse.json({ fout: 'Je agenda is niet gekoppeld.' }, { status: 409 })
  }

  const bewaard = await zetZichtbaar(toegang.admin, toegang.userId, keuze.kalenderId, keuze.zichtbaar)
  if (!bewaard.ok) {
    return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
