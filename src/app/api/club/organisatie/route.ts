import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { leesHuisstijl } from '@/lib/club/kern/organisatie-invoer'
import { bewaarHuisstijl } from '@/lib/club/kern/organisatie-opslag'

// PATCH /api/club/organisatie  { naam, slogan, kleurAccent, thema, uit: Module[] }
// De huisstijl en onderdelen van de sportschool die nu open staat.

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesHuisstijl(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!(await bewaarHuisstijl(t, invoer.waarde))) return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  await logActie(t, 'Huisstijl aangepast', invoer.waarde.naam, null)
  return clubJson({ ok: true })
}
