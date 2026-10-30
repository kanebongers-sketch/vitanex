// POST /api/club/lid/intake  { antwoorden, metingen?, toestemming }
// Het lid vult zelf de korte intake in (vier schermen in de ledenapp). Wordt
// een gewone intake in club_intakes met bron 'lid': de trainer ziet hem op de
// ledenkaart ("Ingevuld door lid") en op Vandaag ("Intake ingevuld"), en maakt
// er een schemavoorstel mee. Gezondheidsgegevens (gezondheidsvragen, gewicht en
// lengte) alleen met de aangevinkte toestemming, vastgelegd met tijd en
// tekstversie. Het lid komt altijd uit de sessie. Hoort bij het pakket
// Training en coaching (LID_API_PAKKET). In de voorvertoning van Kane: niets opslaan.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { leesLidIntake, snelleStartUitIntake, startschemaPad } from '@/lib/club/nieuwe-leden/intake'
import { bewaarLidIntake } from '@/lib/club/nieuwe-leden/intake-opslag'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { LID_INTAKE } from '@/lib/aiyourgym/taal/woorden/ledenapp/lid-intake'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  const f = LID_INTAKE[await getTaal()].fouten
  const gelezen = await leesJsonOfTeGroot(req, 8000)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesLidIntake(gelezen.body)
  if (!invoer.ok) return clubFout(f.ongeldig, 400)
  const start = startschemaPad(snelleStartUitIntake(invoer.waarde.antwoorden))
  if (l.voorvertoning) return clubJson({ ok: true, bewaard: false, start })
  const uit = await bewaarLidIntake(l.admin, l.userId, l.lid.id, invoer.waarde, new Date())
  if (uit.staat === 'teVeel') return clubFout(f.teVeel, 429)
  if (uit.staat !== 'ok') return clubFout(f.opslaan, 500)
  return clubJson({ ok: true, bewaard: true, start }, 201)
}
