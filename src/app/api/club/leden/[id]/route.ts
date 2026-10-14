import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam } from '@/lib/club/kern/lid'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { leesLidWijziging } from '@/lib/club/leden/invoer'

// PATCH /api/club/leden/[id]  { coachId?: uuid | null, tags?: string[] }
// Alleen wat in onze software hoort: coach en tags. Contact, abonnement en
// status komen uit Sportivity.

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const wijziging = leesLidWijziging(await req.json().catch(() => null))
  if (!wijziging.ok) return clubFout(wijziging.fout, 400)
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid) return clubFout('Dit lid bestaat niet (meer).', 404)

  const { coachId, tags } = wijziging.waarde
  let coachNaam: string | null = null
  if (coachId) {
    const trainers = await haalMedewerkers(t.admin, t.userId, lid.vestiging, 'trainer')
    const coach = trainers?.find((m) => m.id === coachId)
    if (!coach) return clubFout('Deze coach werkt niet als trainer in deze vestiging.', 400)
    coachNaam = coach.naam
  }

  const update = {
    ...(coachId !== undefined ? { coach_id: coachId } : {}),
    ...(tags !== undefined ? { tags } : {}),
    bijgewerkt_op: new Date().toISOString(),
  }
  const { error } = await t.admin.from('club_leden').update(update).eq('user_id', t.userId).eq('id', lid.id)
  if (error) {
    console.error('[club] lid bijwerken mislukt', error.message)
    return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  }
  const wat = [
    coachId !== undefined ? `coach ${coachNaam ?? 'geen'}` : null,
    tags !== undefined ? `tags ${tags.join(', ') || 'geen'}` : null,
  ].filter(Boolean).join(', ')
  await logActie(t, 'Lid bijgewerkt', `${volledigeNaam(lid)}: ${wat}`, lid.vestiging)
  return clubJson({ ok: true })
}
