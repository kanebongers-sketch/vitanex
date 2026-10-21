// PATCH /api/club/privacy { leadsMaanden, oudLedenMaanden, bezoekenMaanden, logboekMaanden }
// De bewaartermijnen van de sportschool instellen. Alleen Kane en de eigenaar
// (vereisBeheerdersBeheer); hoort bij Beheer in src/lib/club/beheerders/rechten.ts.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { leesTermijnen } from '@/lib/club/privacy/termijnen'
import { bewaarTermijnen } from '@/lib/club/privacy/opslag'

export async function PATCH(req: NextRequest) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 2_048)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesTermijnen(gelezen.body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!(await bewaarTermijnen(t.admin, t.userId, invoer.waarde))) return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, 'Bewaartermijnen aangepast', null, null)
  return clubJson({ ok: true, termijnen: invoer.waarde })
}
