import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang, type ClubToegang } from '@/lib/club/toegang'
import { leesCoaching } from '@/lib/club/training/coaching/invoer'
import type { Coaching } from '@/lib/club/training/coaching/typen'
import { isUuid } from '@/lib/club/training/typen'

// PATCH  /api/club/training/oefeningen/[id]/coaching  eigen coaching opslaan
// DELETE /api/club/training/oefeningen/[id]/coaching  terug naar de standaardcoaching
// Alleen voor oefeningen van de sportschool die open staat. Eerst de toegang,
// dan pas de invoer: voor iedereen anders bestaat deze route niet (404).

async function bewaar(t: ClubToegang, id: string, coaching: Coaching | null) {
  if (!isUuid(id)) return clubFout('Onbekende oefening.', 404)
  const { data, error } = await t.admin.from('club_oefeningen').update({ coaching }).eq('user_id', t.userId).eq('id', id).select('naam')
  if (error) {
    console.error('[club/training] coaching opslaan mislukt', error.message)
    return clubFout('De coaching kon niet worden opgeslagen.', 500)
  }
  const naam = data?.[0]?.naam
  if (typeof naam !== 'string') return clubFout('Onbekende oefening.', 404)
  await logActie(t, coaching ? 'Coaching aangepast' : 'Coaching teruggezet', naam, null)
  return clubJson({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesCoaching(await req.json().catch(() => null))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return bewaar(t, (await params).id, invoer.waarde)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  return bewaar(t, (await params).id, null)
}
