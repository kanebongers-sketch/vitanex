import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { haalLid } from '@/lib/club/kern/lid'
import { leesTrainingInvoer } from '@/lib/club/app/invoer'
import { vinkTrainingAf } from '@/lib/club/app/acties-training'

// POST /api/club/app/training  { lidId, schemaId, dag }
// Een lid vinkt in de ledenapp een training uit zijn schema af. Dit is de
// voorvertoning: Kane doet dit namens een (demo)lid. Leden zelf gebruiken
// /api/club/lid/training (lid uit de ledensessie).

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
  return vinkTrainingAf(t, lid, invoer)
}
