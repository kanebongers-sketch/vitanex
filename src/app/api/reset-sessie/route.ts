import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getAuthenticatedUser } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  try {
    // ── Auth verification ──────────────────────────────────────────────────────
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
    }

    const { sessie_id } = await req.json() as { sessie_id: string }
    if (!sessie_id) {
      return NextResponse.json({ error: 'sessie_id verplicht.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify the session belongs to this authenticated user before deleting
    const { data: sessie } = await admin
      .from('checkin_sessies')
      .select('user_id')
      .eq('id', sessie_id)
      .single()

    if (!sessie || sessie.user_id !== user.id) {
      return NextResponse.json({ error: 'Niet bevoegd.' }, { status: 403 })
    }

    // Delete cascades to checkin_antwoorden via FK
    await admin.from('checkin_sessies').delete().eq('id', sessie_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-sessie]', err)
    return NextResponse.json({ error: 'Reset mislukt.' }, { status: 500 })
  }
}
