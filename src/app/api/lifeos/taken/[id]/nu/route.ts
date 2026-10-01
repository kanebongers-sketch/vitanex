// POST /api/lifeos/taken/[id]/nu — "nu mee bezig": een blok vanaf nu in je
// persoonlijke agenda (zie `blokken/nu.ts`).
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalTaken } from '@/lib/lifeos/taken/opslag'
import { schrijfFoutHttp } from '@/lib/lifeos/agenda/schrijven'
import { startTaakNu } from '@/lib/lifeos/blokken/nu'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  // Next 16: params is een Promise (zie taken/[id]/route.ts).
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  const taken = await haalTaken(toegang.admin, toegang.userId, { alleenOpen: true })
  if (!taken.ok) return NextResponse.json({ fout: 'Kon je taken niet lezen.' }, { status: 502 })
  const taak = taken.waarde.find((t) => t.id === id)
  if (!taak) return NextResponse.json({ fout: 'Deze taak bestaat niet (meer) of is al af.' }, { status: 404 })

  try {
    const blok = await startTaakNu(toegang.admin, toegang.userId, taak)
    return NextResponse.json(blok, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
  } catch (oorzaak) {
    const http = schrijfFoutHttp(oorzaak)
    if (http) return NextResponse.json({ fout: http.bericht }, { status: http.status })
    console.error('[taken/nu] blok zetten mislukt', oorzaak)
    return NextResponse.json({ fout: 'Kon het blok niet in je agenda zetten.' }, { status: 502 })
  }
}
