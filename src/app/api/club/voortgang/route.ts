// GET  /api/club/voortgang?lid=<id>: de voortgang van een lid (metingen,
//      intakes en trainingen).
// POST /api/club/voortgang: een losse meting toevoegen. Alleen met
//      toestemming van het lid (AVG, gezondheidsgegevens).

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { medewerkerBestaat } from '@/lib/club/kern/medewerker'
import { lidVestiging } from '@/lib/club/training/schrijven'
import { isUuid } from '@/lib/club/training/typen'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { leesNieuweMeting } from '@/lib/club/voortgang/meting'
import { haalVoortgang, voegMetingToe } from '@/lib/club/voortgang/data'

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const lidId = req.nextUrl.searchParams.get('lid')
  if (!isUuid(lidId) || !(await lidVestiging(t.admin, t.userId, lidId))) return clubFout('Lid niet gevonden.', 404)
  return clubJson({ voortgang: await haalVoortgang(t.admin, t.userId, lidId) })
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const body: unknown = await req.json().catch(() => null)
  const invoer = leesNieuweMeting(body, dagSleutelNl(new Date()))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const m = invoer.waarde

  const vestiging = await lidVestiging(t.admin, t.userId, m.lidId)
  if (!vestiging) return clubFout('Dit lid bestaat niet (meer).', 404)
  if (!(await medewerkerBestaat(t.admin, t.userId, m.medewerkerId))) return clubFout('Onbekende medewerker.', 400)
  if (!(await voegMetingToe(t.admin, t.userId, m))) return clubFout('De meting kon niet worden opgeslagen. Probeer het opnieuw.', 500)

  await logActie(t, 'Meting toegevoegd', 'met toestemming van het lid', vestiging)
  return clubJson({ voortgang: await haalVoortgang(t.admin, t.userId, m.lidId) }, 201)
}
