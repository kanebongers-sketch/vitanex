// POST /api/club/lid/health/native  { bron: 'apple_health' | 'health_connect', metingen: [...] }
// De app op de telefoon stuurt hier wat hij uit Apple Gezondheid of Health
// Connect las. We controleren alles opnieuw (grenzen, data, dubbelen) en
// bewaren alleen de soorten waarvoor het lid toestemming gaf. De bron wordt
// opgelegd door de route; een bron of lid in de metingen telt nooit.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidHealth } from '@/lib/club/health/server'
import { bewaarKoppeling, bewaarMetingen, haalKoppeling, haalToestemming, werkKoppelingBij } from '@/lib/club/health/opslag'
import { leesNativeBody, schoneMetingen } from '@/lib/club/health/metingen'
import { filterOpDelen, heeftToestemmingVoor } from '@/lib/club/health/toestemming'
import { PROVIDERS, providerStatus } from '@/lib/club/health/providers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY = 600_000

export async function POST(req: NextRequest) {
  const l = await vereisLidHealth(req)
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesNativeBody(gelezen.body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (providerStatus(PROVIDERS[invoer.bron]) !== 'alleen_app') return clubFout('Deze koppeling is nog niet beschikbaar.', 404)
  if (l.voorvertoning) return clubJson({ ok: true, voorvertoning: true, verwerkt: 0 })

  const toestemming = await haalToestemming(l.admin, l.userId, l.lid.id)
  if (!toestemming) return clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
  if (!heeftToestemmingVoor(toestemming, PROVIDERS[invoer.bron].soorten)) return clubFout('Kies eerst welke gegevens je wilt delen.', 403)

  const nu = new Date()
  const bestaand = await haalKoppeling(l.admin, l.userId, l.lid.id, invoer.bron)
  if (bestaand === undefined) return clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
  const koppeling = bestaand ?? (await bewaarKoppeling(l.admin, { userId: l.userId, lidId: l.lid.id, bron: invoer.bron, wijziging: { status: 'actief', tokensVersleuteld: null } }))
  if (!koppeling) return clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)

  const teBewaren = schoneMetingen(filterOpDelen(invoer.metingen, toestemming), nu)
  const verwerkt = teBewaren.length > 0 ? await bewaarMetingen(l.admin, l.userId, l.lid.id, teBewaren) : 0
  if (verwerkt === null) return clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
  await werkKoppelingBij(l.admin, koppeling, { status: 'actief', laatsteSyncOp: nu.toISOString(), laatsteFout: null, foutPogingen: 0 })
  return clubJson({ ok: true, verwerkt, overgeslagen: invoer.metingen.length - teBewaren.length })
}
