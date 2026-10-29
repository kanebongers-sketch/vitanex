// GET  /api/club/lid/voeding?dag=JJJJ-MM-DD  de week tot en met die dag (7 dagen) en de keuzes van het lid
// POST /api/club/lid/voeding  { datum, maaltijd, naam, merk?, gram?, maat?, aantal?, bron, productSleutel?, per100? | kcal, eiwitG, koolhydratenG, vetG }
//      Een regel in het dagboek. Met per100 rekent de server de macro's zelf uit.
// Het lid komt altijd uit de sessie; in de voorvertoning (Kane) alleen lezen.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { zonderLid } from '@/lib/club/ledenlogin/toegang'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { plusDag } from '@/lib/club/voeding/dagboek/berekeningen'
import { leesLog } from '@/lib/club/voeding/dagboek/invoer'
import { isDatum } from '@/lib/club/voeding/dagboek/model'
import { haalRegels, voegRegelToe } from '@/lib/club/voeding/dagboek/opslag'
import { teVaak, vereisLidVoeding } from '@/lib/club/voeding/dagboek/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidVoeding(req)
  if (l instanceof NextResponse) return l
  const gevraagd = req.nextUrl.searchParams.get('dag')
  const dag = isDatum(gevraagd) ? gevraagd : dagSleutelNl(new Date())
  const regels = await haalRegels(l.admin, l.userId, l.lid.id, plusDag(dag, -6), dag)
  if (!regels) return clubFout('Je dagboek kon niet worden geladen.', 500)
  return clubJson({ dag, regels, instellingen: l.instellingen })
}

export async function POST(req: NextRequest) {
  const l = await vereisLidVoeding(req, { schrijft: true, gestart: true })
  if (l instanceof NextResponse) return l
  if (teVaak('log', l.lid.id, 60)) return clubFout('Even rustig aan. Probeer het over een minuut opnieuw.', 429)
  const gelezen = await leesJsonOfTeGroot(req, 4096)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesLog(zonderLid(gelezen.body))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const regel = await voegRegelToe(l.admin, l.userId, l.lid.id, invoer.waarde)
  if (!regel) return clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
  return clubJson({ regel }, 201)
}
