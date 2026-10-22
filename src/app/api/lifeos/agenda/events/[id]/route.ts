// PATCH  /api/lifeos/agenda/events/[id] — wijzig een afspraak (titel, tijd, locatie)
// DELETE /api/lifeos/agenda/events/[id] — verwijder een afspraak
//
// `[id]` is het EXTERNE id (Google's event.id), niet de lokale cache-uuid: dat
// is de stabiele sleutel die zowel Google als de cache (via de unieke index)
// aanwijst. schrijven.ts werkt beide bij en gooit `AgendaSchrijfFout` bij elke
// mislukking, zodat een Google-fout nooit als "gelukt" eindigt.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { isCoachgesprekTitel } from '@/lib/lifeos/pt-gesprek/coach-agenda'
import { coachgesprekSchrijfAgenda, metCoachTerugval } from '@/lib/lifeos/pt-gesprek/coach-agenda-ophalen'
import { kalenderVanEvent } from '@/lib/lifeos/agenda/opslag'
import {
  leesEventPatch,
  schrijfFoutHttp,
  verwijderAgendaEvent,
  wijzigAgendaEvent,
} from '@/lib/lifeos/agenda/schrijven'

interface Context {
  // Next 16: params is een Promise. Zie node_modules/next/dist/docs →
  // 01-app/03-api-reference/03-file-conventions/route.md
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params

  const body: unknown = await req.json().catch(() => null)
  const patch = leesEventPatch(body)
  if (!patch.ok) {
    return NextResponse.json({ fout: patch.fout }, { status: 400 })
  }

  // De agenda waar het event echt in staat; onbekend: voor een coachgesprek de
  // agenda "Coachgesprekken PT" (als die bestaat), anders je schrijf-agenda.
  // Staat hij daar niet (404), dan probeert LifeOS de andere agenda een keer.
  const bekend = await kalenderVanEvent(toegang.admin, toegang.userId, id)

  try {
    const wijzig = (kalenderId: string | null) =>
      wijzigAgendaEvent(toegang.admin, toegang.userId, id, patch.waarde, kalenderId)
    const event = bekend
      ? await wijzig(bekend)
      : await metCoachTerugval(
          toegang.admin,
          toegang.userId,
          isCoachgesprekTitel(patch.waarde.titel)
            ? await coachgesprekSchrijfAgenda(toegang.admin, toegang.userId)
            : await leesGekozenKalender(toegang.admin, toegang.userId),
          wijzig,
        )
    return NextResponse.json({ event })
  } catch (fout) {
    const http = schrijfFoutHttp(fout)
    if (http) return NextResponse.json({ fout: http.bericht }, { status: http.status })
    throw fout
  }
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params

  // De agenda waar het event echt in staat; onbekend: je schrijf-agenda, en bij een
  // 404 daar een keer de agenda "Coachgesprekken PT" (als die bestaat).
  const bekend = await kalenderVanEvent(toegang.admin, toegang.userId, id)

  try {
    const verwijder = (kalenderId: string | null) => verwijderAgendaEvent(toegang.admin, toegang.userId, id, kalenderId)
    if (bekend) await verwijder(bekend)
    else await metCoachTerugval(toegang.admin, toegang.userId, await leesGekozenKalender(toegang.admin, toegang.userId), verwijder)
    return new NextResponse(null, { status: 204 })
  } catch (fout) {
    const http = schrijfFoutHttp(fout)
    if (http) return NextResponse.json({ fout: http.bericht }, { status: http.status })
    throw fout
  }
}
