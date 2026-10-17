// POST /api/club/beheerders  { naam, email?, rol }
// Kane zet een eigenaar of clubmanager klaar voor de sportschool die nu open
// staat. Alleen Kane; anderen krijgen een 404. De link werkt pas als de
// schakelaar CLUB_EIGEN_LOGIN aan staat.

import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisKane } from '@/lib/club/toegang'
import { MAX_BEHEERDERS, ROL_LABEL, leesNieuweBeheerder } from '@/lib/club/beheerders/beheerder'
import { haalBeheerders, maakBeheerder } from '@/lib/club/beheerders/beheerder-opslag'

export async function POST(req: NextRequest) {
  const t = await vereisKane(req)
  if (t instanceof NextResponse) return t
  // Fit Factory zelf krijgt nog geen beheerders: Club is geheim tot de presentatie.
  if (t.userId === t.beheerderId) return clubFout('Voor Fit Factory zelf maak je nog geen beheerders aan: Club blijft geheim tot de presentatie.', 400)
  const invoer = leesNieuweBeheerder(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const bestaand = await haalBeheerders(t.admin, t.userId)
  if (!bestaand) return clubFout('De beheerders konden niet worden gelezen. Probeer het opnieuw.', 500)
  if (bestaand.filter((b) => b.actief).length >= MAX_BEHEERDERS) return clubFout(`Maximaal ${MAX_BEHEERDERS} beheerders per sportschool.`, 400)
  const nieuw = await maakBeheerder(t.admin, t.userId, invoer.waarde)
  if (!nieuw) return clubFout('De beheerder kon niet worden aangemaakt.', 500)
  await logActie(t, `${ROL_LABEL[invoer.waarde.rol]} toegevoegd`, invoer.waarde.naam, null)
  return clubJson({ id: nieuw.id }, 201)
}
