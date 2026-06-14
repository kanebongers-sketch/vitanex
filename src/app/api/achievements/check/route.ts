import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

interface Achievement {
  id: string
  slug: string
  naam: string
  icon: string
  xp_beloning: number
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Laad alle achievements en al behaalde
  const [{ data: alle }, { data: behaald }] = await Promise.all([
    admin.from('achievements').select('id, slug, naam, icon, xp_beloning'),
    admin.from('achievements_behaald').select('achievement_id').eq('user_id', user.id),
  ])

  if (!alle?.length) return NextResponse.json({ nieuw: [] })

  const behaaldIds = new Set((behaald ?? []).map(b => b.achievement_id))
  const alleMap = new Map<string, Achievement>(alle.map(a => [a.slug, a]))

  // Haal statistieken op voor checks
  const [
    { count: checkinCount },
    { count: coachCount },
    { count: trainingCount },
    { count: dankbaarheidCount },
    { data: discData },
    { data: burnoutData },
    { data: streakData },
    { data: focusData },
  ] = await Promise.all([
    admin.from('checkin_sessies').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('berichten').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('rol', 'user'),
    admin.from('training_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('dankbaarheid_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    admin.from('disc_inzendingen').select('id').eq('user_id', user.id).limit(1),
    admin
      .from('burnout_predictor_scores')
      .select('risico_score')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(4),
    admin
      .from('checkin_sessies')
      .select('week_start')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(30),
    admin
      .from('focus_timer_logs')
      .select('duur_minuten')
      .eq('user_id', user.id)
      .neq('type', 'pauze'),
  ])

  // Bepaal consecutieve weken streak
  let streak = 0
  if (streakData?.length) {
    const weken = streakData.map(s => new Date(s.week_start as string).getTime()).sort((a, b) => b - a)
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000
    streak = 1
    for (let i = 1; i < weken.length; i++) {
      if (Math.abs(weken[i - 1] - weken[i] - WEEK_MS) < 86400000) streak++
      else break
    }
  }

  // Focus totaal
  const focusMinuten = (focusData ?? []).reduce((s, r) => s + (r.duur_minuten ?? 0), 0)

  // 4 weken laag burnout-risico
  const vierWekenLaag =
    (burnoutData?.length ?? 0) >= 4 && burnoutData!.every(b => b.risico_score <= 30)

  // Welke moeten worden toegekend?
  const slugsToKennen: string[] = []
  const checkins = checkinCount ?? 0
  const coaches = coachCount ?? 0
  const trainingen = trainingCount ?? 0
  const dankbaarheden = dankbaarheidCount ?? 0

  if (checkins >= 1) slugsToKennen.push('eerste_checkin')
  if (checkins >= 5) slugsToKennen.push('checkin_5')
  if (checkins >= 10) slugsToKennen.push('checkin_10')
  if (checkins >= 25) slugsToKennen.push('checkin_25')
  if (streak >= 3) slugsToKennen.push('streak_3')
  if (streak >= 8) slugsToKennen.push('streak_8')
  if (streak >= 26) slugsToKennen.push('streak_26')
  if (coaches >= 1) slugsToKennen.push('eerste_coach')
  if (coaches >= 10) slugsToKennen.push('coach_10')
  if (trainingen >= 1) slugsToKennen.push('eerste_training')
  if (trainingen >= 10) slugsToKennen.push('training_10')
  if (discData?.length) slugsToKennen.push('disc_voltooid')
  if (dankbaarheden >= 7) slugsToKennen.push('dankbaarheid_7')
  if (focusMinuten >= 100) slugsToKennen.push('focus_100')
  if (vierWekenLaag) slugsToKennen.push('burnout_laag')

  // Filter al behaalde
  const nieuweAchievements: Achievement[] = []
  for (const slug of slugsToKennen) {
    const ach = alleMap.get(slug)
    if (!ach || behaaldIds.has(ach.id)) continue
    nieuweAchievements.push(ach)
  }

  if (!nieuweAchievements.length) {
    return NextResponse.json({ nieuw: [] })
  }

  // Sla op
  await admin.from('achievements_behaald').insert(
    nieuweAchievements.map(a => ({
      user_id: user.id,
      achievement_id: a.id,
    })),
  )

  return NextResponse.json({
    nieuw: nieuweAchievements.map(a => ({
      slug: a.slug,
      naam: a.naam,
      icon: a.icon,
      xp: a.xp_beloning,
    })),
  })
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('achievements_behaald')
    .select('behaald_op, achievements(slug, naam, icon, xp_beloning, categorie, beschrijving)')
    .eq('user_id', user.id)
    .order('behaald_op', { ascending: false })

  return NextResponse.json({ achievements: data ?? [] })
}
