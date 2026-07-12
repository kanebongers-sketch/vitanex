import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isToegestaanEvent, schoonMeta } from '@/lib/analytics/analytics'
import { isRateLimited } from '@/lib/utils/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * Interne analytics-ingest. user_id komt altijd uit het geverifieerde token
 * (nooit uit de body), eventnamen uit de vaste allowlist en meta wordt
 * gesaneerd — een client kan hier niets anders in kwijt.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    if (isRateLimited(`events:${user.id}`, 60, 60_000)) {
      return NextResponse.json({ error: 'Te veel events.' }, { status: 429 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Ongeldige aanvraag.' }, { status: 400 })
    }

    const b = body as Record<string, unknown> | null
    const event = b?.event
    if (!isToegestaanEvent(event)) {
      return NextResponse.json({ error: 'Onbekend event.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('app_events').insert({
      user_id: user.id,
      event,
      meta: schoonMeta(b?.meta),
    })
    if (error) {
      console.error('[events]', error.message)
      return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[events]', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Interne fout.' }, { status: 500 })
  }
}
