import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson, vandaagNl } from '@/lib/club/taken/api'
import { leesAfvinkInvoer, leesVakInvoer } from '@/lib/club/taken/invoer'
import { vinkAf, vinkUit } from '@/lib/club/taken/afvink-opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// POST   /api/club/taken/afvinken  { taakId, datum, medewerkerId?, wie }  geeft het vinkje
// DELETE /api/club/taken/afvinken?taak=<id>&datum=2026-10-14              geeft { weg: true }
// Een medewerker vinkt alleen taken van zijn eigen vestigingen af (anders 404).

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesAfvinkInvoer(await leesJson(req), vandaagNl())
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const buiten = await eisVestigingVanRecord(t, 'club_taken', invoer.waarde.taakId)
  if (buiten) return buiten
  return alsAntwoord(await vinkAf(t, invoer.waarde))
}

export async function DELETE(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const p = req.nextUrl.searchParams
  const vak = leesVakInvoer(p.get('taak'), p.get('datum'), vandaagNl())
  if (!vak.ok) return clubFout(vak.fout, 400)
  const buiten = await eisVestigingVanRecord(t, 'club_taken', vak.waarde.taakId)
  if (buiten) return buiten
  return alsAntwoord(await vinkUit(t, vak.waarde.taakId, vak.waarde.datum))
}
