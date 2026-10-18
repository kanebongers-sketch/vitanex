import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { isUuid, leesUren } from '@/lib/club/personeel/invoer'
import { registreerUren } from '@/lib/club/personeel/uren-opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// PATCH /api/club/personeel/diensten/[id]/uren
//   { actie: 'opslaan' | 'bevestig' | 'goedkeuren' | 'terug', gewerktBegin?, gewerktEind?, pauzeMin?, opmerking? }
//   Antwoord: { status }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_diensten', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Deze dienst bestaat niet.', 404)
  const invoer = leesUren(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await registreerUren(t, id, invoer.waarde))
}
