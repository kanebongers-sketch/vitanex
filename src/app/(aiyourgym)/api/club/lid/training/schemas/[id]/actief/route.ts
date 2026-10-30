// POST /api/club/lid/training/schemas/[id]/actief
// Het lid kiest welk schema het in de app gebruikt (eigen schema of dat van de trainer).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { kiesAntwoord } from '@/lib/club/training/lid-schemas/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  return kiesAntwoord(l, (await params).id)
}
