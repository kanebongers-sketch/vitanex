import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { getPlanVoorBedrijf } from '@/lib/plan/plan-server'
import { heeftFeature } from '@/lib/plan/plan'

// k-anonimiteit: gemiddelden alleen tonen bij ≥ 5 unieke deelnemers,
// anders zijn individuele waarden herleidbaar.
const MIN_DEELNEMERS = 5

function weekLabel(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay() + 1) // Monday
  return d.toISOString().split('T')[0]
}

function groepeerPerWeek<T extends { user_id: string; aangemaakt_op?: string; datum?: string }>(
  rijen: T[],
  waarde: (r: T) => number,
): { week: string; gemiddelde: number | null; aantal: number }[] {
  const groepen = new Map<string, { vals: number[]; users: Set<string> }>()
  for (const r of rijen) {
    const datumStr = r.aangemaakt_op ?? r.datum ?? null
    if (!datumStr) continue
    const week = weekLabel(new Date(datumStr))
    const groep = groepen.get(week) ?? { vals: [], users: new Set<string>() }
    groep.vals.push(waarde(r))
    groep.users.add(r.user_id)
    groepen.set(week, groep)
  }
  return [...groepen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, { vals, users }]) => ({
      week,
      // Onder de anonimiteitsdrempel geen gemiddelde teruggeven.
      gemiddelde:
        users.size >= MIN_DEELNEMERS
          ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10
          : null,
      aantal: users.size,
    }))
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id, rol')
    .eq('id', user.id)
    .single()

  if (!profiel?.bedrijf_id || !['hr', 'admin'].includes(profiel.rol as string)) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const bedrijfId = profiel.bedrijf_id as string

  const plan = await getPlanVoorBedrijf(admin, bedrijfId)
  if (!heeftFeature(plan, 'hr_analytics')) {
    return NextResponse.json(
      { error: 'Team-analytics is onderdeel van het Groei-plan.', code: 'premium' },
      { status: 403 },
    )
  }

  // Medewerkers ophalen
  const { data: medewerkers } = await admin
    .from('profiles')
    .select('id')
    .eq('bedrijf_id', bedrijfId)
    .eq('rol', 'medewerker')

  const mwIds = (medewerkers ?? []).map((m) => m.id as string)
  const totaalMedewerkers = mwIds.length

  if (!totaalMedewerkers) {
    return NextResponse.json({
      stemming_trend: [],
      slaap_trend: [],
      stress_trend: [],
      checkin_trend: [],
      top_technieken: [],
      totaal_medewerkers: 0,
      actief_deze_week: 0,
      drempel: MIN_DEELNEMERS,
    })
  }

  const twaalf = new Date()
  twaalf.setDate(twaalf.getDate() - 84) // 12 weken
  const twaalfStr = twaalf.toISOString()

  const dertig = new Date()
  dertig.setDate(dertig.getDate() - 30)
  const dertigStr = dertig.toISOString()

  const dezeWeekStart = weekLabel(new Date())

  const [
    { data: stemmingRijen },
    { data: slaapRijen },
    { data: stressRijen },
    { data: checkinRijen },
    { data: hogeStressRijen },
  ] = await Promise.all([
    admin
      .from('stemming_logs')
      .select('user_id, stemming, aangemaakt_op')
      .in('user_id', mwIds)
      .gte('aangemaakt_op', twaalfStr),

    admin
      .from('slaap_logs')
      .select('user_id, uren_slaap, datum')
      .in('user_id', mwIds)
      .gte('datum', twaalf.toISOString().split('T')[0]),

    admin
      .from('stress_logs')
      .select('user_id, stress_niveau, aangemaakt_op')
      .in('user_id', mwIds)
      .gte('aangemaakt_op', twaalfStr),

    admin
      .from('checkin_sessies')
      .select('user_id, aangemaakt_op')
      .in('user_id', mwIds)
      .gte('aangemaakt_op', twaalfStr),

    admin
      .from('stress_logs')
      .select('user_id, stress_niveau, notitie, techniek, aangemaakt_op')
      .in('user_id', mwIds)
      .gte('aangemaakt_op', dertigStr)
      .gte('stress_niveau', 7),
  ])

  // Trends per week
  const stemming_trend = groepeerPerWeek(stemmingRijen ?? [], (r) => r.stemming)
  const slaap_trend = groepeerPerWeek(slaapRijen ?? [], (r) => r.uren_slaap)
  const stress_trend = groepeerPerWeek(stressRijen ?? [], (r) => r.stress_niveau)

  // Check-in participatie: unieke users per week
  const checkinGroepen = new Map<string, Set<string>>()
  for (const r of checkinRijen ?? []) {
    if (!r.aangemaakt_op) continue
    const week = weekLabel(new Date(r.aangemaakt_op))
    const s = checkinGroepen.get(week) ?? new Set<string>()
    s.add(r.user_id)
    checkinGroepen.set(week, s)
  }
  const checkin_trend = [...checkinGroepen.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, users]) => ({
      week,
      unieke_users: users.size,
      participatie_pct: Math.round((users.size / totaalMedewerkers) * 100),
    }))

  // Actief deze week
  const actiefDezeWeek = checkinGroepen.get(dezeWeekStart)?.size ?? 0

  // Meest gebruikte ademhalings-/ontspanningstechnieken bij hoge stress.
  // Alleen tonen bij voldoende unieke gebruikers (k-anonimiteit).
  const uniekeHogeStressUsers = new Set((hogeStressRijen ?? []).map((r) => r.user_id)).size
  const technieken: Record<string, number> = {}
  for (const r of hogeStressRijen ?? []) {
    const key = r.techniek ?? 'geen_techniek'
    technieken[key] = (technieken[key] ?? 0) + 1
  }
  const top_technieken =
    uniekeHogeStressUsers >= MIN_DEELNEMERS
      ? Object.entries(technieken)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([naam, count]) => ({ naam, count }))
      : []

  return NextResponse.json({
    stemming_trend,
    slaap_trend,
    stress_trend,
    checkin_trend,
    top_technieken,
    totaal_medewerkers: totaalMedewerkers,
    actief_deze_week: actiefDezeWeek,
    drempel: MIN_DEELNEMERS,
  })
}
