// POST   /api/club/lid/voeding/plan  { plan: { doel, kcal, eiwitG, koolhydratenG, vetG, adviezen, maaltijden, berekening? }, bewaarGegevens }
//        Het lid bewaart het eigen voedingsplan. Heeft de trainer het plan gemaakt en
//        mogen leden dat niet overschrijven (club_voeding_regels), dan wordt het een
//        voorstel voor de trainer. Antwoord: { soort: 'opgeslagen' | 'voorstel' }.
//        Lichaamsgegevens (berekening) alleen met bewaarGegevens: true (toestemming).
// DELETE /api/club/lid/voeding/plan?wat=plan|voorstel  het eigen plan weghalen of het voorstel intrekken.
// Het lid komt altijd uit de sessie; de voorvertoning van Kane verandert niets.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang, zonderLid, type LidToegang } from '@/lib/club/ledenlogin/toegang'
import { leesLidPlan } from '@/lib/club/voeding/eigen'
import { bewaarLidPlan, haalVoedingRegels, verwijderLidPlan } from '@/lib/club/voeding/eigen-opslag'
import { teVaak } from '@/lib/club/voeding/dagboek/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY = 32 * 1024

async function schrijver(req: NextRequest): Promise<LidToegang | NextResponse> {
  const l = await vereisLidToegang(req, 'voeding')
  if (l instanceof NextResponse) return l
  if (l.voorvertoning) return clubFout('In de voorvertoning verandert er niets.', 403)
  if (teVaak('plan', l.lid.id, 20)) return clubFout('Even rustig aan. Probeer het over een minuut opnieuw.', 429)
  return l
}

export async function POST(req: NextRequest) {
  const l = await schrijver(req)
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesLidPlan(zonderLid(gelezen.body))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const regels = await haalVoedingRegels(l.admin, l.userId)
  if (!regels) return clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
  return alsAntwoord(await bewaarLidPlan(l, invoer.waarde, regels))
}

export async function DELETE(req: NextRequest) {
  const l = await schrijver(req)
  if (l instanceof NextResponse) return l
  const wat = req.nextUrl.searchParams.get('wat')
  if (wat !== 'plan' && wat !== 'voorstel') return clubFout('Ongeldig verzoek.', 400)
  return alsAntwoord(await verwijderLidPlan(l, wat))
}
