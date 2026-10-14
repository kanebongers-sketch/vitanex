import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, vereisClubToegang } from '@/lib/club/toegang'
import { leesOefening, oefeningNaarRij } from '@/lib/club/training/invoer'
import { isUuid } from '@/lib/club/training/typen'

// PATCH /api/club/training/oefeningen/[id]: een oefening bewerken (of op inactief zetten).
// Verwijderen kan niet: schema's verwijzen ernaar. Inactief haalt hem uit het voorstel en de kiezer.

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t

  const { id } = await params
  if (!isUuid(id)) return clubFout('Onbekende oefening.', 404)
  const body: unknown = await req.json().catch(() => null)
  const invoer = leesOefening(body)
  if (!invoer.ok) return clubFout(invoer.fout, 400)

  const { data, error } = await t.admin
    .from('club_oefeningen')
    .update(oefeningNaarRij(invoer.waarde))
    .eq('user_id', t.userId)
    .eq('id', id)
    .select('id')
  if (error) {
    if (error.code === '23505') return clubFout('Er is al een oefening met deze naam.', 409)
    console.error('[club/training] oefening bewerken mislukt', error.message)
    return clubFout('De oefening kon niet worden opgeslagen.', 500)
  }
  if (!data || data.length === 0) return clubFout('Onbekende oefening.', 404)
  return clubJson({ id })
}
