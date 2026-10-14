import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/taken/api'
import { leesNieuweTaak } from '@/lib/club/taken/invoer'
import { maakTaak } from '@/lib/club/taken/beheer-opslag'

// POST /api/club/taken/taak  { lijstId, naam, groep?, frequentie, perWeekMin?, moment }  geeft de nieuwe taak

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesNieuweTaak(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const { lijstId, ...velden } = invoer.waarde
  return alsAntwoord(await maakTaak(t, lijstId, velden))
}
