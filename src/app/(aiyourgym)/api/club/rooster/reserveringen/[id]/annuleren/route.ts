import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { stripTerugNaAnnuleren } from '@/lib/club/betalen/terug-bij-annuleren'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { annuleerReservering } from '@/lib/club/rooster/opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// POST /api/club/rooster/reserveringen/[id]/annuleren
// Antwoord: { status: 'geannuleerd', teLaat, doorgeschoven } met doorgeschoven = het lid-id
// van wie van de wachtlijst naar geboekt schoof, of null.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_reserveringen', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Deze reservering bestaat niet.', 404)
  const uit = await annuleerReservering(t, id)
  // Op tijd geannuleerd en met een strip betaald: de strip gaat terug (best effort).
  if (uit.ok && (await stripTerugNaAnnuleren(t.admin, t.userId, id, t.naam))) await logActie(t, 'Strip teruggegeven na annuleren', null, null)
  return alsAntwoord(uit)
}
