import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { leesOefening } from '@/lib/club/training/invoer'

// POST /api/club/training/oefeningen: een eigen oefening toevoegen.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const body: unknown = await req.json().catch(() => null)
  const invoer = leesOefening(body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)

  const { data, error } = await t.admin
    .from('club_oefeningen')
    .insert({ user_id: t.userId, ...invoer.waarde })
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') return clubFout('Er is al een oefening met deze naam.', 409)
    console.error('[club/training] oefening toevoegen mislukt', error.message)
    return clubFout('De oefening kon niet worden opgeslagen.', 500)
  }
  return clubJson({ id: typeof data?.id === 'string' ? data.id : null }, 201)
}
