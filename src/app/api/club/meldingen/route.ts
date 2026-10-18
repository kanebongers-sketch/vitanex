// PATCH /api/club/meldingen { uit, lesHerinneringMin, afspraakHerinneringMin }
// De meldingen aan leden van de sportschool die open staat: welke aan staan
// en de herinnertijden. Hoort bij Beheer (zie API_ONDERDEEL in
// src/lib/club/beheerders/rechten.ts: meldingen hoort op 'beheer').

import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesInstellingenInvoer } from '@/lib/club/meldingen/soorten'
import { bewaarMeldingInstellingen } from '@/lib/club/meldingen/opslag'

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesInstellingenInvoer(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!(await bewaarMeldingInstellingen(t.admin, t.userId, invoer.waarde))) return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, 'Meldingen aan leden aangepast', t.organisatie.naam, null)
  return clubJson({ ok: true })
}
