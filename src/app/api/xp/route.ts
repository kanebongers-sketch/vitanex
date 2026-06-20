import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import type { XPData } from '@/lib/xp'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('user_xp')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[xp GET]', error.message)
      return NextResponse.json({ error: 'Kon XP niet laden.' }, { status: 500 })
    }

    if (!data) return NextResponse.json(null)

    const xpData: XPData = {
      xp:                 data.xp,
      checkinCount:       data.checkin_count,
      goalsCompleted:     data.goals_completed,
      streakRecord:       data.streak_record,
      achievements:       data.achievements ?? [],
      history:            data.history ?? [],
      lastCheckinDatum:   data.last_checkin_datum ?? null,
      lastGoalLogDatum:   data.last_goal_log_datum ?? null,
      lastDecayCheck:     data.last_decay_check ?? null,
    }

    return NextResponse.json(xpData)
  } catch (err) {
    console.error('[xp GET]', err)
    return NextResponse.json({ error: 'Interne fout.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const body: Partial<XPData> = await req.json()

    if (typeof body.xp !== 'number' || body.xp < 0) {
      return NextResponse.json({ error: 'Ongeldige XP waarde.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('user_xp').upsert({
      user_id:             user.id,
      xp:                  body.xp,
      checkin_count:       body.checkinCount       ?? 0,
      goals_completed:     body.goalsCompleted     ?? 0,
      streak_record:       body.streakRecord       ?? 0,
      achievements:        body.achievements       ?? [],
      history:             (body.history ?? []).slice(0, 50),
      last_checkin_datum:  body.lastCheckinDatum   ?? null,
      last_goal_log_datum: body.lastGoalLogDatum   ?? null,
      last_decay_check:    body.lastDecayCheck     ?? null,
      bijgewerkt_op:       new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) {
      console.error('[xp POST]', error.message)
      return NextResponse.json({ error: 'Kon XP niet opslaan.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[xp POST]', err)
    return NextResponse.json({ error: 'Interne fout.' }, { status: 500 })
  }
}
