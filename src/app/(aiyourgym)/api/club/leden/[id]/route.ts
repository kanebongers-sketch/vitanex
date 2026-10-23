import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid, LID_STATUS_LABEL, volledigeNaam } from '@/lib/club/kern/lid'
import { haalMedewerkers } from '@/lib/club/kern/medewerker'
import { leesLidWijziging } from '@/lib/club/leden/invoer'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { haalVerwijderverzoek } from '@/lib/club/leden/avg/opslag'

// PATCH /api/club/leden/[id]  { coachId?: uuid | null, tags?: string[], status? }
// Coach, tags en de status (bijvoorbeeld een proeflid dat lid wordt). Contact en
// abonnement komen uit de ledenadministratie (Ledenbestand inlezen). Loopt er
// een verzoek tot verwijderen (AVG), dan blijft de status vast: terugdraaien
// gaat via de privacykaart.

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_leden', id)
  if (buiten) return buiten
  const wijziging = leesLidWijziging(await req.json().catch(() => null))
  if (!wijziging.ok) return clubFout(wijziging.fout, 400)
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid) return clubFout('Dit lid bestaat niet (meer).', 404)

  const { coachId, tags, status } = wijziging.waarde
  if (status !== undefined && status !== lid.status) {
    const verzoek = await haalVerwijderverzoek(t.admin, t.userId, lid.id)
    if (verzoek === undefined) return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
    if (verzoek) return clubFout('Dit lid wordt verwijderd (AVG). Draai dat eerst terug bij Privacy voordat je de status wijzigt.', 409)
  }
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
    ...(status !== undefined ? { status } : {}),
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
    status !== undefined ? `status ${LID_STATUS_LABEL[status].toLowerCase()}` : null,
  ].filter(Boolean).join(', ')
  await logActie(t, 'Lid bijgewerkt', `${volledigeNaam(lid)}: ${wat}`, lid.vestiging)
  return clubJson({ ok: true })
}
