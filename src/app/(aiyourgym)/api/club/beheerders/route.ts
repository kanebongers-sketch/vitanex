// POST /api/club/beheerders  { naam, email, rol }
// Kane of de eigenaar nodigt een eigenaar of clubmanager uit voor de eigen
// sportschool (die nu open staat). Die krijgt een uitnodigingslink om een keer
// een wachtwoord te kiezen; daarna inloggen met e-mailadres en wachtwoord. Een
// clubmanager krijgt een 404.

import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { MAX_BEHEERDERS, ROL_LABEL, leesNieuweBeheerder } from '@/lib/club/beheerders/beheerder'
import { haalBeheerders, maakBeheerder, vindBeheerderOpEmail } from '@/lib/club/beheerders/beheerder-opslag'
import { vindPlatformOpEmail } from '@/lib/club/platform-login/opslag'

export async function POST(req: NextRequest) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  // Fit Factory zelf krijgt nog geen beheerders: Club is geheim tot de presentatie.
  if (t.userId === t.beheerderId) return clubFout('Voor Fit Factory zelf maak je nog geen beheerders aan: Club blijft geheim tot de presentatie.', 400)
  const invoer = leesNieuweBeheerder(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const bestaand = await haalBeheerders(t.admin, t.userId)
  if (!bestaand) return clubFout('De beheerders konden niet worden gelezen. Probeer het opnieuw.', 500)
  if (bestaand.filter((b) => b.actief).length >= MAX_BEHEERDERS) return clubFout(`Maximaal ${MAX_BEHEERDERS} beheerders per sportschool.`, 400)
  // Inloggen gaat op e-mailadres: een adres met een account of een open uitnodiging kan niet nog een keer.
  const email = invoer.waarde.email
  if (bestaand.some((b) => b.actief && b.email === email) || (await vindBeheerderOpEmail(t.admin, email)) || (await vindPlatformOpEmail(t.admin, email))) {
    return clubFout('Met dit e-mailadres is al een account of een uitnodiging.', 409)
  }
  const nieuw = await maakBeheerder(t.admin, t.userId, invoer.waarde)
  if (!nieuw) return clubFout('De beheerder kon niet worden aangemaakt.', 500)
  await logActie(t, `${ROL_LABEL[invoer.waarde.rol]} toegevoegd`, invoer.waarde.naam, null)
  return clubJson({ id: nieuw.id }, 201)
}
