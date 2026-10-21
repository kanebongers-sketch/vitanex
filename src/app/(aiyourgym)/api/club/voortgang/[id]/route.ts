// PATCH  /api/club/voortgang/[id]: een losse meting wijzigen (het hele formulier).
// DELETE /api/club/voortgang/[id]: een losse meting verwijderen. Mag: het zijn
//        eigen metingen van de sportschool, geen intake.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { medewerkerBestaat } from '@/lib/club/kern/medewerker'
import { lidVestiging } from '@/lib/club/training/schrijven'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { leesMetingVelden } from '@/lib/club/voortgang/meting'
import { haalMeting, haalVoortgang, verwijderMeting, werkMetingBij } from '@/lib/club/voortgang/data'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  const buiten = await eisVestigingVanRecord(t, 'club_metingen', id)
  if (buiten) return buiten
  const meting = await haalMeting(t.admin, t.userId, id)
  if (!meting) return clubFout('Meting niet gevonden.', 404)

  const body: unknown = await req.json().catch(() => null)
  const invoer = leesMetingVelden(body, dagSleutelNl(new Date()))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!(await medewerkerBestaat(t.admin, t.userId, invoer.waarde.medewerkerId))) return clubFout('Onbekende medewerker.', 400)
  if (!(await werkMetingBij(t.admin, t.userId, meting.id, invoer.waarde))) return clubFout('De wijziging kon niet worden opgeslagen. Probeer het opnieuw.', 500)

  await logActie(t, 'Meting gewijzigd', null, await lidVestiging(t.admin, t.userId, meting.lidId))
  return clubJson({ voortgang: await haalVoortgang(t.admin, t.userId, meting.lidId) })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  const buiten = await eisVestigingVanRecord(t, 'club_metingen', id)
  if (buiten) return buiten
  const meting = await haalMeting(t.admin, t.userId, id)
  if (!meting) return clubFout('Meting niet gevonden.', 404)
  if (!(await verwijderMeting(t.admin, t.userId, meting.id))) return clubFout('De meting kon niet worden verwijderd. Probeer het opnieuw.', 500)

  await logActie(t, 'Meting verwijderd', null, await lidVestiging(t.admin, t.userId, meting.lidId))
  return clubJson({ voortgang: await haalVoortgang(t.admin, t.userId, meting.lidId) })
}
