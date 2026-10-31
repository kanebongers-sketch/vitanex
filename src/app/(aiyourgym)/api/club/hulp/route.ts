import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isGeremd } from '@/lib/club/kern/rem-db'
import { MAX_BODY_BYTES, leesMelding } from '@/lib/club/hulp/melding'
import { bewaarMelding, eigenMeldingen, teVeelMeldingen, vereisHulpToegang } from '@/lib/club/hulp/opslag'

// GET  /api/club/hulp   de eigen meldingen (met het antwoord van Kane)
// POST /api/club/hulp   { soort, onderwerp, beschrijving, pagina? } een vraag, probleem of wens melden
// Iedereen die in Club binnen is; opgeslagen in club_support, er gaat geen mail naar buiten.

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const t = await vereisHulpToegang(req)
  if (t instanceof NextResponse) return t
  const lijst = await eigenMeldingen(t)
  return lijst ? clubJson({ meldingen: lijst }) : clubFout('Je meldingen konden niet worden gelezen.', 500)
}

export async function POST(req: NextRequest) {
  const t = await vereisHulpToegang(req)
  if (t instanceof NextResponse) return t
  if (await isGeremd({ soort: 'club-hulp', max: 5, vensterMs: 10 * 60_000, bijStoring: 'geheugen' }, `${t.userId}:${t.persoonId ?? 'kane'}`)) return clubFout('Te veel meldingen achter elkaar. Probeer het over een paar minuten opnieuw.', 429)
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY_BYTES)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesMelding(gelezen.body)
  if (!invoer.ok) return clubJson({ fout: 'Controleer de gemarkeerde velden.', fouten: invoer.fouten }, 400)
  const teVeel = await teVeelMeldingen(t, new Date())
  if (teVeel === null) return clubFout('Melden lukte niet. Probeer het later opnieuw.', 500)
  if (teVeel) return clubFout('Er zijn het afgelopen uur al veel meldingen gedaan. Probeer het later opnieuw.', 429)
  const melding = await bewaarMelding(t, invoer.waarde)
  return melding ? clubJson({ melding }, 201) : clubFout('Melden lukte niet. Probeer het later opnieuw.', 500)
}
