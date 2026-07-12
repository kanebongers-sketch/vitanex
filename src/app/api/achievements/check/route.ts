import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { berekenLevel } from '@/lib/xp/xp'
import { datumMinusDagenNL } from '@/lib/utils/date-nl'

interface Achievement {
  id: string
  slug: string
  naam: string
  icon: string
  xp_beloning: number
}

/** Aaneengesloten dagen (eindigend vandaag/gisteren) met een gewoonte-log. */
function berekenDagStreak(datums: string[]): number {
  const set = new Set(datums)
  let streak = 0
  for (let i = 0; i < 60; i++) {
    const d = datumMinusDagenNL(i)
    if (set.has(d)) streak++
    else if (i === 0) continue // vandaag nog niet gelogd telt niet als breuk
    else break
  }
  return streak
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
    admin.from('coach_rate_limits').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
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

  // ── Extra checks (defensief) ────────────────────────────────────────────────
  // Deze queries staan bewust in een eigen try/catch zodat een ontbrekende
  // tabel/kolom NOOIT het bestaande awarden hierboven kan breken.
  try {
    // Fit Level-mijlpalen uit de duurzame XP-bron (user_xp.xp).
    const { data: xpRow } = await admin
      .from('user_xp').select('xp').eq('user_id', user.id).maybeSingle()
    const level = berekenLevel(xpRow?.xp ?? 0)
    if (level >= 5) slugsToKennen.push('level_5')
    if (level >= 8) slugsToKennen.push('level_8')
    if (level >= 10) slugsToKennen.push('level_10')

    // Dagelijkse gewoonte-streak (aaneengesloten dagen in gewoonte_logs).
    const { data: gewoonteRows } = await admin
      .from('gewoonte_logs').select('datum')
      .eq('user_id', user.id).gte('datum', datumMinusDagenNL(59))
    const dagStreak = berekenDagStreak((gewoonteRows ?? []).map(r => String(r.datum)))
    if (dagStreak >= 7) slugsToKennen.push('streak_dag_7')
    if (dagStreak >= 30) slugsToKennen.push('streak_dag_30')
  } catch (extraErr) {
    console.error('[achievements/check] extra checks overgeslagen:', extraErr)
  }

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
  const { error: insertErr } = await admin.from('achievements_behaald').insert(
    nieuweAchievements.map(a => ({
      user_id: user.id,
      achievement_id: a.id,
    })),
  )
  if (insertErr) {
    console.error('[achievements/check] opslaan mislukt:', insertErr.message)
    return NextResponse.json({ nieuw: [] })
  }

  // Wire de XP-beloning van nieuw behaalde achievements door naar de duurzame
  // XP-bron (user_xp.xp), zodat een behaald achievement ook echt je Fit Level
  // laat stijgen. Idempotent: alleen NIEUW toegekende achievements tellen mee
  // (reeds behaalde zijn hierboven uitgefilterd), dus dit dubbeltelt nooit.
  const bonusXP = nieuweAchievements.reduce((s, a) => s + (a.xp_beloning ?? 0), 0)
  if (bonusXP > 0) {
    const { data: huidig } = await admin
      .from('user_xp').select('xp').eq('user_id', user.id).maybeSingle()
    await admin.from('user_xp').upsert(
      { user_id: user.id, xp: (huidig?.xp ?? 0) + bonusXP, bijgewerkt_op: new Date().toISOString() },
      { onConflict: 'user_id' },
    )
  }

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
