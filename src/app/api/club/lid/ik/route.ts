// GET /api/club/lid/ik
// De eigen gegevens van het ingelogde lid: naam, vestiging, status en
// lidmaatschap, plus het merk van de sportschool. Geen gezondheidsgegevens,
// geen notities van trainers en niets van andere leden.

import { NextResponse, type NextRequest } from 'next/server'
import { clubJson } from '@/lib/club/toegang'
import { LID_STATUS_LABEL } from '@/lib/club/kern/lid'
import { naamVan } from '@/lib/club/kern/vestigingen'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  const { lid } = l
  return clubJson({
    lid: {
      voornaam: lid.voornaam,
      achternaam: lid.achternaam,
      lidnummer: lid.lidnummer,
      email: lid.email,
      telefoon: lid.telefoon,
      vestiging: naamVan(l.vestigingen, lid.vestiging),
      status: LID_STATUS_LABEL[lid.status],
      abonnement: lid.abonnement,
      lidSinds: lid.lidSinds,
      einddatum: lid.einddatum,
    },
    merk: l.merk,
    voorvertoning: l.voorvertoning,
  })
}
