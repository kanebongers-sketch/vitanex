// POST /api/club/leden/[id]/gezien  { wat: "aanmelding" of "intake" }
// De melding "Nieuwe aanmelding via link" of "Intake ingevuld" van dit lid weg
// van Vandaag. Onderdeel Leden. Het lid moet in een eigen vestiging staan.

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid } from '@/lib/club/kern/lid'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { markeerGezien } from '@/lib/club/nieuwe-leden/meldingen'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { NIEUWE_LEDEN } from '@/lib/aiyourgym/taal/woorden/club/nieuwe-leden'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const f = NIEUWE_LEDEN[await getTaal()].fouten
  const { id } = await ctx.params
  const lid = await haalLid(t.admin, t.userId, id)
  if (!lid || !hoortBij(t.vestigingen, lid.vestiging)) return clubFout(f.onbekend, 404)
  const gelezen = await leesJsonOfTeGroot(req, 200)
  if (gelezen instanceof NextResponse) return gelezen
  const wat = typeof gelezen.body === 'object' && gelezen.body !== null ? (gelezen.body as Record<string, unknown>).wat : null
  if (wat !== 'aanmelding' && wat !== 'intake') return clubFout(f.laden, 400)
  if (!(await markeerGezien(t.admin, t.userId, lid.id, wat, new Date()))) return clubFout(f.opslaan, 500)
  return clubJson({ ok: true })
}
