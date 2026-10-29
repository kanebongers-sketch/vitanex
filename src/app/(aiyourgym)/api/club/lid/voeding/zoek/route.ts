// GET /api/club/lid/voeding/zoek?q=...  producten uit Open Food Facts (gratis, zonder sleutel)
// Via onze server, zodat de telefoon van het lid niet zelf met een derde praat.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { schoneZoekterm } from '@/lib/club/voeding/dagboek/off'
import { teVaak, vereisLidVoeding, zoekOff } from '@/lib/club/voeding/dagboek/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidVoeding(req)
  if (l instanceof NextResponse) return l
  const term = schoneZoekterm(req.nextUrl.searchParams.get('q'))
  if (!term) return clubJson({ producten: [] })
  if (teVaak('zoek', l.lid.id, 20)) return clubFout('Even rustig aan. Probeer het over een minuut opnieuw.', 429)
  const uitslag = await zoekOff(term, await getTaal())
  if (!uitslag.ok) return clubFout('Zoeken lukt nu niet. Probeer het straks opnieuw of voeg het zelf toe.', 502)
  return clubJson({ producten: uitslag.waarde })
}
