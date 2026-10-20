// ─── Club, boekingswidget: de stap in de proxy (SERVER) ─────────────────────
// Alleen voor /widget/... en /api/widget/...; al het andere krijgt null en gaat
// verder zoals altijd. De widget-pagina mag in een iframe op de website van de
// sportschool: next.config.ts laat X-Frame-Options en de algemene CSP weg voor
// /widget/, en hier komt de CSP met frame-ancestors voor precies deze
// sportschool en vestiging. Op releasev.nl bestaat de widget niet.
//
// De domeinen komen uit de database (club_widget_kader, migratie 448) via een
// kale REST-aanroep met de service-role; een minuut in het geheugen bewaard.
// Lukt het lezen niet, dan alleen onze eigen site ('self').

import { NextResponse, type NextRequest } from 'next/server'
import { isReleaseVHost } from '@/releasev/lib/host-routing'
import { WIDGET_PREFIX, frameAncestors, kaderUitJson, leesWidgetPad, widgetCsp, type WidgetKader } from './kader'
import { widgetActief } from './schakelaar'

const BEWAAR_MS = 60_000
const MAX_BEWAARD = 500
const bewaard = new Map<string, { kader: WidgetKader | null; tot: number }>()

async function leesKader(sportschool: string, vestiging: string): Promise<WidgetKader | null> {
  const url = process.env.LIFEOS_SUPABASE_URL
  const key = process.env.LIFEOS_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    const res = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/rpc/club_widget_kader`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_slug: sportschool, p_vestiging: vestiging }),
      cache: 'no-store',
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) {
      console.error('[club/widget] kader lezen mislukt', res.status)
      return null
    }
    return kaderUitJson(await res.json())
  } catch (fout) {
    console.error('[club/widget] kader lezen mislukt', fout instanceof Error ? fout.message : 'onbekend')
    return null
  }
}

async function kaderVoor(sportschool: string, vestiging: string): Promise<WidgetKader | null> {
  const sleutel = `${sportschool}/${vestiging}`
  const nu = Date.now()
  const hit = bewaard.get(sleutel)
  if (hit && hit.tot > nu) return hit.kader
  const kader = await leesKader(sportschool, vestiging)
  if (bewaard.size >= MAX_BEWAARD) bewaard.clear()
  bewaard.set(sleutel, { kader, tot: nu + BEWAAR_MS })
  return kader
}

/** De proxy-stap voor de widget; null = niet van de widget. */
export async function widgetProxy(request: NextRequest): Promise<NextResponse | null> {
  const pad = request.nextUrl.pathname
  const vanWidget = pad.startsWith(`${WIDGET_PREFIX}/`) || pad.startsWith('/api/widget/')
  if (!vanWidget) return null
  const host = (request.headers.get('host') ?? '').split(':')[0].toLowerCase()
  if (isReleaseVHost(host)) return null
  // De API en het script: gewoon door, op elk domein (geen herschrijving naar Club of de website).
  if (pad.startsWith('/api/widget/')) return NextResponse.next()
  const route = leesWidgetPad(pad)
  const actief = widgetActief()
  const kader = route && actief ? await kaderVoor(route.sportschool, route.vestiging) : null
  const response = NextResponse.next()
  // Ook het script en onbekende paden krijgen een CSP; frame-ancestors daar 'self' of strenger.
  const ancestors = route ? frameAncestors(actief, kader) : "'none'"
  response.headers.set('Content-Security-Policy', widgetCsp(ancestors, process.env.NODE_ENV === 'production'))
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}
