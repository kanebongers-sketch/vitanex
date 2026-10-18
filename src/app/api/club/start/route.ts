import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisBeheerdersBeheer } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { NIEUWE_START, leesStartInvoer, pasToe } from '@/lib/club/start/stappen'
import { bewaarStart, haalStart } from '@/lib/club/start/opslag'

// PATCH /api/club/start  { stap?, klaar?, open?, afronden? }
// De voortgang van de startwizard van de sportschool die open staat. Alleen
// Kane en de eigenaar; anderen krijgen een 404 (bestaat niet).

const MAX_BODY = 1024

export async function PATCH(req: NextRequest) {
  const t = await vereisBeheerdersBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesStartInvoer(gelezen.body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const huidig = await haalStart(t)
  if (!huidig.ok) return clubFout('De voortgang kon niet worden gelezen. Probeer het opnieuw.', 500)
  const nieuw = pasToe(huidig.voortgang ?? NIEUWE_START, invoer.waarde, new Date())
  if (!(await bewaarStart(t, nieuw))) return clubFout('Opslaan lukte niet. Probeer het opnieuw.', 500)
  if (invoer.waarde.afronden === true && !huidig.voortgang?.afgerondOp) await logActie(t, 'Startwizard afgerond', t.organisatie.naam, null)
  return clubJson({ ok: true, voortgang: nieuw })
}
