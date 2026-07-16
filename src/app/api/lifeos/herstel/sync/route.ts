// POST /api/lifeos/herstel/sync — haalt de laatste dagen op bij elke gekoppelde
// dienst.
//
// Idempotent: twee keer draaien geeft hetzelfde resultaat (upsert op
// user_id + bron + datum).
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`. Die levert de service-role
// client op het LifeOS-project (`toegang.admin`) en het vaste eigenaar-id
// (`toegang.userId`) waarop alle queries filteren.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { syncHerstel, type SyncResultaat } from '@/lib/lifeos/herstel/sync'
import { isoDatum, vandaagLokaal } from '@/lib/lifeos/herstel/tijd'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const toegang = await vereisLifeosToegang(request)
  if (toegang instanceof NextResponse) return toegang

  // De client mag zijn eigen kalenderdag meesturen — die weet zeker in welke
  // tijdzone de gebruiker zit. Ontbreekt hij of klopt hij niet, dan valt de
  // route terug op de serverdag in de tijdzone uit TZ (zie .env.example).
  const gevraagd = request.nextUrl.searchParams.get('vandaag')
  const vandaag = isoDatum(gevraagd) ?? vandaagLokaal()

  let resultaat: SyncResultaat
  try {
    resultaat = await syncHerstel(toegang.admin, toegang.userId, vandaag)
  } catch (fout) {
    // Alles stuk (bv. de database plat). Dit is een fout, geen lege week.
    console.error('[herstel] sync mislukt', fout)
    return NextResponse.json({ fout: 'synchroniseren mislukt' }, { status: 500 })
  }

  const mislukt = resultaat.bronnen.filter((b) => b.status === 'fout')

  // De status zegt de waarheid, óók voor een client die alleen naar `res.ok`
  // kijkt. Een 200 terwijl je Whoop-token verlopen is, is precies hoe een fout
  // stilletjes "geen data" wordt.
  const status = mislukt.length === 0
    ? 200
    : mislukt.length === resultaat.bronnen.length
      ? 502 // alles mislukt
      : 207 // deels gelukt

  return NextResponse.json(
    {
      gekoppeld: resultaat.gekoppeld,
      bronnen: resultaat.bronnen,
      vandaag,
    },
    { status, headers: { 'cache-control': 'no-store' } },
  )
}
