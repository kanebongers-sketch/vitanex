// GET /api/push/voorkeuren  — lees je push-voorkeuren (met nette defaults)
// PUT /api/push/voorkeuren  — bewaar je push-voorkeuren (upsert, één rij per user)
// Vertelt ook of push echt geconfigureerd is (FCM), zodat de UI eerlijk blijft.

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { pushGeconfigureerd } from '@/lib/push/verzend'

const TIJD = /^\d{1,2}:\d{2}$/

const DEFAULTS = {
  checkin_aan: true,
  streak_aan: true,
  vita_week_aan: true,
  stiltetijd_start: '22:00',
  stiltetijd_eind: '08:00',
  max_per_dag: 2,
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('push_voorkeuren')
      .select('checkin_aan, streak_aan, vita_week_aan, stiltetijd_start, stiltetijd_eind, max_per_dag')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[push voorkeuren GET]', error.message)
      return NextResponse.json({ error: 'Laden mislukt.' }, { status: 500 })
    }

    return NextResponse.json({
      voorkeuren: data ?? DEFAULTS,
      geconfigureerd: pushGeconfigureerd(),
    })
  } catch (err) {
    console.error('[push voorkeuren GET]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}

/** Knipt "HH:MM" naar een geldige time of geeft een fallback. */
function tijdOf(waarde: unknown, fallback: string): string {
  return typeof waarde === 'string' && TIJD.test(waarde) ? waarde : fallback
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body: Record<string, unknown> = await req.json().catch(() => ({}))
    const maxRuw = typeof body.max_per_dag === 'number' ? Math.round(body.max_per_dag) : DEFAULTS.max_per_dag

    const rij = {
      user_id: user.id,
      checkin_aan: typeof body.checkin_aan === 'boolean' ? body.checkin_aan : DEFAULTS.checkin_aan,
      streak_aan: typeof body.streak_aan === 'boolean' ? body.streak_aan : DEFAULTS.streak_aan,
      vita_week_aan: typeof body.vita_week_aan === 'boolean' ? body.vita_week_aan : DEFAULTS.vita_week_aan,
      stiltetijd_start: tijdOf(body.stiltetijd_start, DEFAULTS.stiltetijd_start),
      stiltetijd_eind: tijdOf(body.stiltetijd_eind, DEFAULTS.stiltetijd_eind),
      max_per_dag: Math.min(5, Math.max(0, maxRuw)),
      bijgewerkt_op: new Date().toISOString(),
    }

    const admin = createAdminClient()
    const { error } = await admin.from('push_voorkeuren').upsert(rij, { onConflict: 'user_id' })
    if (error) {
      console.error('[push voorkeuren PUT]', error.message)
      return NextResponse.json({ error: 'Opslaan mislukt.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push voorkeuren PUT]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}
