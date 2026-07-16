// PATCH  /api/lifeos/training/[id] — afronden, RPE invullen of wissen, corrigeren
// DELETE /api/lifeos/training/[id] — weg ermee
//
// De kernflow is PATCH: een geplande training afronden. `{ gepland: false, rpe: 7 }`
// zet een voornemen om in een meting — en pas dán mag Vita er iets mee.
//
// De omgekeerde weg (een meting terug naar "gepland" zetten terwijl er een RPE
// op staat) wijst de database af met 23514, wat hier een nette 400 wordt. Dat is
// expres geen stille opschoning: de metingen weggooien om de wijziging te laten
// slagen, zou data verwijderen die de gebruiker niet aanwees.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`. Die levert de service-role
// client op het LifeOS-project (`toegang.admin`) en het vaste eigenaar-id
// (`toegang.userId`) waarop alle queries filteren.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesTrainingWijziging } from '@/lib/lifeos/training/training'
import { verwijderTraining, wijzigTraining } from '@/lib/lifeos/training/opslag'
import { foutAntwoord } from '@/lib/lifeos/training/antwoord'

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
  const wijziging = leesTrainingWijziging(body)
  if (!wijziging.ok) {
    return NextResponse.json({ fout: wijziging.fout }, { status: 400 })
  }

  const uitkomst = await wijzigTraining(toegang.admin, toegang.userId, id, wijziging.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ training: uitkomst.waarde })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  const uitkomst = await verwijderTraining(toegang.admin, toegang.userId, id)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return new NextResponse(null, { status: 204 })
}
