// POST   /api/club/lid/voeding/instellingen  { soort: 'start', trainerZien } | { soort: 'trainer', trainerZien } | { soort: 'doelen', doelen } | { soort: 'ai', aan }
//        Starten legt de keuze van het lid vast (tijdstip en tekstversie). Een trainer
//        ziet het dagboek alleen als het lid trainerZien aanzet (AVG: gezondheidsgerelateerd).
//        soort 'ai': toestemming voor de foto-schatting via Anthropic geven of intrekken
//        (tijdstip en tekstversie); alleen als de AI-functie aan staat.
// DELETE /api/club/lid/voeding/instellingen  het hele dagboek wissen (regels, eigen producten, favorieten, keuzes)

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { zonderLid } from '@/lib/club/ledenlogin/toegang'
import { leesInstelling } from '@/lib/club/voeding/dagboek/invoer'
import { bewaarInstelling, wisDagboek } from '@/lib/club/voeding/dagboek/opslag'
import { vereisLidVoeding } from '@/lib/club/voeding/dagboek/server'
import { aiFuncties } from '@/lib/club/voeding/dagboek/ai/schakelaar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidVoeding(req, { schrijft: true })
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 1024)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesInstelling(zonderLid(gelezen.body))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (invoer.waarde.soort !== 'start' && !l.instellingen.gestartOp) return clubFout('Start eerst je voedingsdagboek.', 409)
  // Toestemming geven kan alleen voor een functie die bestaat; intrekken kan altijd.
  if (invoer.waarde.soort === 'ai' && invoer.waarde.aan && !aiFuncties().foto) return clubFout('Niet gevonden.', 404)
  const instellingen = await bewaarInstelling(l.admin, l.userId, l.lid.id, invoer.waarde, new Date())
  return instellingen ? clubJson({ instellingen }) : clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
}

export async function DELETE(req: NextRequest) {
  const l = await vereisLidVoeding(req, { schrijft: true })
  if (l instanceof NextResponse) return l
  const ok = await wisDagboek(l.admin, l.userId, l.lid.id)
  return ok ? clubJson({ ok: true }) : clubFout('Wissen lukt nu niet. Probeer het opnieuw.', 500)
}
