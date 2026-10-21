// POST /api/club/afspraken: een afspraak vanuit de balie of door een trainer.
// Het tijdstip moet vrij zijn (zelfde regels als de vrije tijden); de database
// weigert daarna nog elke overlap, ook als twee mensen tegelijk boeken.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { haalLid, volledigeNaam } from '@/lib/club/kern/lid'
import { nlDelen, nlNaarUtc } from '@/lib/club/rooster/tijd'
import { leesNieuweAfspraak } from '@/lib/club/afspraken/invoer'
import { haalType, maakAfspraak } from '@/lib/club/afspraken/opslag'
import { eindVan } from '@/lib/club/afspraken/regels'
import { controleerTijd, leesJson } from '@/lib/club/afspraken/api'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesNieuweAfspraak(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const n = invoer.waarde
  if (!hoortBij(t.vestigingen, n.vestiging)) return clubFout('Onbekende vestiging.', 400)

  const [type, lid] = await Promise.all([haalType(t.admin, t.userId, n.typeId), haalLid(t.admin, t.userId, n.lidId)])
  if (!type || !type.actief) return clubFout('Dit soort afspraak bestaat niet (meer).', 400)
  if (!lid) return clubFout('Dit lid is niet gevonden.', 400)
  if (n.leadId) {
    const { data, error } = await t.admin.from('club_leads').select('id').eq('user_id', t.userId).eq('id', n.leadId).maybeSingle()
    if (error || !data) return clubFout('Deze lead is niet gevonden.', 400)
  }
  if (nlNaarUtc(n.datum, n.tijd).getTime() < Date.now()) return clubFout('Dit tijdstip is al voorbij.', 400)

  const controle = await controleerTijd(t, { vestiging: n.vestiging, type, datum: n.datum, tijd: n.tijd, medewerkerId: n.medewerkerId, vanaf: null, tot: null })
  if (!controle.ok) return clubFout(controle.fout, controle.status)
  const { eind, bezetTot } = eindVan(controle.start, type)
  const uit = await maakAfspraak(t.admin, t.userId, {
    vestiging: n.vestiging,
    typeId: type.id,
    medewerkerId: controle.medewerkerId,
    lidId: lid.id,
    leadId: n.leadId,
    start: controle.start,
    eind,
    bezetTot,
    notitie: n.notitie,
    geboektDoor: n.geboektDoor,
  })
  if (!uit.ok) return clubFout(uit.fout, uit.status)
  await logActie(t, 'afspraak gemaakt', `${type.naam} met ${volledigeNaam(lid)} op ${nlDelen(controle.start).datum} ${n.tijd}`, n.vestiging)
  return clubJson({ afspraak: uit.waarde }, 201)
}
