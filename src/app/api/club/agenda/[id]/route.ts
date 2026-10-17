// PATCH  /api/club/agenda/[id]: een afspraak wijzigen (zelfde body als POST).
// DELETE /api/club/agenda/[id]: een afspraak verwijderen.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { isUuid } from '@/lib/lifeos/leads/toegang'
import { isGeldigeMedewerker } from '@/lib/club/leads/api'
import { AGENDA_KOLOMMEN, agendaUitRij, leesAgendaInvoer } from '@/lib/club/agenda/model'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Afspraak niet gevonden.', 404)
  const invoer = leesAgendaInvoer(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!hoortBij(t.vestigingen, invoer.waarde.vestiging)) return clubFout('Onbekende vestiging.', 400)
  const a = invoer.waarde
  if (!(await isGeldigeMedewerker(t, a.vestiging, a.medewerkerId))) return clubFout('Deze medewerker werkt niet in deze vestiging.', 400)
  const { data, error } = await t.admin
    .from('club_agenda')
    .update({
      vestiging: a.vestiging, titel: a.titel, soort: a.soort, begin_op: a.beginOp, eind_op: a.eindOp,
      hele_dag: a.heleDag, medewerker_id: a.medewerkerId, notitie: a.notitie,
    })
    .eq('id', id)
    .eq('user_id', t.userId)
    .select(AGENDA_KOLOMMEN)
    .maybeSingle()
  if (error) return clubFout('Opslaan mislukt. Probeer het opnieuw.', 500)
  const item = agendaUitRij(data)
  if (!item) return clubFout('Afspraak niet gevonden.', 404)
  return clubJson({ item })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Afspraak niet gevonden.', 404)
  const { data, error } = await t.admin.from('club_agenda').delete().eq('id', id).eq('user_id', t.userId).select('titel, vestiging')
  if (error) return clubFout('Verwijderen mislukt. Probeer het opnieuw.', 500)
  const rij = (data ?? [])[0] as { titel: string; vestiging: string } | undefined
  if (!rij) return clubFout('Afspraak niet gevonden.', 404)
  await logActie(t, 'afspraak verwijderd', rij.titel, rij.vestiging)
  return clubJson({ ok: true })
}
