import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubToegang } from '@/lib/club/toegang'
import { DOORVERWIJZING_SECONDEN, isFotoSoort, isUuid, maatUitTekst } from '@/lib/club/profielfoto/model'
import { getekendeFotoUrl, haalFotoPad } from '@/lib/club/profielfoto/opslag'

// GET /api/club/profielfoto/<lid|mw>/<id>/<256|512>?v=<versie>
// Een profielfoto in Club. Iedereen die in deze sportschool in Club werkt ziet
// de foto's van de eigen leden en collega's (net als het logo): ze staan op
// Vandaag, in het rooster en in het team. Nooit van een andere sportschool:
// het pad komt uit de database, gefilterd op de sportschool van de sessie.
// Antwoord: een doorverwijzing naar een kort geldige getekende URL.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ soort: string; id: string; maat: string }> }) {
  const t = await clubToegang()
  if (!t) return clubFout('Niet gevonden.', 404)
  const { soort, id, maat: maatTekst } = await params
  const maat = maatUitTekst(maatTekst)
  if (!isFotoSoort(soort) || !isUuid(id) || !maat) return clubFout('Niet gevonden.', 404)
  const pad = await haalFotoPad(t.admin, { userId: t.userId, soort, id })
  if (!pad) return clubFout('Niet gevonden.', 404)
  const url = await getekendeFotoUrl(t.admin, pad, maat)
  if (!url) return clubFout('Niet gevonden.', 404)
  return NextResponse.redirect(url, {
    status: 302,
    headers: { 'Cache-Control': `private, max-age=${DOORVERWIJZING_SECONDEN}`, 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer' },
  })
}
