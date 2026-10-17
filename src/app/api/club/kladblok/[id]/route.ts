// PATCH  /api/club/kladblok/[id]: titel, inhoud, map, vestiging, vastpinnen of archiveren.
// DELETE /api/club/kladblok/[id]: definitief weg (alleen vanuit het archief in de app).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { isUuid } from '@/lib/lifeos/leads/toegang'
import { KLAD_KOLOMMEN, kladUitRij, leesKladWijziging } from '@/lib/club/kladblok/model'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Notitie niet gevonden.', 404)
  const invoer = leesKladWijziging(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (invoer.waarde.vestiging != null && !hoortBij(t.vestigingen, invoer.waarde.vestiging)) return clubFout('Onbekende vestiging.', 400)
  const w = invoer.waarde
  const { data, error } = await t.admin
    .from('club_kladblok')
    .update({ ...w, bijgewerkt_op: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', t.userId)
    .select(KLAD_KOLOMMEN)
    .maybeSingle()
  if (error) return clubFout('Opslaan mislukt. Probeer het opnieuw.', 500)
  const notitie = kladUitRij(data)
  if (!notitie) return clubFout('Notitie niet gevonden.', 404)
  return clubJson({ notitie })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Notitie niet gevonden.', 404)
  const { data, error } = await t.admin.from('club_kladblok').delete().eq('id', id).eq('user_id', t.userId).select('titel, vestiging')
  if (error) return clubFout('Verwijderen mislukt. Probeer het opnieuw.', 500)
  const rij = (data ?? [])[0] as { titel: string; vestiging: string | null } | undefined
  if (!rij) return clubFout('Notitie niet gevonden.', 404)
  await logActie(t, 'notitie verwijderd', rij.titel, rij.vestiging)
  return clubJson({ ok: true })
}
