import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { sessie_id, user_id } = await req.json()
    if (!sessie_id || !user_id) {
      return NextResponse.json({ error: 'missing params' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verify the session belongs to this user before deleting
    const { data: sessie } = await admin
      .from('checkin_sessies')
      .select('user_id')
      .eq('id', sessie_id)
      .single()

    if (!sessie || sessie.user_id !== user_id) {
      return NextResponse.json({ error: 'not authorized' }, { status: 403 })
    }

    // Delete cascades to checkin_antwoorden via FK
    await admin.from('checkin_sessies').delete().eq('id', sessie_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-sessie]', err)
    return NextResponse.json({ error: 'Reset mislukt.' }, { status: 500 })
  }
}
