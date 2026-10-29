// POST /api/club/lid/voeding/producten  { naam, merk?, barcode?, per100, portieGram? }  een eigen product

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { zonderLid } from '@/lib/club/ledenlogin/toegang'
import { leesProduct } from '@/lib/club/voeding/dagboek/invoer'
import { bewaarEigenProduct } from '@/lib/club/voeding/dagboek/opslag'
import { teVaak, vereisLidVoeding } from '@/lib/club/voeding/dagboek/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidVoeding(req, { schrijft: true, gestart: true })
  if (l instanceof NextResponse) return l
  if (teVaak('product', l.lid.id, 20)) return clubFout('Even rustig aan. Probeer het over een minuut opnieuw.', 429)
  const gelezen = await leesJsonOfTeGroot(req, 2048)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesProduct(zonderLid(gelezen.body))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const product = await bewaarEigenProduct(l.admin, l.userId, l.lid.id, invoer.waarde)
  return product ? clubJson({ product }, 201) : clubFout('Opslaan lukt nu niet. Probeer het opnieuw.', 500)
}
