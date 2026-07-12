import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import type { XPData } from '@/lib/xp/xp'
import { isVerdachteXpSprong, MAX_XP_DELTA_PER_SYNC } from '@/lib/xp/xp-guard'

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

    // Anti-cheat: vergelijk met de huidige server-XP en weiger onmogelijk grote
    // sprongen. Een legitieme sync stijgt hooguit met wat er die dag te verdienen
    // valt; alles daarboven wijst op een handmatig geknutselde POST. Alleen de
    // allereerste sync (geen server-rij) mag opgebouwde localStorage-XP meenemen.
    const { data: huidig, error: leesFout } = await admin
      .from('user_xp')
      .select('xp')
      .eq('user_id', user.id)
      .maybeSingle()

    if (leesFout) {
      console.error('[xp POST]', leesFout.message)
      return NextResponse.json({ error: 'Kon XP niet opslaan.' }, { status: 500 })
    }

    if (isVerdachteXpSprong(huidig?.xp ?? null, body.xp)) {
      const delta = body.xp - (huidig?.xp ?? 0)
      console.error(`[xp POST] geweigerd: user ${user.id} probeerde +${delta} XP te syncen (max ${MAX_XP_DELTA_PER_SYNC})`)
      return NextResponse.json({ error: 'XP-toename is onwaarschijnlijk groot en is geweigerd.' }, { status: 400 })
    }

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
