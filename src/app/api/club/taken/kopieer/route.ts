import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { alsAntwoord, leesJson } from '@/lib/club/taken/api'
import { leesKopieerInvoer } from '@/lib/club/taken/invoer'
import { kopieerLijsten } from '@/lib/club/taken/beheer-opslag'

// POST /api/club/taken/kopieer  { van, naar }  geeft { lijsten, taken } (aantal nieuw)
// Kopieert de takenlijsten van de ene vestiging naar de andere, zonder dubbelingen en zonder vinkjes.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesKopieerInvoer(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!hoortBij(t.vestigingen, invoer.waarde.van) || !hoortBij(t.vestigingen, invoer.waarde.naar)) return clubFout('Onbekende vestiging.', 400)
  return alsAntwoord(await kopieerLijsten(t, invoer.waarde.van, invoer.waarde.naar))
}
