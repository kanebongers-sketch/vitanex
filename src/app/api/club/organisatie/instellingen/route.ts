import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { ONDERDEEL_SLEUTELS, leesOrgInstellingenInvoer, orgInstellingenNaarJson } from '@/lib/club/kern/org-instellingen'

// PATCH /api/club/organisatie/instellingen  { ledenapp?: {...}, rechten?: {...} }
// Instellingen van de sportschool die open staat. Wat niet wordt meegestuurd blijft zoals het was.

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesOrgInstellingenInvoer(await req.json().catch(() => null), t.organisatie.instellingen, ONDERDEEL_SLEUTELS)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const { error } = await t.admin
    .from('club_organisaties')
    .update({ instellingen: orgInstellingenNaarJson(invoer.waarde), bijgewerkt_op: new Date().toISOString() })
    .eq('id', t.organisatie.id)
    .eq('beheerder_id', t.beheerderId)
  if (error) {
    console.error('[club] instellingen opslaan mislukt', error.message)
    return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Instellingen aangepast', t.organisatie.naam, null)
  return clubJson({ ok: true })
}
