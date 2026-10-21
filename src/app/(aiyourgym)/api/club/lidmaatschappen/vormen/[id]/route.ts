import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { leesVorm } from '@/lib/club/lidmaatschappen/invoer'
import { verwijderVorm, wijzigVorm } from '@/lib/club/lidmaatschappen/opslag'

// PATCH  /api/club/lidmaatschappen/vormen/[id]  de hele vorm opnieuw (zelfde velden als POST)
// DELETE /api/club/lidmaatschappen/vormen/[id]  de vorm weg; het abonnement bij de leden blijft

const WEG = 'Deze lidmaatschapsvorm bestaat niet.'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout(WEG, 404)
  const invoer = leesVorm(await leesJson(req), t.vestigingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigVorm(t, id, invoer.waarde))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout(WEG, 404)
  return alsAntwoord(await verwijderVorm(t, id))
}
