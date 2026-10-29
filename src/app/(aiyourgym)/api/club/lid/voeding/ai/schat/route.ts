// POST /api/club/lid/voeding/ai/schat  { omschrijving }  "2 boterhammen met kaas" naar een schatting
// Betaalde AI: alleen met CLUB_VOEDING_AI_ACTIEF=1 en ANTHROPIC_API_KEY, anders 404; alleen na
// toestemming van het lid (403). Het antwoord is een voorstel dat het lid zelf bevestigt.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { alsAiAntwoord, vereisLidAi } from '@/lib/club/voeding/dagboek/ai/route-hulp'
import { schatOmschrijving } from '@/lib/club/voeding/dagboek/ai/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidAi(req, 'schatten')
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 1024)
  if (gelezen instanceof NextResponse) return gelezen
  const body = gelezen.body
  const ruw = typeof body === 'object' && body !== null ? (body as { omschrijving?: unknown }).omschrijving : null
  const omschrijving = typeof ruw === 'string' ? ruw.replace(/\s+/g, ' ').trim().slice(0, 300) : ''
  if (omschrijving.length < 2) return clubFout('Vul kort in wat je at.', 400)
  return alsAiAntwoord(await schatOmschrijving(omschrijving, await getTaal()))
}
