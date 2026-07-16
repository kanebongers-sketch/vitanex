// ─── LifeOS — GET /api/lifeos/vita/signalen ─────────────────────────────────
// Wat Vita nu uit zichzelf zou zeggen. Dit is de proactieve kant: geen vraag,
// geen model, geen wachten. De motor (`src/lib/lifeos/vita/signalen.ts`) is puur
// en deterministisch; deze route doet niets meer dan de data ophalen, de motor
// draaien en het antwoord doorgeven.
//
// Server-side berekend. De browser stuurt geen data mee — ook geen klok. Een
// signaal dat je zelf kunt uitlokken is geen signaal.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalContext, isErIetsGemeten, vakkenMetFout } from '@/lib/lifeos/vita/context'
import { bepaalSignalen, type Signaal } from '@/lib/lifeos/vita/signalen'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface SignalenAntwoord {
  signalen: Signaal[]
  /**
   * Is er überhaupt iets van deze gebruiker gemeten?
   *
   * Dit onderscheidt "ik weet nog niets van je" van "ik weet genoeg, en er is
   * nu niets aan de hand". Zonder dat veld zou de UI die twee als hetzelfde
   * lege lijstje tonen — en dat zijn ze niet.
   */
  gemeten: boolean
  /** Vakken die door een storing ontbreken. Leeg = alles is opgehaald. */
  bronnenMetFout: string[]
}

function fout(melding: string, status: number): Response {
  return Response.json({ fout: melding }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(request: NextRequest): Promise<Response> {
  const toegang = await vereisLifeosToegang(request)
  if (toegang instanceof NextResponse) return toegang

  const nu = new Date()

  let context: Awaited<ReturnType<typeof haalContext>>
  try {
    context = await haalContext(toegang.userId, toegang.admin, nu)
  } catch {
    return fout('Kon je gegevens niet ophalen.', 503)
  }

  // Viel álle data weg, dan weten we niets — en "niets weten door een storing"
  // is een fout, geen leeg dashboard. De UI moet dit als storing tonen, niet
  // als "ik heb nog niets van je gemeten".
  const dataVakken = [context.herstel, context.agendaVandaag, context.taken]
  if (dataVakken.every((vak) => !vak.ok)) {
    return fout('Kon je gegevens niet ophalen.', 503)
  }

  // Een deels gevallen vak levert geen half signaal op: de motor krijgt alleen
  // wat er écht is, en elke regel heeft positief bewijs nodig om te vuren. Wat
  // ontbreekt, meldt de UI apart via `bronnenMetFout`.
  const antwoord: SignalenAntwoord = {
    signalen: bepaalSignalen({
      herstel: context.herstel.ok ? context.herstel.waarde : [],
      agendaVandaag: context.agendaVandaag.ok ? context.agendaVandaag.waarde : [],
      taken: context.taken.ok ? context.taken.waarde : [],
      nu,
    }),
    gemeten: isErIetsGemeten(context),
    bronnenMetFout: vakkenMetFout(context),
  }

  return Response.json(antwoord, {
    headers: {
      // Persoonlijke data: nooit in een gedeelde cache. `Vary: Authorization`
      // voorkomt dat de browsercache een antwoord tussen sessies hergebruikt.
      'Cache-Control': 'private, no-store',
      Vary: 'Authorization',
    },
  })
}
