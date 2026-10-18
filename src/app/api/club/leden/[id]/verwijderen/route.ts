import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam, type Lid } from '@/lib/club/kern/lid'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { aanvraagFout, magLidVerwijderen, naamKlopt } from '@/lib/club/leden/avg/verwijderen'
import { draaiVerwijderenTerug, vraagVerwijderenAan } from '@/lib/club/leden/avg/opslag'

// POST   /api/club/leden/[id]/verwijderen  { bevestiging: "<volledige naam>" }
//        Stap 1 (AVG): het lid wordt over 30 dagen definitief verwijderd. Tot
//        dan kan het lid niet inloggen of boeken; de sportschool kan terugdraaien.
// DELETE /api/club/leden/[id]/verwijderen
//        Het verzoek terugdraaien; het lid krijgt zijn oude status terug.
// Alleen Kane en de eigenaar (zie lib/club/leden/avg/verwijderen.ts); anderen een 404.

async function eisLid(req: NextRequest, params: Promise<{ id: string }>): Promise<{ t: ClubToegang; lid: Lid } | NextResponse> {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!magLidVerwijderen(t)) return clubFout('Niet gevonden.', 404)
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_leden', id)
  if (buiten) return buiten
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid) return clubFout('Dit lid bestaat niet (meer).', 404)
  return { t, lid }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gevonden = await eisLid(req, params)
  if (gevonden instanceof NextResponse) return gevonden
  const { t, lid } = gevonden
  const body: unknown = await req.json().catch(() => null)
  const bevestiging = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).bevestiging : null
  if (!naamKlopt(bevestiging, lid)) return clubFout(`Typ de volledige naam "${volledigeNaam(lid)}" om te bevestigen.`, 400)

  const uit = await vraagVerwijderenAan(t.admin, t.userId, lid.id, t.naam)
  if (!uit.ok) {
    const { status, fout } = aanvraagFout(uit.code)
    return clubFout(fout, status)
  }
  // De naam staat hier nog in; bij het definitieve verwijderen haalt de database hem uit het logboek.
  await logActie(t, 'Lid verwijderen aangevraagd (AVG)', volledigeNaam(lid), lid.vestiging)
  return clubJson({ ok: true, definitiefOp: uit.definitiefOp })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gevonden = await eisLid(req, params)
  if (gevonden instanceof NextResponse) return gevonden
  const { t, lid } = gevonden
  const terug = await draaiVerwijderenTerug(t.admin, t.userId, lid.id)
  if (terug === null) return clubFout('Terugdraaien lukte niet. Probeer het opnieuw.', 500)
  if (!terug) return clubFout('Voor dit lid loopt geen verzoek tot verwijderen (meer).', 404)
  await logActie(t, 'Lid verwijderen teruggedraaid', volledigeNaam(lid), lid.vestiging)
  return clubJson({ ok: true })
}
