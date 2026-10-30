import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, clubToegang } from '@/lib/club/toegang'
import { isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { eigenProfielId } from '@/lib/club/profielfoto/toegang'
import { isUitlegCode } from '@/lib/club/rollen/welkom'
import { bewaarGezien } from '@/lib/club/uitleg/opslag'

// POST /api/club/uitleg  { code: "trainer:v1" }
// Onthoudt per account dat iemand de eerste-keer-uitleg wegklikte (migratie
// 476). Iedereen die binnen is mag dit voor zichzelf, los van de rechten per
// onderdeel; wie het is komt altijd uit de sessie (het eigen profiel).

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const t = await clubToegang()
  if (!t) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  const gelezen = await leesJsonOfTeGroot(req, 1024)
  if (gelezen instanceof NextResponse) return gelezen
  const code = (gelezen.body as { code?: unknown } | null)?.code
  if (!isUitlegCode(code)) return clubFout('Onbekende uitleg.', 400)
  const id = await eigenProfielId(t)
  // Zonder eigen profiel (het master account) onthoudt alleen de browser het.
  if (!id) return clubJson({ ok: true, bewaard: false })
  if (!(await bewaarGezien(t.admin, t.userId, { soort: 'profiel', id }, code))) return clubFout('Opslaan lukte niet.', 500)
  return clubJson({ ok: true, bewaard: true })
}
