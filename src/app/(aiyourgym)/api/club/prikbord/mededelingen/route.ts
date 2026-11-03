// POST /api/club/prikbord/mededelingen: een mededeling aan het team.
// Body: { titel, inhoud?, vestigingen? (leeg = alle), rollen? (leeg = iedereen), verplicht?, verlooptOp? (jjjj-mm-dd) }.
// Vraagt het niveau bewerken op het Prikbord (eigenaar en clubmanager standaard).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesMededeling } from '@/lib/club/prikbord/invoer'
import { plaatsMededeling } from '@/lib/club/prikbord/opslag'
import { profielIdVan } from '@/lib/club/prikbord/toegang'
import { leesBody, prikbordFouten, schrijverVan, prikbordNiveauFout } from '@/lib/club/prikbord/route-hulp'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const geen = await prikbordNiveauFout(t, 'bewerken')
  if (geen) return geen
  const fouten = await prikbordFouten()
  const invoer = leesMededeling(await leesBody(req), schrijverVan(t), new Date())
  if (!invoer.ok) return clubFout(fouten[invoer.fout], 400)
  const id = await plaatsMededeling(t.admin, t.userId, invoer.waarde, profielIdVan(t))
  if (!id) return clubFout(fouten.opslaan, 500)
  await logActie(t, 'mededeling geplaatst', invoer.waarde.titel, invoer.waarde.vestigingen.length === 1 ? invoer.waarde.vestigingen[0] : null)
  return clubJson({ id }, 201)
}
