import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { NIEUWE_START, klaarVoorLive, leesStartInvoer, nogOpen, nogOpenTekst, pasToe, stappenStand } from '@/lib/club/start/stappen'
import { bewaarStart, haalStart, haalStartFeiten } from '@/lib/club/start/opslag'
import { TAAL_COOKIE, kiesTaal } from '@/lib/aiyourgym/taal/taal'
import { START_LIB } from '@/lib/aiyourgym/taal/woorden/club/start-lib'

// PATCH /api/club/start  { stap?, klaar?, open?, afronden?, streefdatum?, bevestig? }
// De voortgang van de startwizard van de sportschool die open staat. Alleen
// Kane en de eigenaar; anderen krijgen een 404 (bestaat niet). Afronden kan
// alleen als alle stappen ervoor echt af zijn (regels in stappen.ts).

const MAX_BODY = 1024

export async function PATCH(req: NextRequest) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesStartInvoer(gelezen.body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const taal = kiesTaal(req.cookies.get(TAAL_COOKIE)?.value)
  const huidig = await haalStart(t)
  if (!huidig.ok) return clubFout(START_LIB[taal].api.leesFout, 500)
  const nieuw = pasToe(huidig.voortgang ?? NIEUWE_START, invoer.waarde, new Date())
  if (invoer.waarde.afronden === true) {
    const stand = stappenStand(nieuw, await haalStartFeiten(t), taal, t.organisatie.afgenomen)
    if (!klaarVoorLive(stand)) return clubFout(nogOpenTekst(nogOpen(stand), taal), 409)
  }
  if (!(await bewaarStart(t, nieuw))) return clubFout(START_LIB[taal].api.opslaanFout, 500)
  if (invoer.waarde.afronden === true && !huidig.voortgang?.afgerondOp) await logActie(t, 'Startwizard afgerond', t.organisatie.naam, null)
  return clubJson({ ok: true, voortgang: nieuw })
}
