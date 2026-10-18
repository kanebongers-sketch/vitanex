// ─── Club, betalen: het slot (SERVER-ONLY) ──────────────────────────────────
// Met CLUB_BETALEN_ACTIEF uit bestaat betalen niet (gewone 404). Beheer van
// betalen (Connect, producten, verkopen, terugbetalen) is alleen voor Kane en
// de eigenaar van de sportschool, net als beheerders en het adres.

import { notFound } from 'next/navigation'
import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, eisBeheerdersBeheer, vereisBeheerdersBeheer, type ClubToegang } from '@/lib/club/toegang'
import { publiekeHost } from '@/lib/aiyourgym/api'
import { betalenActief } from './config'
import { betaalOorsprong } from './adressen'

export async function eisBetalenBeheer(): Promise<ClubToegang> {
  if (!betalenActief()) notFound()
  return eisBeheerdersBeheer()
}

export async function vereisBetalenBeheer(req: NextRequest): Promise<ClubToegang | NextResponse> {
  if (!betalenActief()) return clubFout('Niet gevonden.', 404)
  return vereisBeheerdersBeheer(req)
}

/** De oorsprong van dit verzoek voor terugverwijzingen van Stripe, of null. */
export function oorsprongVanVerzoek(req: NextRequest): string | null {
  return betaalOorsprong(publiekeHost(req))
}
