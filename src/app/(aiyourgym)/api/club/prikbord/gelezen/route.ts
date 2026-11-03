// POST /api/club/prikbord/gelezen: een mededeling gelezen, of "Gelezen en begrepen".
// Body: { mededelingId, bevestig? }. Zien op het Prikbord is genoeg (rollen/api.ts).
// Alleen voor een mededeling die voor deze persoon is; een vervangen wijziging
// (er is een nieuwere versie van de werkwijze) is niet meer te bevestigen.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { leesGelezen } from '@/lib/club/prikbord/invoer'
import { isVervangen, magBevestigen } from '@/lib/club/prikbord/model'
import { haalMededeling, haalWerkwijzen, markeerGelezen } from '@/lib/club/prikbord/opslag'
import { kijkerVan } from '@/lib/club/prikbord/toegang'
import { leesBody, prikbordFouten, prikbordNiveauFout } from '@/lib/club/prikbord/route-hulp'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const geen = await prikbordNiveauFout(t, 'zien')
  if (geen) return geen
  const fouten = await prikbordFouten()
  const invoer = leesGelezen(await leesBody(req))
  if (!invoer.ok) return clubFout(fouten[invoer.fout], 400)
  const kijker = kijkerVan(t)
  if (!kijker.profielId) return clubFout(fouten.geenProfiel, 409)
  const m = await haalMededeling(t.admin, t.userId, invoer.waarde.mededelingId)
  if (m === undefined) return clubFout(fouten.opslaan, 500)
  if (!m) return clubFout(fouten.nietGevonden, 404)
  const werkwijzen = m.soort === 'wijziging' ? await haalWerkwijzen(t.admin, t.userId) : []
  if (!werkwijzen) return clubFout(fouten.opslaan, 500)
  if (!magBevestigen(m, kijker, werkwijzen, new Date())) {
    return isVervangen(m, werkwijzen) ? clubFout(fouten.vervangen, 409) : clubFout(fouten.nietGevonden, 404)
  }
  const ok = await markeerGelezen(t.admin, t.userId, m.id, kijker.profielId, invoer.waarde.bevestig && m.verplicht)
  return ok ? clubJson({ ok: true }) : clubFout(fouten.opslaan, 500)
}
