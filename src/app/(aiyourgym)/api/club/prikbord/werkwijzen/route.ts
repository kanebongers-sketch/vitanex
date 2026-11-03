// POST /api/club/prikbord/werkwijzen: een nieuwe werkwijze (versie 1).
// Body: { voorbeeld, vestigingen?, rollen? } (een gekozen voorbeeld, nooit
// automatisch), { notitieId } ("Maak er een werkwijze van") of
// { titel, werkwijzeSoort?, vestigingen?, rollen?, stappen, takenlijstId? }.
// Vraagt het niveau beheren op het Prikbord.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, type ClubToegang, vereisClubToegang } from '@/lib/club/toegang'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { PRIKBORD } from '@/lib/aiyourgym/taal/woorden/club/prikbord'
import { leesWerkwijze, type WerkwijzeInvoer } from '@/lib/club/prikbord/invoer'
import { stappenUitTekst } from '@/lib/club/prikbord/model'
import { haalNotitie, maakWerkwijze, takenlijstBestaat, type NieuweWerkwijze } from '@/lib/club/prikbord/opslag'
import { profielIdVan } from '@/lib/club/prikbord/toegang'
import { GRENZEN } from '@/lib/club/prikbord/typen'
import { leesBody, schrijverVan, prikbordNiveauFout } from '@/lib/club/prikbord/route-hulp'

type Tekst = (typeof PRIKBORD)['nl']
type Fout = keyof Tekst['fouten']

/** Van de invoer naar een werkwijze om op te slaan, of een foutsleutel. */
async function bouw(t: ClubToegang, w: WerkwijzeInvoer, tekst: Tekst): Promise<NieuweWerkwijze | Fout> {
  if (w.soort === 'voorbeeld') {
    const v = tekst.voorbeelden[w.voorbeeld]
    return { titel: v.titel, soort: w.voorbeeld, vestigingen: w.vestigingen, rollen: w.rollen, stappen: v.stappen.map((s) => ({ tekst: s.tekst, uitleg: s.uitleg })), takenlijstId: null, bronNotitieId: null }
  }
  if (w.soort === 'notitie') {
    const n = await haalNotitie(t.admin, t.userId, w.notitieId)
    if (!n) return 'nietGevonden'
    const stappen = stappenUitTekst(n.inhoud, GRENZEN.stappen)
    if (stappen.length === 0) return 'stappen'
    return { titel: n.titel.slice(0, GRENZEN.titel), soort: 'eigen', vestigingen: [], rollen: [], stappen, takenlijstId: null, bronNotitieId: w.notitieId }
  }
  if (w.takenlijstId && !(await takenlijstBestaat(t.admin, t.userId, w.takenlijstId))) return 'takenlijst'
  return { titel: w.titel, soort: w.werkwijzeSoort, vestigingen: w.vestigingen, rollen: w.rollen, stappen: w.stappen, takenlijstId: w.takenlijstId, bronNotitieId: null }
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const geen = await prikbordNiveauFout(t, 'beheren')
  if (geen) return geen
  const tekst = await clubTekst(PRIKBORD)
  const invoer = leesWerkwijze(await leesBody(req), schrijverVan(t))
  if (!invoer.ok) return clubFout(tekst.fouten[invoer.fout], 400)
  const nieuw = await bouw(t, invoer.waarde, tekst)
  if (typeof nieuw === 'string') return clubFout(tekst.fouten[nieuw], nieuw === 'nietGevonden' ? 404 : 400)
  const id = await maakWerkwijze(t.admin, t.userId, nieuw, profielIdVan(t))
  if (!id) return clubFout(tekst.fouten.opslaan, 500)
  await logActie(t, 'werkwijze gemaakt', nieuw.titel, null)
  return clubJson({ id }, 201)
}
