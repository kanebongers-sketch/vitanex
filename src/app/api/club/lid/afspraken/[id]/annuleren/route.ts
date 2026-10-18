// POST /api/club/lid/afspraken/[id]/annuleren
// Het ingelogde lid annuleert een eigen afspraak, binnen de annuleerregel.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { annuleerAfspraakVoorLid } from '@/lib/club/app/acties-afspraken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const l = await vereisLidToegang(req, 'afspraken')
  if (l instanceof NextResponse) return l
  const { id } = await params
  return annuleerAfspraakVoorLid(l, l.lid, id)
}
