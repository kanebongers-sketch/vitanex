// DELETE /api/club/leden/aanmeldlinks/[id]  een aanmeldlink intrekken.
// Daarna werken de link en zijn QR niet meer (404 zonder iets van de
// sportschool te tonen). Onderdeel Leden (bewerken). Alleen eigen vestigingen.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalLink, trekLinkIn } from '@/lib/club/nieuwe-leden/links-opslag'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const f = NIEUWE_LEDEN[await getTaal()].fouten
  const { id } = await ctx.params
  const link = await haalLink(t.admin, t.userId, id)
  if (link === undefined) return clubFout(f.laden, 500)
  if (!link || !t.vestigingen.some((v) => v.sleutel === link.vestiging)) return clubFout(f.onbekend, 404)
  if (!link.ingetrokkenOp && !(await trekLinkIn(t.admin, t.userId, link.id, new Date()))) return clubFout(f.opslaan, 500)
  await logActie(t, 'Aanmeldlink ingetrokken', link.naam, link.vestiging)
  return clubJson({ ok: true })
}
