// POST /api/lifeos/agenda/kalender — kies in welke Google-agenda LifeOS
// schrijft en leest.
//
// Body: `{ kalenderId: string }` (de agenda-id uit `GET /agenda/kalenders`). De
// keuze landt in `koppelingen.kalender_id`; vanaf dan gebruiken lezen (sync) en
// schrijven (events/focusblok) die agenda. Valideer op de systeemgrens: een lege
// of te lange id wordt geweigerd vóór we de database raken.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { koppelingStaat, zetGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { leesKalenderKeuze } from '@/lib/lifeos/agenda/google'

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  // Valideer op de grens, vóór we de database raken.
  const body: unknown = await req.json().catch(() => null)
  const keuze = leesKalenderKeuze(body)
  if (!keuze.ok) {
    return NextResponse.json({ fout: keuze.fout }, { status: 400 })
  }

  // Een keuze zetten zonder koppeling is zinloos: `zetGekozenKalender` zou een
  // niet-bestaande rij bijwerken (0 rijen) en tóch "gelukt" melden. Eerst checken.
  const staat = await koppelingStaat(toegang.admin, toegang.userId)
  if (staat.staat === 'fout') {
    return NextResponse.json({ fout: 'Kon de koppeling niet lezen.' }, { status: 502 })
  }
  if (staat.staat === 'niet_gekoppeld') {
    return NextResponse.json({ fout: 'Je agenda is niet gekoppeld.' }, { status: 409 })
  }

  const bewaard = await zetGekozenKalender(toegang.admin, toegang.userId, keuze.waarde)
  if (!bewaard.ok) {
    return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
