// POST /api/club/lid/health/ontkoppelen/<bron>  { wissen: boolean }
// Ontkoppelen: eerst bij de leverancier intrekken (als de API dat kan), dan de
// tokens en de koppeling weg. Met wissen: true ook alle metingen van die bron.
// Eist de leverancier dat (Strava, regels.wissenBijOntkoppelen), dan wissen we altijd.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { bronUitParams, vereisLidHealth } from '@/lib/club/health/server'
import { echteHttp, haalKoppeling, verwijderKoppeling, wisMetingen } from '@/lib/club/health/opslag'
import { trekIn } from '@/lib/club/health/sync'
import { adapterVoor } from '@/lib/club/health/adapters'
import { PROVIDERS, providerSleutels } from '@/lib/club/health/providers'
import { healthHoofdsleutel } from '@/lib/club/health/schakelaar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ bron: string }> }) {
  const l = await vereisLidHealth(req)
  if (l instanceof NextResponse) return l
  const bron = await bronUitParams(params)
  if (!bron) return clubFout('Onbekende koppeling.', 404)
  const gelezen = await leesJsonOfTeGroot(req, 1024)
  if (gelezen instanceof NextResponse) return gelezen
  const body = typeof gelezen.body === 'object' && gelezen.body !== null ? (gelezen.body as Record<string, unknown>) : {}
  const wissen = body.wissen === true || PROVIDERS[bron].regels.wissenBijOntkoppelen
  if (l.voorvertoning) return clubJson({ ok: true, voorvertoning: true })

  const koppeling = await haalKoppeling(l.admin, l.userId, l.lid.id, bron)
  if (koppeling === undefined) return clubFout('Ontkoppelen lukt nu niet. Probeer het opnieuw.', 500)

  let bijLeverancier: 'ingetrokken' | 'niet_mogelijk' | 'mislukt' = 'niet_mogelijk'
  const adapter = adapterVoor(bron)
  const sleutels = providerSleutels(PROVIDERS[bron])
  const hoofdsleutel = healthHoofdsleutel()
  if (koppeling && adapter && sleutels && hoofdsleutel) {
    bijLeverancier = (await trekIn({ adapter, sleutels, hoofdsleutel, http: echteHttp }, koppeling)).bijLeverancier
  }
  if (koppeling && !(await verwijderKoppeling(l.admin, l.userId, l.lid.id, bron))) return clubFout('Ontkoppelen lukt nu niet. Probeer het opnieuw.', 500)
  const gewist = wissen ? await wisMetingen(l.admin, l.userId, l.lid.id, bron) : false
  return clubJson({ ok: true, bijLeverancier, gewist })
}
