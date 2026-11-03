// POST /api/club/prikbord/uitvoeringen: een werkwijze uitgevoerd (afgevinkt).
// Body: { werkwijzeId, versie, vestiging, gestartOp?, afgevinkt: number[], notitie?, lidId? }.
// Zien op het Prikbord is genoeg (rollen/api.ts). Alleen een werkwijze die voor
// deze persoon is, in de versie die nu geldt, in een vestiging waar hij werkt.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { leesUitvoering } from '@/lib/club/prikbord/invoer'
import { werkwijzenVoor } from '@/lib/club/prikbord/model'
import { bewaarUitvoering, haalWerkwijzen, lidBestaat } from '@/lib/club/prikbord/opslag'
import { kijkerVan, magPlaatsen } from '@/lib/club/prikbord/toegang'
import { leesBody, prikbordFouten, prikbordNiveauFout } from '@/lib/club/prikbord/route-hulp'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const geen = await prikbordNiveauFout(t, 'zien')
  if (geen) return geen
  const fouten = await prikbordFouten()
  const kijker = kijkerVan(t)
  if (!kijker.profielId) return clubFout(fouten.geenProfiel, 409)
  const invoer = leesUitvoering(await leesBody(req), kijker.vestigingen, new Date())
  if (!invoer.ok) return clubFout(fouten[invoer.fout], 400)
  const u = invoer.waarde
  const werkwijzen = await haalWerkwijzen(t.admin, t.userId)
  if (!werkwijzen) return clubFout(fouten.opslaan, 500)
  const w = werkwijzenVoor(werkwijzen, kijker, magPlaatsen(t)).find((x) => x.id === u.werkwijzeId)
  if (!w) return clubFout(fouten.nietGevonden, 404)
  if (w.versie !== u.versie) return clubFout(fouten.oudeVersie, 409)
  if (u.afgevinkt.some((n) => n >= w.stappen.length)) return clubFout(fouten.afgevinkt, 400)
  if (u.lidId && !(await lidBestaat(t.admin, t.userId, u.lidId))) return clubFout(fouten.nietGevonden, 404)
  const ok = await bewaarUitvoering(t.admin, t.userId, u, kijker.profielId)
  return ok ? clubJson({ ok: true }, 201) : clubFout(fouten.opslaan, 500)
}
