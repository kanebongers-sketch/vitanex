import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { magBeheerdersBeheren } from '@/lib/club/beheerders/rechten'
import { isRij } from '@/lib/club/training/rijen'
import { bewaarLidSchemaInstelling } from '@/lib/club/training/lid-schemas/opslag'

// PATCH /api/club/training/lid-schemas { trainerAanpassen: boolean }
// Mag een lid het schema van de trainer zelf aanpassen? Standaard nee. Een
// instelling van de sportschool: alleen Kane en de eigenaar.

export async function PATCH(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  if (!magBeheerdersBeheren(t)) return clubFout('Niet gevonden.', 404)
  const body: unknown = await req.json().catch(() => null)
  if (!isRij(body) || typeof body.trainerAanpassen !== 'boolean') return clubFout('Ongeldig verzoek.', 400)
  if (!(await bewaarLidSchemaInstelling(t.admin, t.organisatie.id, { trainerAanpassen: body.trainerAanpassen }))) {
    return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  }
  await logActie(t, body.trainerAanpassen ? 'Leden mogen trainerschema aanpassen' : 'Leden mogen trainerschema niet aanpassen', t.organisatie.naam, null)
  return clubJson({ trainerAanpassen: body.trainerAanpassen })
}
