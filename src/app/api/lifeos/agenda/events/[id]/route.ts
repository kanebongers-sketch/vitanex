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

  try {
    const event = await wijzigAgendaEvent(toegang.admin, toegang.userId, id, patch.waarde)
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

  try {
    await verwijderAgendaEvent(toegang.admin, toegang.userId, id)
    return new NextResponse(null, { status: 204 })
  } catch (fout) {
    const http = schrijfFoutHttp(fout)
    if (http) return NextResponse.json({ fout: http.bericht }, { status: http.status })
    throw fout
  }
}
