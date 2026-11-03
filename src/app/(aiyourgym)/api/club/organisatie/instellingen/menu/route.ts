import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { kanBewerken } from '@/lib/club/rollen/wie'
import { leesAllesTonenInvoer, zetAllesTonen } from '@/lib/club/kern/alles-tonen'
import { clubTekst } from '@/lib/aiyourgym/taal/server'
import { BEHEER } from '@/lib/aiyourgym/taal/woorden/club/beheer'

// PATCH /api/club/organisatie/instellingen/menu  { aan: boolean }
// "Alles tonen, ook wat nog leeg is" (ontwerp 03-11-2026) voor de sportschool die
// open staat. Hoort bij Pakketten en onderdelen: wie die mag bewerken (huisstijl)
// en instellingen mag wijzigen (beheer, via de poort). Alleen het sleuteltje
// menu.alles_tonen verandert (migratie 492); foutteksten in NL en EN.

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const fouten = (await clubTekst(BEHEER)).centrum.allesTonen
  if (!magOnderdeel(t.onderdelen, 'huisstijl') || !kanBewerken(t, 'huisstijl')) return clubFout(fouten.nietGevonden, 404)
  const aan = leesAllesTonenInvoer(await req.json().catch(() => null))
  if (aan === null) return clubFout(fouten.invoer, 400)
  const uit = await zetAllesTonen(t.admin, t.organisatie.id, t.beheerderId, aan)
  if (uit === 'weg') return clubFout(fouten.nietGevonden, 404)
  if (uit === 'fout') return clubFout(fouten.fout, 500)
  await logActie(t, aan ? 'Alles tonen aangezet' : 'Alles tonen uitgezet', t.organisatie.naam, null)
  return clubJson({ ok: true, aan })
}
