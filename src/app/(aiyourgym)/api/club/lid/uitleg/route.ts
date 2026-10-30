import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isUitlegCode } from '@/lib/club/rollen/welkom'
import { bewaarGezien } from '@/lib/club/uitleg/opslag'

// POST /api/club/lid/uitleg  { code: "leden:v1" }
// Het lid klikte de eerste-keer-uitleg in de ledenapp weg (migratie 476). Het
// lid komt altijd uit de sessie. In de voorvertoning van Kane verandert er
// niets in de database; daar onthoudt alleen de browser het.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 1024)
  if (gelezen instanceof NextResponse) return gelezen
  const code = (gelezen.body as { code?: unknown } | null)?.code
  if (!isUitlegCode(code)) return clubFout('Onbekende uitleg.', 400)
  if (l.voorvertoning) return clubJson({ ok: true, bewaard: false })
  if (!(await bewaarGezien(l.admin, l.userId, { soort: 'lid', id: l.lid.id }, code))) return clubFout('Opslaan lukte niet.', 500)
  return clubJson({ ok: true, bewaard: true })
}
