// PATCH /api/club/automatisering/taken/[id]  { actie: 'gedaan' | 'overgeslagen' | 'heropen' | 'notitie', notitie? }
// Een opvolgtaak afhandelen of een notitie erbij zetten. Wie en wanneer legt de server vast.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { REGEL_DEFINITIES, isUuid } from '@/lib/club/automatisering/regels'
import { actieNaarWijziging, leesTaakActie } from '@/lib/club/automatisering/taken'
import { werkTaakBij } from '@/lib/club/automatisering/opslag'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze taak bestaat niet.', 404)

  const invoer = leesTaakActie(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const uit = await werkTaakBij(t.admin, t.userId, id, actieNaarWijziging(invoer.waarde, t.naam, new Date()))
  if (uit.soort === 'niet_gevonden') return clubFout('Deze taak bestaat niet (meer).', 404)
  if (uit.soort === 'fout') return clubFout('De taak kon niet worden opgeslagen. Probeer het opnieuw.', 500)

  if (invoer.waarde.soort !== 'notitie') {
    const naam = uit.taak.lid ? `${uit.taak.lid.voornaam} ${uit.taak.lid.achternaam}`.trim() : null
    await logActie(t, `opvolgen ${invoer.waarde.soort}: ${REGEL_DEFINITIES[uit.taak.regel].titel.toLowerCase()}`, naam, uit.taak.vestiging)
  }
  return clubJson({ taak: uit.taak })
}
