// ─── Club, health: gedeelde stukken voor de API-routes (SERVER-ONLY) ────────
// Met de schakelaar uit bestaat alles hier niet (404). Een bron is alleen te
// koppelen met een adapter, een geldige CLUB_HEALTH_SLEUTEL en de sleutels van
// de leverancier (providers.ts); anders "Binnenkort".

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { vereisLidToegang, type LidToegang } from '@/lib/club/ledenlogin/toegang'
import type { ClientSleutels, HealthAdapter } from './adapter'
import { adapterVoor } from './adapters'
import { redirectUri } from './oauth'
import { PROVIDERS, providerSleutels, providerStatus } from './providers'
import { healthActief, healthHoofdsleutel, healthRedirectBasis } from './schakelaar'
import { isBronId, type BronId } from './typen'

export const KOPPELINGEN_PAD = '/mijn/koppelingen'

export interface BronContext {
  bron: BronId
  adapter: HealthAdapter
  sleutels: ClientSleutels
  hoofdsleutel: Buffer
  redirectUri: string
}

/** Alles om een OAuth-bron te koppelen of te syncen, of null als dat (nog) niet kan. */
export function bronContext(bron: BronId): BronContext | null {
  const p = PROVIDERS[bron]
  const adapter = adapterVoor(bron)
  const sleutels = providerSleutels(p)
  const hoofdsleutel = healthHoofdsleutel()
  if (!adapter || !sleutels || !hoofdsleutel || providerStatus(p) !== 'beschikbaar') return null
  return { bron, adapter, sleutels, hoofdsleutel, redirectUri: redirectUri(healthRedirectBasis(), bron) }
}

/** Een bron uit de route, of null. */
export async function bronUitParams(params: Promise<{ bron: string }>): Promise<BronId | null> {
  const { bron } = await params
  return isBronId(bron) ? bron : null
}

/** De poort voor /api/club/lid/health: schakelaar aan en een lid (of Kane in de voorvertoning). */
export async function vereisLidHealth(req: NextRequest): Promise<LidToegang | NextResponse> {
  if (!healthActief()) return clubFout('Niet gevonden.', 404)
  return vereisLidToegang(req, 'profiel')
}

/** Terug naar de pagina Koppelingen met een melding (alleen vaste codes, nooit tekst van buiten). */
export function terugNaarKoppelingen(req: NextRequest, melding: { gekoppeld?: BronId; fout?: string }): NextResponse {
  const url = new URL(KOPPELINGEN_PAD, req.nextUrl.origin)
  if (melding.gekoppeld) url.searchParams.set('gekoppeld', melding.gekoppeld)
  if (melding.fout) url.searchParams.set('fout', melding.fout)
  const res = NextResponse.redirect(url, 303)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('Referrer-Policy', 'no-referrer')
  return res
}
