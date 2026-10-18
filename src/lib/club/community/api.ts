// ─── Club, community: poort voor de leden-API (SERVER) ──────────────────────
// Bovenop vereisLidToegang: in de voorvertoning kijkt Kane mee als een lid,
// maar plaatst, reageert of meldt nooit namens dat lid.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { vereisLidToegang, type LidToegang } from '@/lib/club/ledenlogin/toegang'

export async function vereisCommunityLid(req: NextRequest): Promise<LidToegang | NextResponse> {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  if (l.voorvertoning) return clubFout('In de voorvertoning kun je niets namens een lid doen.', 403)
  return l
}

/** Maximale grootte van een JSON-body voor de community (ruim voor 500 tekens). */
export const COMMUNITY_BODY_MAX = 4_000
