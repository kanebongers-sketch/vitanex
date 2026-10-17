// POST /api/club/berichten: een nieuw bericht voor de ledenapp.
// Er wordt niets verstuurd (geen push, geen e-mail): het bericht staat alleen in de app.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesBericht } from '@/lib/club/berichten/invoer'
import { BERICHT_KOLOMMEN, berichtUitRij } from '@/lib/club/berichten/model'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const body: unknown = await req.json().catch(() => null)
  const invoer = leesBericht(body, t.vestigingen.map((v) => v.sleutel), new Date())
  if (!invoer.ok) return clubFout(invoer.fout, 400)

  const { data, error } = await t.admin
    .from('club_berichten')
    .insert({ ...invoer.waarde, user_id: t.userId, aangemaakt_door: t.naam.slice(0, 80) })
    .select(BERICHT_KOLOMMEN)
    .single()
  const bericht = error ? null : berichtUitRij(data)
  if (!bericht) {
    console.error('[club/berichten] bericht aanmaken mislukt', error?.message)
    return clubFout('Het bericht kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'bericht geplaatst', bericht.titel, null)
  return clubJson({ bericht }, 201)
}
