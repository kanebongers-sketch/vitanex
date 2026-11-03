// PATCH /api/club/prikbord/mededelingen/[id]: archiveren of terugzetten. Body: { gearchiveerd }.
// Vraagt het niveau bewerken op het Prikbord.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesMededelingWijziging } from '@/lib/club/prikbord/invoer'
import { archiveerMededeling } from '@/lib/club/prikbord/opslag'
import { leesBody, prikbordFouten, prikbordNiveauFout } from '@/lib/club/prikbord/route-hulp'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const geen = await prikbordNiveauFout(t, 'bewerken')
  if (geen) return geen
  const fouten = await prikbordFouten()
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout(fouten.nietGevonden, 404)
  const invoer = leesMededelingWijziging(await leesBody(req))
  if (!invoer.ok) return clubFout(fouten[invoer.fout], 400)
  const gelukt = await archiveerMededeling(t.admin, t.userId, id, invoer.waarde.gearchiveerd)
  if (gelukt === null) return clubFout(fouten.opslaan, 500)
  if (!gelukt) return clubFout(fouten.nietGevonden, 404)
  return clubJson({ ok: true })
}
