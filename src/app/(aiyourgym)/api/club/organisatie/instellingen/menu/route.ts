import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { magOnderdeel } from '@/lib/club/beheerders/rechten'
import { kanBewerken } from '@/lib/club/rollen/wie'
import { leesAllesTonenInvoer, metAllesTonen } from '@/lib/club/kern/alles-tonen'

// PATCH /api/club/organisatie/instellingen/menu  { aan: boolean }
// "Alles tonen, ook wat nog leeg is" (ontwerp 03-11-2026) voor de sportschool die
// open staat. Hoort bij Pakketten en onderdelen: wie die mag bewerken (huisstijl)
// en instellingen mag wijzigen (beheer, via de poort). Andere sleutels blijven staan.

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!magOnderdeel(t.onderdelen, 'huisstijl') || !kanBewerken(t, 'huisstijl')) return clubFout('Niet gevonden.', 404)
  const aan = leesAllesTonenInvoer(await req.json().catch(() => null))
  if (aan === null) return clubFout('Stuur { aan: true } of { aan: false }.', 400)
  const huidig = await t.admin.from('club_organisaties').select('instellingen').eq('id', t.organisatie.id).eq('beheerder_id', t.beheerderId).maybeSingle()
  if (huidig.error) {
    console.error('[club] instellingen lezen mislukt', huidig.error.message)
    return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  }
  const ruw: unknown = (huidig.data as { instellingen?: unknown } | null)?.instellingen
  const { error } = await t.admin
    .from('club_organisaties')
    .update({ instellingen: metAllesTonen(ruw, aan), bijgewerkt_op: new Date().toISOString() })
    .eq('id', t.organisatie.id)
    .eq('beheerder_id', t.beheerderId)
  if (error) {
    console.error('[club] alles tonen opslaan mislukt', error.message)
    return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  }
  await logActie(t, aan ? 'Alles tonen aangezet' : 'Alles tonen uitgezet', t.organisatie.naam, null)
  return clubJson({ ok: true, aan })
}
