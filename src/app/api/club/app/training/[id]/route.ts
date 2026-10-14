import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/app/invoer'

// DELETE /api/club/app/training/[id]
// Een afgevinkte training weer ongedaan maken (per ongeluk aangetikt).

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  const { data, error } = await t.admin.from('club_trainingslog').delete().eq('user_id', t.userId).eq('id', id).select('id, lid_id')
  if (error) {
    console.error('[club/app] afvinken ongedaan maken mislukt', error.message)
    return clubFout('Ongedaan maken is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (!data || data.length === 0) return clubFout('Niet gevonden.', 404)
  await logActie(t, 'Afgevinkte training ongedaan gemaakt', null, null)
  return clubJson({ ok: true })
}
