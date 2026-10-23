// ─── /api/aiyourgym/health/webhook/<bron>?t=<token>: meldingen van leveranciers
// Eerste slot voor elke bron: het geheime token in het adres (webhook.ts).
// Daarbovenop de handtekening waar de leverancier die geeft (Polar, WHOOP).
// Een melding zet alleen de koppeling op "nu bijwerken" (of intrekken); de
// gegevens haalt de cron daarna zelf op. Antwoordt altijd snel en zonder details.
// Met CLUB_HEALTH_ACTIEF uit of zonder sleutel: 404.

import { NextResponse, type NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { healthHoofdsleutel, healthKlaar } from '@/lib/club/health/schakelaar'
import { verwerkWebhook } from '@/lib/club/health/opslag-cron'
import { isBronId, type BronId } from '@/lib/club/health/typen'
import { PROVIDERS, providerSleutels } from '@/lib/club/health/providers'
import {
  ouraControle, polarGebeurtenis, polarHandtekeningKlopt, stravaControle, stravaGebeurtenis, tokenKlopt,
  whoopGebeurtenis, whoopHandtekeningKlopt, withingsGebeurtenis, type WebhookGebeurtenis,
} from '@/lib/club/health/webhook'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY = 64_000

function leeg(status: number): NextResponse {
  return new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } })
}

function json(body: Record<string, unknown>): NextResponse {
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } })
}

/** De bron uit de route als alles aan staat en het token in het adres klopt. */
async function poort(req: NextRequest, params: Promise<{ bron: string }>): Promise<{ bron: BronId; sleutel: Buffer } | null> {
  const { bron } = await params
  const sleutel = healthHoofdsleutel()
  if (!healthKlaar() || !sleutel || !isBronId(bron) || !PROVIDERS[bron].webhooks || !PROVIDERS[bron].adapter) return null
  return tokenKlopt(bron, req.nextUrl.searchParams.get('t'), sleutel) ? { bron, sleutel } : null
}

/** Controle van het adres bij het aanmelden (Strava, Oura) en de test van Withings. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ bron: string }> }) {
  const p = await poort(req, params)
  if (!p) return leeg(404)
  if (p.bron === 'strava') {
    const challenge = stravaControle(req.nextUrl.searchParams, p.sleutel)
    return challenge ? json({ 'hub.challenge': challenge }) : leeg(404)
  }
  if (p.bron === 'oura') {
    const challenge = ouraControle(req.nextUrl.searchParams, p.sleutel)
    return challenge ? json({ challenge }) : leeg(404)
  }
  return leeg(200)
}

export const HEAD = GET

function gebeurtenis(bron: BronId, rauw: string, req: NextRequest): WebhookGebeurtenis | null | 'geweigerd' {
  if (bron === 'withings') return withingsGebeurtenis(new URLSearchParams(rauw))
  let body: unknown = null
  try {
    body = JSON.parse(rauw) as unknown
  } catch {
    return null
  }
  if (bron === 'strava') return stravaGebeurtenis(body, process.env.CLUB_HEALTH_STRAVA_ABONNEMENT_ID?.trim() || undefined)
  if (bron === 'polar') {
    if (!polarHandtekeningKlopt(rauw, req.headers.get('polar-webhook-signature'), process.env.CLUB_HEALTH_POLAR_WEBHOOK_SECRET?.trim())) return 'geweigerd'
    return polarGebeurtenis(body)
  }
  if (bron === 'whoop') {
    const secret = providerSleutels(PROVIDERS.whoop)?.secret
    if (!whoopHandtekeningKlopt(rauw, req.headers.get('x-whoop-signature'), req.headers.get('x-whoop-signature-timestamp'), secret, new Date())) return 'geweigerd'
    return whoopGebeurtenis(body)
  }
  // Oura: meldingen zijn nog niet aan een lid te koppelen; de vaste ronde haalt alles op.
  return null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ bron: string }> }) {
  const p = await poort(req, params)
  if (!p) return leeg(404)
  const rauw = await req.text().catch(() => '')
  if (rauw.length > MAX_BODY) return leeg(413)
  const g = gebeurtenis(p.bron, rauw, req)
  if (g === 'geweigerd') return leeg(401)
  if (!g) return leeg(200)
  try {
    const gelukt = await verwerkWebhook(clubDatabase(), p.bron, g.externGebruikerId, g.actie)
    // Bij een fout een 500: de leverancier probeert het dan later opnieuw.
    return leeg(gelukt ? 200 : 500)
  } catch (err) {
    console.error('[club-health] webhook mislukt', err instanceof Error ? err.name : 'onbekend')
    return leeg(500)
  }
}
