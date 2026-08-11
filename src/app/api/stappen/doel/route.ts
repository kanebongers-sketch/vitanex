// POST /api/stappen/doel — stel je dagelijkse stappendoel in (op profiles).
// Een waarde zet stappen_doel als handmatige overschrijving; null valt terug op
// het doel afgeleid van je fitnessdoel (zie effectieveDoelen).

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body: { doel?: unknown } = await req.json().catch(() => ({}))
    const doel = body.doel

    if (doel !== null && (typeof doel !== 'number' || !Number.isFinite(doel) || doel < 1000 || doel > 50000)) {
      return NextResponse.json({ error: 'Kies een doel tussen 1.000 en 50.000 stappen.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update({ stappen_doel: typeof doel === 'number' ? Math.round(doel) : null })
      .eq('id', user.id)

    if (error) {
      console.error('[stappen doel POST]', error.message)
      return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[stappen doel POST]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}
