// GET /api/lifeos/pt-coaching/<id>/pdf — één coachgesprek-verslag als pdf.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`. De naam komt server-side uit
// het CRM (via de persoon van de evaluatie), niet uit de url. Het verslag wordt
// compleet opgebouwd — met lead tracker, klanten en voorbereiding — net als de
// pdf die bij het afronden gemaild werd (zie `verslag-bouw.ts`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { isUuid } from '@/lib/lifeos/leads/toegang'
import { bouwVerslag, verslagPdfAntwoord } from '@/lib/lifeos/pt-coaching/verslag-bouw'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  // Next 16: params is een Promise (zie notities/[id]/route.ts).
  params: Promise<{ id: string }>
}

const GEEN_CACHE = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } as const

export async function GET(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  if (!isUuid(id)) return NextResponse.json({ fout: 'Dit verslag bestaat niet.' }, { status: 404 })
  const v = await bouwVerslag(toegang.admin, toegang.userId, id, new Date())
  if (!v.ok) {
    return v.reden === 'niet_gevonden'
      ? NextResponse.json({ fout: 'Dit verslag bestaat niet.' }, { status: 404 })
      : NextResponse.json({ fout: 'Kon het verslag niet lezen.' }, { status: 502 })
  }
  return verslagPdfAntwoord(v.waarde, { inline: false, headers: GEEN_CACHE })
}
