// PATCH /api/club/betalen/lidgeld  { lidgeldAan }
// Lidgeld voor deze sportschool aan of uit. Alleen Kane en de eigenaar
// (vereisBetalenBeheer), alleen met CLUB_LIDGELD_ACTIEF aan. Schaduw blijft
// zoals hij is (standaard aan): er wordt dan nog niets geincasseerd.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { lidgeldActief } from '@/lib/club/betalen/config'
import { vereisBetalenBeheer } from '@/lib/club/betalen/toegang'
import { zetLidgeld } from '@/lib/club/betalen/plannen/lidgeld-schakelaar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  if (!lidgeldActief()) return clubFout('Niet gevonden.', 404)
  const t = await vereisBetalenBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 300)
  if (gelezen instanceof NextResponse) return gelezen
  return zetLidgeld(t, (gelezen.body as { lidgeldAan?: unknown } | null)?.lidgeldAan)
}
