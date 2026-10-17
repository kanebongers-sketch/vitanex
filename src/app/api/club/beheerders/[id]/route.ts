// PATCH /api/club/beheerders/[id]  { actie: goedkeuren | afwijzen | reset | stoppen, controle? }
// Goedkeuren alleen met de controlecode die de beheerder aan Kane noemt.
// Kane beoordeelt de pincode van een beheerder, reset hem, of stopt de
// beheerder. Alleen binnen de sportschool die nu open staat; alleen Kane.

import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisKane } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesBeoordeling } from '@/lib/club/beheerders/beheerder'
import { beoordeelBeheerder } from '@/lib/club/beheerders/beheerder-opslag'

const LOG: Record<string, string> = { goedkeuren: 'Pincode beheerder goedgekeurd', afwijzen: 'Pincode beheerder afgewezen', reset: 'Pincode beheerder gereset', stoppen: 'Beheerder gestopt' }

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisKane(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  const invoer = leesBeoordeling(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const { actie } = invoer.waarde
  const uit = await beoordeelBeheerder(t.admin, t.userId, id, invoer.waarde)
  if (uit === 'controle_fout') return clubFout('Deze controlecode klopt niet. Vraag de beheerder opnieuw, of wijs de pincode af.', 400)
  if (uit === 'niet_gevonden') return clubFout('Deze beheerder bestaat niet (meer), of de pincode is al beoordeeld.', 404)
  if (uit === 'db') return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, LOG[actie], null, null)
  return clubJson({ ok: true })
}
