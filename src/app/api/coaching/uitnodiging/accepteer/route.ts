import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { accepteerUitnodiging } from '@/lib/coaching/uitnodiging-server'

// POST /api/coaching/uitnodiging/accepteer {token} → ingelogde gebruiker accepteert
// de uitnodiging en wordt aan de coach gekoppeld (coach_klanten, status 'actief').

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  let body: { token?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 })
  }

  if (!body.token) {
    return NextResponse.json({ error: 'Geen uitnodigingstoken meegegeven.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const resultaat = await accepteerUitnodiging(admin, body.token, user.id)
  if (!resultaat.ok) {
    return NextResponse.json({ error: resultaat.fout }, { status: resultaat.status })
  }
  return NextResponse.json({ succes: true, coach_id: resultaat.coach_id })
}
