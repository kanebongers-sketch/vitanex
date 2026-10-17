// PATCH /api/club/afspraken/typen/[id]: een soort afspraak wijzigen of op
// inactief zetten. Weggooien kan niet: oude afspraken verwijzen ernaar.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { isUuid, leesType } from '@/lib/club/afspraken/invoer'
import { haalTypen, werkTypeBij } from '@/lib/club/afspraken/opslag'
import { leesJson } from '@/lib/club/afspraken/api'
import { medewerkersHoren } from '@/lib/club/afspraken/typen-api'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Type niet gevonden.', 404)
  const invoer = leesType(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!(await medewerkersHoren(t, invoer.waarde.medewerkerIds))) return clubFout('Een van de medewerkers hoort niet bij deze sportschool.', 400)
  const bestaand = await haalTypen(t.admin, t.userId)
  if (!bestaand) return clubFout('De typen konden niet worden geladen.', 500)
  if (!bestaand.some((b) => b.id === id)) return clubFout('Type niet gevonden.', 404)
  if (bestaand.some((b) => b.id !== id && b.naam.toLowerCase() === invoer.waarde.naam.toLowerCase())) return clubFout('Er is al een type met deze naam.', 409)
  const type = await werkTypeBij(t.admin, t.userId, id, invoer.waarde)
  if (!type) return clubFout('Het type kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  await logActie(t, 'afspraaktype gewijzigd', type.naam, null)
  return clubJson({ type })
}
