import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam } from '@/lib/club/kern/lid'
import { leesNotitie } from '@/lib/club/leden/invoer'
import { notitieUitRij } from '@/lib/club/leden/rijen'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// POST /api/club/leden/[id]/notities  { tekst, vastgepind? }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_leden', id)
  if (buiten) return buiten
  const invoer = leesNotitie(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid) return clubFout('Dit lid bestaat niet (meer).', 404)

  const { data, error } = await t.admin.from('club_notities')
    .insert({ user_id: t.userId, lid_id: lid.id, auteur: t.naam.slice(0, 80), tekst: invoer.waarde.tekst, vastgepind: invoer.waarde.vastgepind })
    .select('id, tekst, auteur, vastgepind, aangemaakt_op').single()
  const notitie = notitieUitRij(data)
  if (error || !notitie) {
    console.error('[club] notitie opslaan mislukt', error?.message ?? 'geen rij terug')
    return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Notitie toegevoegd', volledigeNaam(lid), lid.vestiging)
  return clubJson({ notitie }, 201)
}
