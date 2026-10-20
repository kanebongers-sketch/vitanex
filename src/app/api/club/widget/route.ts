// PATCH /api/club/widget { vestiging, aan, domeinen, lestypeIds, kleurmodus, privacyUrl }
// De boekingswidget van een vestiging instellen. Alleen Kane en de eigenaar
// (vereisBeheerdersBeheer); hoort bij Beheer in src/lib/club/beheerders/rechten.ts.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { leesWidgetInstellingen } from '@/lib/club/widget/invoer'
import { bewaarWidgetInstellingen, haalLestypen } from '@/lib/club/widget/opslag'

export async function PATCH(req: NextRequest) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 16_384)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesWidgetInstellingen(gelezen.body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const i = invoer.waarde
  if (!hoortBij(t.vestigingen, i.vestiging)) return clubFout('Onbekende vestiging.', 400)
  // Alleen lestypen van deze sportschool; wat niet (meer) bestaat valt weg.
  const bestaand = new Set((await haalLestypen(t.admin, t.userId)).map((l) => l.id))
  const lestypeIds = i.lestypeIds.filter((id) => bestaand.has(id))
  if (!(await bewaarWidgetInstellingen(t.admin, t.userId, { ...i, lestypeIds }))) return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, 'Boekingswidget aangepast', i.aan ? 'aan' : 'uit', i.vestiging)
  return clubJson({ ok: true, lestypeIds })
}
