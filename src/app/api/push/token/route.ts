// POST /api/push/token   — registreer/ververs het push-token van dit apparaat
// DELETE /api/push/token  — meld dit apparaat af (bij uitloggen / push uitzetten)
// Tokens zijn per (user, token) uniek; upsert houdt "laatst_gezien" vers.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

const PLATFORMS = new Set(['ios', 'android', 'web'])

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body: { token?: unknown; platform?: unknown } = await req.json()
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (token.length < 20 || token.length > 4096) {
      return NextResponse.json({ error: 'Ongeldig token.' }, { status: 400 })
    }
    const platform = typeof body.platform === 'string' && PLATFORMS.has(body.platform) ? body.platform : 'android'

    const admin = createAdminClient()
    const { error } = await admin
      .from('push_tokens')
      .upsert(
        { user_id: user.id, token, platform, laatst_gezien_op: new Date().toISOString() },
        { onConflict: 'user_id,token' },
      )

    if (error) {
      console.error('[push token POST]', error.message)
      return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push token POST]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body: { token?: unknown } = await req.json().catch(() => ({}))
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (!token) return NextResponse.json({ error: 'Geen token.' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await admin.from('push_tokens').delete().eq('user_id', user.id).eq('token', token)
    if (error) {
      console.error('[push token DELETE]', error.message)
      return NextResponse.json({ error: 'Afmelden mislukt.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push token DELETE]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}
