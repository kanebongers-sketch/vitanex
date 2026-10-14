import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam } from '@/lib/club/kern/lid'
import { isUuid, leesVastpinnen } from '@/lib/club/leden/invoer'

// PATCH  /api/club/leden/[id]/notities/[notitieId]  { vastgepind }
// DELETE /api/club/leden/[id]/notities/[notitieId]

type Params = { params: Promise<{ id: string; notitieId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id, notitieId } = await params
  if (!isUuid(id) || !isUuid(notitieId)) return clubFout('Niet gevonden.', 404)
  const invoer = leesVastpinnen(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const { data, error } = await t.admin.from('club_notities').update({ vastgepind: invoer.waarde })
    .eq('user_id', t.userId).eq('lid_id', id).eq('id', notitieId).select('id')
  if (error) {
    console.error('[club] notitie vastpinnen mislukt', error.message)
    return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  }
  if (!data?.length) return clubFout('Deze notitie bestaat niet (meer).', 404)
  return clubJson({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id, notitieId } = await params
  if (!isUuid(id) || !isUuid(notitieId)) return clubFout('Niet gevonden.', 404)
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid) return clubFout('Dit lid bestaat niet (meer).', 404)
  const { data, error } = await t.admin.from('club_notities').delete()
    .eq('user_id', t.userId).eq('lid_id', id).eq('id', notitieId).select('id')
  if (error) {
    console.error('[club] notitie verwijderen mislukt', error.message)
    return clubFout('Verwijderen lukte niet. Probeer het opnieuw.', 500)
  }
  if (!data?.length) return clubFout('Deze notitie bestaat niet (meer).', 404)
  await logActie(t, 'Notitie verwijderd', volledigeNaam(lid), lid.vestiging)
  return clubJson({ ok: true })
}
