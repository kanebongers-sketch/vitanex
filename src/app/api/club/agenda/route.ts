// POST /api/club/agenda: een nieuwe afspraak.
// Body: { vestiging, titel, soort, datum, begin, eind, heleDag?, medewerkerId?, notitie? } (Nederlandse tijd).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { isGeldigeMedewerker } from '@/lib/club/leads/api'
import { AGENDA_KOLOMMEN, agendaUitRij, leesAgendaInvoer } from '@/lib/club/agenda/model'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesAgendaInvoer(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const a = invoer.waarde
  if (!(await isGeldigeMedewerker(t, a.vestiging, a.medewerkerId))) return clubFout('Deze medewerker werkt niet in deze vestiging.', 400)
  const { data, error } = await t.admin
    .from('club_agenda')
    .insert({
      user_id: t.userId, vestiging: a.vestiging, titel: a.titel, soort: a.soort, begin_op: a.beginOp, eind_op: a.eindOp,
      hele_dag: a.heleDag, medewerker_id: a.medewerkerId, notitie: a.notitie, auteur: t.naam,
    })
    .select(AGENDA_KOLOMMEN)
    .single()
  const item = error ? null : agendaUitRij(data)
  if (!item) return clubFout('De afspraak kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  await logActie(t, 'afspraak gepland', item.titel, item.vestiging)
  return clubJson({ item }, 201)
}
