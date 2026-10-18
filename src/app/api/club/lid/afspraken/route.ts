// GET  /api/club/lid/afspraken: komende afspraken van het ingelogde lid en wat
//      het zelf kan boeken.
// POST /api/club/lid/afspraken  { typeId, medewerkerId, datum, tijd }: zelf een
//      vrij tijdslot boeken (hooguit 2 open afspraken, boekregels van het type).

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang, zonderLid } from '@/lib/club/ledenlogin/toegang'
import { afsprakenVoorLid, boekAfspraakVoorLid } from '@/lib/club/app/acties-afspraken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidToegang(req, 'afspraken')
  if (l instanceof NextResponse) return l
  return afsprakenVoorLid(l, l.lid)
}

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req, 'afspraken')
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 1_000)
  if (gelezen instanceof NextResponse) return gelezen
  return boekAfspraakVoorLid(l, l.lid, zonderLid(gelezen.body))
}
