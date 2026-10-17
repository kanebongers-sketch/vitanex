// POST /api/club/agenda: een nieuwe afspraak.
// Body: { vestiging, titel, soort, datum, begin, eind, heleDag?, medewerkerId?, notitie?, herhaalWeken? } (Nederlandse tijd).
// herhaalWeken: 1 tot en met 26 extra keren, elke week op dezelfde kloktijd.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { isGeldigeMedewerker } from '@/lib/club/leads/api'
import { AGENDA_KOLOMMEN, agendaUitRij, herhalingen, leesAgendaInvoer, leesHerhaal } from '@/lib/club/agenda/model'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const body: unknown = await req.json().catch(() => null)
  const invoer = leesAgendaInvoer(body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!hoortBij(t.vestigingen, invoer.waarde.vestiging)) return clubFout('Onbekende vestiging.', 400)
  const a = invoer.waarde
  if (!(await isGeldigeMedewerker(t, a.vestiging, a.medewerkerId))) return clubFout('Deze medewerker werkt niet in deze vestiging.', 400)
  const reeks = herhalingen(a, leesHerhaal(body))
  const { data, error } = await t.admin
    .from('club_agenda')
    .insert(
      reeks.map((x) => ({
        user_id: t.userId, vestiging: x.vestiging, titel: x.titel, soort: x.soort, begin_op: x.beginOp, eind_op: x.eindOp,
        hele_dag: x.heleDag, medewerker_id: x.medewerkerId, notitie: x.notitie, auteur: t.naam,
      })),
    )
    .select(AGENDA_KOLOMMEN)
  const items = error ? [] : (data ?? []).flatMap((r) => agendaUitRij(r) ?? [])
  if (items.length === 0) return clubFout('De afspraak kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  await logActie(t, reeks.length > 1 ? `afspraak gepland (${reeks.length} weken)` : 'afspraak gepland', a.titel, a.vestiging)
  return clubJson({ item: items[0], aantal: items.length }, 201)
}
