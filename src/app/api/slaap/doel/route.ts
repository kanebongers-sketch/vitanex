// POST /api/slaap/doel — stel je slaapdoel in (doel-uren + streefbedtijd).
// Bewaard op profiles, zodat de slaapschuld en later een bedtijd-herinnering het
// kunnen gebruiken.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

const TIJD = /^\d{1,2}:\d{2}$/

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body: { uren?: unknown; streefbedtijd?: unknown } = await req.json()

    const uren = body.uren
    if (uren !== null && (typeof uren !== 'number' || uren < 0 || uren > 24)) {
      return NextResponse.json({ error: 'Ongeldig doel.' }, { status: 400 })
    }
    const streef = body.streefbedtijd
    if (streef !== null && streef !== undefined && (typeof streef !== 'string' || !TIJD.test(streef))) {
      return NextResponse.json({ error: 'Ongeldige streefbedtijd.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update({
        slaap_doel_uren: typeof uren === 'number' ? uren : null,
        slaap_streefbedtijd: typeof streef === 'string' && streef.length > 0 ? streef : null,
      })
      .eq('id', user.id)

    if (error) {
      console.error('[slaap doel POST]', error.message)
      return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[slaap doel POST]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}
