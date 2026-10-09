// GET /api/lifeos/pt-coaching/<id>/pdf — één coachgesprek-verslag als pdf.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`. De naam komt server-side uit
// het CRM (via de persoon van de evaluatie), niet uit de url.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import { haalEvaluatie } from '@/lib/lifeos/pt-coaching/opslag'
import { maakVerslagPdf, verslagBestandsnaam } from '@/lib/lifeos/pt-coaching/pdf'
import { isUuid } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  // Next 16: params is een Promise (zie notities/[id]/route.ts).
  params: Promise<{ id: string }>
}

export async function GET(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  if (!isUuid(id)) return NextResponse.json({ fout: 'Dit verslag bestaat niet.' }, { status: 404 })
  const evaluatie = await haalEvaluatie(toegang.admin, toegang.userId, id)
  if (!evaluatie.ok) return NextResponse.json({ fout: 'Kon het verslag niet lezen.' }, { status: 502 })
  if (!evaluatie.waarde) return NextResponse.json({ fout: 'Dit verslag bestaat niet.' }, { status: 404 })

  const personen = await haalPersonen(toegang.admin, toegang.userId, 'pt_team')
  const naam = personen.ok ? personen.waarde.find((p) => p.id === evaluatie.waarde?.persoonId)?.naam : undefined

  const ev = evaluatie.waarde
  const op = new Date(ev.aangemaaktOp)
  try {
    const pdf = await maakVerslagPdf({
      naam: naam ?? 'PT-teamlid',
      op,
      scores: ev.scores,
      notitie: ev.notitie,
      aandachtspunt: ev.aandachtspunt,
    })
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${verslagBestandsnaam(naam ?? 'PT', op)}"`,
        'Cache-Control': 'private, no-store',
        Vary: 'Authorization',
      },
    })
  } catch (oorzaak) {
    console.error('[coach-verslag] pdf maken mislukt', oorzaak)
    return NextResponse.json({ fout: 'Kon de pdf niet maken.' }, { status: 500 })
  }
}
