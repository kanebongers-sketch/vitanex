import { NextResponse, type NextRequest } from 'next/server'
import { clubFout } from '@/lib/club/toegang'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { DOORVERWIJZING_SECONDEN, isFotoSoort, isUuid, maatUitTekst } from '@/lib/club/profielfoto/model'
import { getekendeFotoUrl, haalFotoPad } from '@/lib/club/profielfoto/opslag'

// GET /api/club/lid/profielfoto/<lid|mw>/<id>/<256|512>?v=<versie>
// In de ledenapp: het lid ziet de eigen foto en die van de medewerkers van de
// eigen sportschool (coach, instructeurs). Nooit de foto van een ander lid.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ soort: string; id: string; maat: string }> }) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  const { soort, id, maat: maatTekst } = await params
  const maat = maatUitTekst(maatTekst)
  if (!isFotoSoort(soort) || !isUuid(id) || !maat) return clubFout('Niet gevonden.', 404)
  if (soort === 'lid' && id.toLowerCase() !== l.lid.id.toLowerCase()) return clubFout('Niet gevonden.', 404)
  const pad = await haalFotoPad(l.admin, { userId: l.userId, soort, id })
  if (!pad) return clubFout('Niet gevonden.', 404)
  const url = await getekendeFotoUrl(l.admin, pad, maat)
  if (!url) return clubFout('Niet gevonden.', 404)
  return NextResponse.redirect(url, {
    status: 302,
    headers: { 'Cache-Control': `private, max-age=${DOORVERWIJZING_SECONDEN}`, 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' },
  })
}
