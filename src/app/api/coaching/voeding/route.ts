import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isCoach } from '@/lib/coaching/server'
import {
  getRichtlijnVoorKlant,
  stelRichtlijnOp,
  wijzigRichtlijn,
} from '@/lib/coaching/voeding-server'
import type { VoedingRichtlijnInput } from '@/lib/coaching/voeding'

// GET   /api/coaching/voeding?klant=<id>  → actieve richtlijn van die klant (of null)
// POST  /api/coaching/voeding             → coach stelt een nieuwe richtlijn op
// PATCH /api/coaching/voeding             → coach werkt een bestaande richtlijn bij (body.id)
// Alle drie vereisen de coach-rol; POST/GET eisen bovendien een actieve
// coach↔klant-relatie, PATCH dwingt eigenaarschap in de query af.

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const klantId = req.nextUrl.searchParams.get('klant')
  if (!klantId) return NextResponse.json({ error: 'Query-parameter "klant" is verplicht.' }, { status: 400 })

  const resultaat = await getRichtlijnVoorKlant(admin, user.id, klantId)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ richtlijn: resultaat.richtlijn })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  let body: VoedingRichtlijnInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const resultaat = await stelRichtlijnOp(admin, user.id, body)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ richtlijn: resultaat.richtlijn }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  if (!(await isCoach(admin, user.id))) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  let body: VoedingRichtlijnInput
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  const id = (body.id ?? '').trim()
  if (!id) return NextResponse.json({ error: 'id is verplicht.' }, { status: 400 })

  const resultaat = await wijzigRichtlijn(admin, user.id, id, body)
  if (!resultaat.ok) return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  return NextResponse.json({ richtlijn: resultaat.richtlijn })
}
