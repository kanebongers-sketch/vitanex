// PATCH /api/club/beheerders/[id]  { actie: reset | stoppen }
// Kane of de eigenaar geeft een beheerder een nieuwe uitnodiging (wachtwoord
// weg, nieuwe link, alle toestellen uit) of stopt de beheerder. Alleen binnen de eigen sportschool; nooit jezelf (dan
// zou je jezelf buitensluiten). Een clubmanager krijgt een 404.

import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { leesBeoordeling } from '@/lib/club/beheerders/beheerder'
import { beoordeelBeheerder } from '@/lib/club/beheerders/beheerder-opslag'

const LOG: Record<string, string> = { reset: 'Nieuwe uitnodiging beheerder', stoppen: 'Beheerder gestopt' }

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  if (id === t.persoonId) return clubFout('Je eigen toegang pas je hier niet aan. Vraag een andere eigenaar of Kane.', 400)
  const invoer = leesBeoordeling(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const { actie } = invoer.waarde
  const uit = await beoordeelBeheerder(t.admin, t.userId, id, invoer.waarde)
  if (uit === 'niet_gevonden') return clubFout('Deze beheerder bestaat niet (meer).', 404)
  if (uit === 'db') return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, LOG[actie], null, null)
  return clubJson({ ok: true })
}
