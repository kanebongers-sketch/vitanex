import { type NextRequest, NextResponse } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'
import { isRij } from '@/lib/club/training/rijen'
import { lidVestiging } from '@/lib/club/training/schrijven'
import { isUuid } from '@/lib/club/training/typen'

// POST /api/club/training/schemas/[id]/overnemen
// Een schema dat het lid zelf maakte, wordt een schema van de trainer. Het lid
// ziet het daarna als "Van je trainer" en past het alleen nog aan als de
// sportschool dat toestaat. Was het actief, dan gaat het vorige actieve schema
// van de trainer naar afgerond (een trainerschema tegelijk, zoals bij actief zetten).

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Onbekend schema.', 404)
  const buiten = await eisVestigingVanRecord(t, 'club_schemas', id)
  if (buiten) return buiten

  const { data, error } = await t.admin.from('club_schemas').select('lid_id, naam, status, maker').eq('user_id', t.userId).eq('id', id).maybeSingle()
  if (error) {
    console.error('[club/training] schema lezen mislukt', error.message)
    return clubFout('Het schema kon niet worden gelezen.', 500)
  }
  if (!isRij(data) || typeof data.lid_id !== 'string') return clubFout('Onbekend schema.', 404)
  if (data.maker !== 'lid') return clubFout('Dit schema is al van de trainer.', 409)
  const lidId = data.lid_id

  const nu = new Date().toISOString()
  const bij = await t.admin.from('club_schemas').update({ maker: 'trainer', bijgewerkt_op: nu }).eq('user_id', t.userId).eq('id', id).eq('maker', 'lid')
  if (bij.error) {
    console.error('[club/training] schema overnemen mislukt', bij.error.message)
    return clubFout('Overnemen is niet gelukt. Probeer het opnieuw.', 500)
  }
  if (data.status === 'actief') {
    const af = await t.admin
      .from('club_schemas')
      .update({ status: 'afgerond', bijgewerkt_op: nu })
      .eq('user_id', t.userId)
      .eq('lid_id', lidId)
      .eq('status', 'actief')
      .eq('maker', 'trainer')
      .neq('id', id)
    if (af.error) console.error('[club/training] vorige schema afronden mislukt', af.error.message)
  }
  await logActie(t, 'Schema van lid overgenomen', typeof data.naam === 'string' ? data.naam : null, await lidVestiging(t.admin, t.userId, lidId))
  return clubJson({ id })
}
