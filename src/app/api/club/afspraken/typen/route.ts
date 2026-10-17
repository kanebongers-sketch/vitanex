// POST /api/club/afspraken/typen: een nieuw soort afspraak voor deze sportschool.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesType } from '@/lib/club/afspraken/invoer'
import { haalTypen, maakType } from '@/lib/club/afspraken/opslag'
import { leesJson } from '@/lib/club/afspraken/api'
import { medewerkersHoren } from '@/lib/club/afspraken/typen-api'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesType(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!(await medewerkersHoren(t, invoer.waarde.medewerkerIds))) return clubFout('Een van de medewerkers hoort niet bij deze sportschool.', 400)
  const bestaand = await haalTypen(t.admin, t.userId)
  if (!bestaand) return clubFout('De typen konden niet worden geladen.', 500)
  if (bestaand.some((b) => b.naam.toLowerCase() === invoer.waarde.naam.toLowerCase())) return clubFout('Er is al een type met deze naam.', 409)
  const volgorde = bestaand.reduce((m, b) => Math.max(m, b.volgorde), 0) + 1
  const type = await maakType(t.admin, t.userId, invoer.waarde, volgorde)
  if (!type) return clubFout('Het type kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  await logActie(t, 'afspraaktype aangemaakt', type.naam, null)
  return clubJson({ type }, 201)
}
