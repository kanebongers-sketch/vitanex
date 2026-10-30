// GET /api/club/lid/training/bibliotheek
// De oefeningen die het ingelogde lid zelf in een schema mag zetten: alleen
// kiesbare oefeningen met een eigen Blender-render en coaching.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { bibliotheekAntwoord } from '@/lib/club/training/lid-schemas/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  return bibliotheekAntwoord(l)
}
