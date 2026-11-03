// PATCH /api/club/prikbord/werkwijzen/[id]: een werkwijze wijzigen.
// - { stappen, watAnders?, belangrijk? }: een nieuwe versie. Met belangrijk
//   maakt Club een verplichte mededeling voor de doelgroep van de werkwijze.
// - { titel?, vestigingen?, rollen?, takenlijstId?, gearchiveerd? }: de gegevens.
// Vraagt het niveau beheren op het Prikbord.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'
import { leesWerkwijzeWijziging } from '@/lib/club/prikbord/invoer'
import { nieuweVersie } from '@/lib/club/prikbord/model'
import { bewaarNieuweVersie, haalWerkwijzen, takenlijstBestaat, wijzigWerkwijze } from '@/lib/club/prikbord/opslag'
import { profielIdVan } from '@/lib/club/prikbord/toegang'
import { leesBody, schrijverVan, prikbordNiveauFout } from '@/lib/club/prikbord/route-hulp'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const geen = await prikbordNiveauFout(t, 'beheren')
  if (geen) return geen
  const tekst = await clubTekst(PRIKBORD)
  const fouten = tekst.fouten
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout(fouten.nietGevonden, 404)
  const invoer = leesWerkwijzeWijziging(await leesBody(req), schrijverVan(t))
  if (!invoer.ok) return clubFout(fouten[invoer.fout], 400)

  if (invoer.waarde.soort === 'meta') {
    const meta = invoer.waarde.meta
    if (meta.takenlijstId && !(await takenlijstBestaat(t.admin, t.userId, meta.takenlijstId))) return clubFout(fouten.takenlijst, 400)
    const gelukt = await wijzigWerkwijze(t.admin, t.userId, id, meta)
    if (gelukt === null) return clubFout(fouten.opslaan, 500)
    return gelukt ? clubJson({ ok: true }) : clubFout(fouten.nietGevonden, 404)
  }

  const werkwijzen = await haalWerkwijzen(t.admin, t.userId)
  if (!werkwijzen) return clubFout(fouten.opslaan, 500)
  const w = werkwijzen.find((x) => x.id === id && !x.gearchiveerd)
  if (!w) return clubFout(fouten.nietGevonden, 404)
  const v = nieuweVersie(w, invoer.waarde.versie, tekst.wijzigingTitel)
  if (!v) return clubFout(fouten.watAnders, 400)
  const uitkomst = await bewaarNieuweVersie(t.admin, t.userId, w, v, profielIdVan(t))
  if (uitkomst === 'oud') return clubFout(fouten.oudeVersie, 409)
  if (uitkomst === 'fout') return clubFout(fouten.opslaan, 500)
  await logActie(t, 'werkwijze nieuwe versie', `${w.titel} (${v.versie})`, null)
  return clubJson({ versie: v.versie })
}
