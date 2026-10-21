import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisPlatformEigenaar } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isUuid } from '@/lib/club/kern/organisatie'
import { MAX_BODY_BYTES, leesAfhandeling } from '@/lib/club/hulp/melding'
import { handelAf } from '@/lib/club/hulp/opslag'

// PATCH /api/club/hulp/[id] { status, antwoord? }
// Alleen Kane: status van een melding wijzigen en een antwoord geven dat de
// melder in het helpcentrum ziet. Anderen krijgen een 404.

export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisPlatformEigenaar(req)
  if (t instanceof NextResponse) return t
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Melding niet gevonden.', 404)
  const gelezen = await leesJsonOfTeGroot(req, MAX_BODY_BYTES)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesAfhandeling(gelezen.body)
  if (!invoer.ok) return clubJson({ fout: 'Controleer de gemarkeerde velden.', fouten: invoer.fouten }, 400)
  const uitslag = await handelAf(t, id, invoer.waarde, new Date())
  if (uitslag === 'niet-gevonden') return clubFout('Melding niet gevonden.', 404)
  if (!uitslag) return clubFout('Opslaan lukte niet. Probeer het later opnieuw.', 500)
  return clubJson({ melding: uitslag })
}
