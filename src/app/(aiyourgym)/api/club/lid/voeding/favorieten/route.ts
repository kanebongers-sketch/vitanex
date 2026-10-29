// POST   /api/club/lid/voeding/favorieten  { productSleutel, naam, merk?, per100, portieGram? }
// DELETE /api/club/lid/voeding/favorieten?sleutel=off:8712345678901

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { zonderLid } from '@/lib/club/ledenlogin/toegang'
import { leesFavoriet } from '@/lib/club/voeding/dagboek/invoer'
import { isProductSleutel } from '@/lib/club/voeding/dagboek/model'
import { haalFavorietWeg, zetFavoriet } from '@/lib/club/voeding/dagboek/opslag'
import { vereisLidVoeding } from '@/lib/club/voeding/dagboek/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidVoeding(req, { schrijft: true, gestart: true })
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 2048)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesFavoriet(zonderLid(gelezen.body))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const ok = await zetFavoriet(l.admin, l.userId, l.lid.id, invoer.waarde)
  return ok ? clubJson({ ok: true }) : clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
}

export async function DELETE(req: NextRequest) {
  const l = await vereisLidVoeding(req, { schrijft: true })
  if (l instanceof NextResponse) return l
  const sleutel = req.nextUrl.searchParams.get('sleutel')
  if (!isProductSleutel(sleutel)) return clubFout('Niet gevonden.', 404)
  const ok = await haalFavorietWeg(l.admin, l.userId, l.lid.id, sleutel)
  return ok ? clubJson({ ok: true }) : clubFout('Verwijderen lukt nu niet. Probeer het opnieuw.', 500)
}
