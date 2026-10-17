// PATCH /api/club/bedrijf: bedrijfsgegevens of teksten (huisregels, voorwaarden,
// privacy) van de sportschool die open staat. Per tabblad een verzoek.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesBedrijfInvoer } from '@/lib/club/bedrijf/invoer'
import { bewaarBedrijf } from '@/lib/club/bedrijf/opslag'

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const invoer = leesBedrijfInvoer(await req.json().catch(() => null))
  if (!invoer.ok) return clubJson({ fout: invoer.fout, veld: invoer.veld ?? null }, 400)

  if (!(await bewaarBedrijf(t.admin, t.userId, invoer.waarde))) {
    return clubFout('Opslaan is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, invoer.waarde.soort === 'gegevens' ? 'bedrijfsgegevens bijgewerkt' : 'huisregels en voorwaarden bijgewerkt', t.organisatie.naam, null)
  return clubJson({ ok: true })
}
