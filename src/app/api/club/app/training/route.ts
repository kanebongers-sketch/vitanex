import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson, logActie, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid, volledigeNaam } from '@/lib/club/gedeeld/lid'
import { leesTrainingInvoer } from '@/lib/club/app/invoer'

// POST /api/club/app/training  { lidId, schemaId, dag }
// Een lid vinkt in de ledenapp een training uit zijn schema af. Testfase: Kane
// doet dit namens een (demo)lid in de voorvertoning; echt inloggen voor leden
// komt bij de pilot.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return clubFout('Ongeldig verzoek.', 400)
  }
  const invoer = leesTrainingInvoer(body)
  if (typeof invoer === 'string') return clubFout(invoer, 400)

  const lid = await haalLid(t.admin, t.userId, invoer.lidId)
  if (!lid) return clubFout('Lid niet gevonden.', 404)
  const schema = await t.admin
    .from('club_schemas')
    .select('id')
    .eq('user_id', t.userId)
    .eq('id', invoer.schemaId)
    .eq('lid_id', lid.id)
    .maybeSingle()
  if (schema.error) {
    console.error('[club/app] schema lezen mislukt', schema.error.message)
    return clubFout('Het schema kon niet worden gelezen.', 500)
  }
  if (!schema.data) return clubFout('Dit schema hoort niet bij dit lid.', 404)

  const { data, error } = await t.admin
    .from('club_trainingslog')
    .insert({ user_id: t.userId, lid_id: lid.id, schema_id: invoer.schemaId, dag: invoer.dag, uitgevoerd: [], demo: lid.demo })
    .select('id, op')
    .single()
  if (error || !data) {
    console.error('[club/app] training afvinken mislukt', error?.message)
    return clubFout('Afvinken is niet gelukt. Probeer het opnieuw.', 500)
  }
  await logActie(t, 'Training afgevinkt in ledenapp', volledigeNaam(lid), lid.vestiging)
  return clubJson({ id: data.id, op: data.op }, 201)
}
