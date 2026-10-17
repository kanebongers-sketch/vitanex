import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisKane } from '@/lib/club/toegang'
import { leesSlug } from '@/lib/club/kern/subdomein'

// PATCH /api/club/organisatie/adres  { slug }
// Het eigen adres van de sportschool die open staat: <slug>.aiyourgym.com.
// Uniek over alle sportscholen (unieke index, migratie 408).

export async function PATCH(req: NextRequest) {
  const t = await vereisKane(req)
  if (t instanceof NextResponse) return t
  const body: unknown = await req.json().catch(() => null)
  const uitslag = leesSlug(typeof body === 'object' && body !== null ? (body as Record<string, unknown>).slug : null)
  if (!uitslag.ok) return clubFout(uitslag.fout, 400)
  const { error } = await t.admin
    .from('club_organisaties')
    .update({ slug: uitslag.slug, bijgewerkt_op: new Date().toISOString() })
    .eq('id', t.organisatie.id)
    .eq('beheerder_id', t.beheerderId)
  if (error) {
    if (error.code === '23505') return clubFout('Dit adres is al in gebruik door een andere sportschool.', 409)
    console.error('[club] adres opslaan mislukt', error.message)
    return clubFout('Het adres kon niet worden opgeslagen.', 500)
  }
  await logActie(t, 'Adres gekozen', uitslag.slug, null)
  return clubJson({ slug: uitslag.slug })
}
