import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesVestigingWijziging } from '@/lib/club/instellingen/vestigingen-invoer'
import { wijzigVestiging } from '@/lib/club/instellingen/vestigingen-opslag'

// PATCH /api/club/vestigingen/[sleutel]  { naam?, adres?, standaard?: true, verplaats?: -1 | 1 }
// Verwijderen kan niet: leden, lessen en diensten verwijzen naar de vestiging.

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sleutel: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { sleutel } = await params
  const invoer = leesVestigingWijziging(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const uit = await wijzigVestiging(t, sleutel, invoer.waarde)
  if (!uit.ok) return clubFout(uit.fout, uit.status)
  await logActie(t, 'Vestiging gewijzigd', invoer.waarde.naam ?? null, sleutel)
  return clubJson({ ok: true })
}
