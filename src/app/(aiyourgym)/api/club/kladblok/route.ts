// POST /api/club/kladblok: een nieuwe notitie. Body: { titel?, inhoud?, map?, vestiging? (null = alle) }.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { KLAD_KOLOMMEN, kladUitRij, leesKladWijziging } from '@/lib/club/kladblok/model'

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesKladWijziging(await req.json().catch(() => null), { nieuw: true })
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (invoer.waarde.vestiging != null && !hoortBij(t.vestigingen, invoer.waarde.vestiging)) return clubFout('Onbekende vestiging.', 400)
  const w = invoer.waarde
  const { data, error } = await t.admin
    .from('club_kladblok')
    .insert({
      user_id: t.userId, titel: w.titel, inhoud: w.inhoud ?? '', map: w.map ?? 'algemeen', vestiging: w.vestiging ?? null,
      vastgepind: w.vastgepind ?? false, auteur: t.naam,
    })
    .select(KLAD_KOLOMMEN)
    .single()
  const notitie = error ? null : kladUitRij(data)
  if (!notitie) return clubFout('De notitie kon niet worden opgeslagen. Probeer het opnieuw.', 500)
  await logActie(t, 'notitie aangemaakt', notitie.titel, notitie.vestiging)
  return clubJson({ notitie }, 201)
}
