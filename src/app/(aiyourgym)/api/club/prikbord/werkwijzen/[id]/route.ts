// PATCH /api/club/prikbord/werkwijzen/[id]: een werkwijze wijzigen.
// - { stappen, watAnders?, belangrijk? }: een nieuwe versie. Met belangrijk
//   maakt Club een verplichte mededeling voor de doelgroep van de werkwijze
//   (in een transactie met de versie, migratie 492). Lukte alleen de mededeling
//   niet (zonder migratie 492), dan { versie, meldingMislukt: true }.
// - { meldingOpnieuw: true }: die mededeling voor de huidige versie opnieuw plaatsen.
// - { titel?, vestigingen?, rollen?, takenlijstId?, gearchiveerd? }: de gegevens.
// Vraagt het niveau beheren op het Prikbord.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'
import { leesWerkwijzeWijziging } from '@/lib/club/prikbord/invoer'
import { meldingOpnieuw, nieuweVersie, type NieuweVersieInvoer } from '@/lib/club/prikbord/model'
import { bewaarNieuweVersie, haalWerkwijzen, heeftWijzigingMededeling, plaatsMededeling, takenlijstBestaat, wijzigWerkwijze } from '@/lib/club/prikbord/opslag'
import { profielIdVan } from '@/lib/club/prikbord/toegang'
import { leesBody, schrijverVan, prikbordNiveauFout } from '@/lib/club/prikbord/route-hulp'
import type { Werkwijze } from '@/lib/club/prikbord/typen'

type Tekst = (typeof PRIKBORD)['nl']

interface Context {
  params: Promise<{ id: string }>
}

/** De werkwijze (niet gearchiveerd), of een foutantwoord. */
async function vindWerkwijze(t: ClubToegang, id: string, tekst: Tekst): Promise<Werkwijze | NextResponse> {
  const werkwijzen = await haalWerkwijzen(t.admin, t.userId)
  if (!werkwijzen) return clubFout(tekst.fouten.opslaan, 500)
  return werkwijzen.find((x) => x.id === id && !x.gearchiveerd) ?? clubFout(tekst.fouten.nietGevonden, 404)
}

async function nieuweVersieOpslaan(t: ClubToegang, w: Werkwijze, invoer: NieuweVersieInvoer, tekst: Tekst): Promise<NextResponse> {
  const v = nieuweVersie(w, invoer, tekst.wijzigingTitel)
  if (!v) return clubFout(tekst.fouten.watAnders, 400)
  const uitkomst = await bewaarNieuweVersie(t.admin, t.userId, w, v, profielIdVan(t))
  if (uitkomst === 'oud') return clubFout(tekst.fouten.oudeVersie, 409)
  if (uitkomst === 'fout') return clubFout(tekst.fouten.opslaan, 500)
  await logActie(t, 'werkwijze nieuwe versie', `${w.titel} (${v.versie})`, null)
  return clubJson({ versie: v.versie, meldingMislukt: uitkomst === 'melding' })
}

/** De verplichte mededeling van de huidige versie opnieuw plaatsen (niet dubbel). */
async function meldingOpnieuwPlaatsen(t: ClubToegang, w: Werkwijze, tekst: Tekst): Promise<NextResponse> {
  const m = meldingOpnieuw(w, tekst.wijzigingTitel)
  if (!m) return clubFout(tekst.fouten.watAnders, 400)
  const al = await heeftWijzigingMededeling(t.admin, t.userId, w.id, w.versie)
  if (al === null) return clubFout(tekst.fouten.opslaan, 500)
  if (!al && !(await plaatsMededeling(t.admin, t.userId, m, profielIdVan(t)))) return clubFout(tekst.fouten.opslaan, 500)
  await logActie(t, 'werkwijze melding opnieuw', `${w.titel} (${w.versie})`, null)
  return clubJson({ versie: w.versie, meldingMislukt: false })
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

  const w = await vindWerkwijze(t, id, tekst)
  if (w instanceof NextResponse) return w
  if (invoer.waarde.soort === 'melding') return meldingOpnieuwPlaatsen(t, w, tekst)
  return nieuweVersieOpslaan(t, w, invoer.waarde.versie, tekst)
}
