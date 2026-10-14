import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { annuleerReservering } from '@/lib/club/rooster/opslag'

// POST /api/club/rooster/reserveringen/[id]/annuleren
// Antwoord: { status: 'geannuleerd', teLaat, doorgeschoven } met doorgeschoven = het lid-id
// van wie van de wachtlijst naar geboekt schoof, of null.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze reservering bestaat niet.', 404)
  return alsAntwoord(await annuleerReservering(t, id))
}
