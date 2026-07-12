import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach } from '@/lib/coaching/server'
import { getKlantTraining, wijsSchemaToe } from '@/lib/coaching/training-server'
import type { NieuwSchemaInput } from '@/lib/coaching/training'

// GET  /api/coaching/training?klant=<id>  → schema's + recente logs van die klant
// POST /api/coaching/training             → coach wijst een samengesteld schema toe
// Beide vereisen de coach-rol én een actieve coach↔klant-relatie (server-check).

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const klantId = req.nextUrl.searchParams.get('klant')
  if (!klantId) return NextResponse.json({ error: 'Query-parameter "klant" is verplicht.' }, { status: 400 })

  const resultaat = await getKlantTraining(admin, user.id, klantId)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ schemas: resultaat.schemas, logs: resultaat.logs })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  let body: NieuwSchemaInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const resultaat = await wijsSchemaToe(admin, user.id, body)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ schema: resultaat.schema }, { status: 201 })
}
