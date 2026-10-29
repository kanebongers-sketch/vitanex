// GET /api/club/lid/voeding/barcode?code=8712345678901
// Eerst de eigen producten van het lid met die barcode, anders Open Food Facts.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { isBarcode } from '@/lib/club/voeding/dagboek/off'
import { productVanEigen } from '@/lib/club/voeding/dagboek/model'
import { eigenProductMetBarcode } from '@/lib/club/voeding/dagboek/opslag'
import { barcodeOff, teVaak, vereisLidVoeding } from '@/lib/club/voeding/dagboek/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidVoeding(req)
  if (l instanceof NextResponse) return l
  const code = req.nextUrl.searchParams.get('code')?.trim() ?? ''
  if (!isBarcode(code)) return clubFout('Een barcode bestaat uit 6 tot 14 cijfers.', 400)
  if (teVaak('barcode', l.lid.id, 30)) return clubFout('Even rustig aan. Probeer het over een minuut opnieuw.', 429)
  const eigen = await eigenProductMetBarcode(l.admin, l.userId, l.lid.id, code)
  if (eigen === null) return clubFout('Zoeken lukt nu niet. Probeer het opnieuw.', 500)
  if (eigen) return clubJson({ product: productVanEigen(eigen) })
  const uitslag = await barcodeOff(code, await getTaal())
  if (!uitslag.ok) return clubFout('Open Food Facts is nu niet bereikbaar. Probeer het straks opnieuw.', 502)
  return clubJson({ product: uitslag.waarde })
}
