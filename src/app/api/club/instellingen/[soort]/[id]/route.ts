import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { leesVestiging } from '@/lib/club/instellingen/validatie'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { isInstellingSoort, wijzigItem } from '@/lib/club/instellingen/opslag'

// PATCH /api/club/instellingen/[soort]/[id]  { vestiging, ...alleen de velden die veranderen }
// Uitzetten gaat met { actief: false }; verwijderen bestaat niet (historie blijft kloppen).

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ soort: string; id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { soort, id } = await params
  if (!isInstellingSoort(soort) || !isUuid(id)) return clubFout('Niet gevonden.', 404)
  // Een ingelogde medewerker past zijn eigen rollen en vestigingen niet aan (anders geeft hij zichzelf meer rechten).
  if (soort === 'medewerkers' && t.rol === 'medewerker' && id === t.persoonId) return clubFout('Je eigen rollen en vestigingen past de eigenaar of clubmanager aan.', 403)
  const body = await leesJson(req)
  const vestiging = leesVestiging(body)
  if (!vestiging) return clubFout('Kies een vestiging.', 400)
  if (!hoortBij(t.vestigingen, vestiging)) return clubFout('Onbekende vestiging.', 400)
  // Het schema leest alleen zijn eigen velden; "vestiging" in de body wordt daar genegeerd.
  return alsAntwoord(await wijzigItem(t, soort, id, vestiging, body))
}
