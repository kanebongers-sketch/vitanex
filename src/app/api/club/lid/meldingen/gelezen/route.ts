// POST /api/club/lid/meldingen/gelezen  (zonder body)
// Het ingelogde lid heeft zijn meldingen geopend: alles op gelezen. Het lid komt
// altijd uit de sessie (vereisLidToegang), nooit uit de vraag of de body. In de
// voorvertoning kijkt Kane alleen mee: dan verandert er niets voor het lid.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { markeerMeldingenGelezen } from '@/lib/club/meldingen/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  if (l.voorvertoning) return clubJson({ ok: true, voorvertoning: true })
  const gelukt = await markeerMeldingenGelezen(l.admin, l.userId, l.lid.id)
  return gelukt ? clubJson({ ok: true }) : clubFout('Bijwerken lukt nu niet. Probeer het later opnieuw.', 500)
}
