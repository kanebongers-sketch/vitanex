import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach } from '@/lib/coaching/server'
import { getContentVoorKlant, maakContent, type NieuweContentInput } from '@/lib/coaching/content-server'

// GET  /api/coaching/content?klant=<id>  → alle content die die klant ontvangt
// POST /api/coaching/content             → coach maakt content (klant of algemeen)
// Beide vereisen de coach-rol; persoonlijke content vereist een actieve relatie.

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const klantId = req.nextUrl.searchParams.get('klant')
  if (!klantId) return NextResponse.json({ error: 'Query-parameter "klant" is verplicht.' }, { status: 400 })

  const resultaat = await getContentVoorKlant(admin, user.id, klantId)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ content: resultaat.content })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  let body: NieuweContentInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const resultaat = await maakContent(admin, user.id, body)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ content: resultaat.content }, { status: 201 })
}
