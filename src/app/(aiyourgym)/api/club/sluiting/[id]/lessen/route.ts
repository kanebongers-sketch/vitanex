import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { annuleerLessenOpSluiting } from '@/lib/club/sluiting/opslag'

// POST /api/club/sluiting/[id]/lessen
// Annuleert de geplande lessen die door deze sluiting niet door kunnen gaan
// (de gewone annuleerlogica: reserveringen vervallen). Antwoord: { geannuleerd, mislukt }.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze sluitingsdag bestaat niet.', 404)
  return alsAntwoord(await annuleerLessenOpSluiting(t, id))
}
