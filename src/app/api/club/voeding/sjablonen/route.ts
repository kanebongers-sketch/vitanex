import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonBegrensd } from '@/lib/club/kern/body'
import { leesSjabloon } from '@/lib/club/voeding/invoer'
import { haalSjablonen } from '@/lib/club/voeding/lezen'
import { maakSjabloon } from '@/lib/club/voeding/opslag'

// GET  /api/club/voeding/sjablonen  alle sjablonen van de sportschool
// POST /api/club/voeding/sjablonen  { naam, omschrijving, doel, eiwitPerKg, kcal, eiwitG, koolhydratenG, vetG, adviezen, maaltijden }

const MAX_BODY = 32 * 1024

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const sjablonen = await haalSjablonen(t.admin, t.userId)
  if (!sjablonen) return clubFout('De sjablonen konden niet worden geladen.', 500)
  return clubJson({ sjablonen })
}

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const body = await leesJsonBegrensd(req, MAX_BODY)
  if (body === 'te-groot') return clubFout('Het sjabloon is te groot.', 413)
  const invoer = leesSjabloon(body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await maakSjabloon(t, invoer.waarde))
}
