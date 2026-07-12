import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export const dynamic = 'force-dynamic'

function avg(vals: (number | null)[]): number | null {
  const filtered = vals.filter((v): v is number => v !== null && v > 0)
  if (!filtered.length) return null
  return Math.round((filtered.reduce((a, b) => a + b, 0) / filtered.length) * 10) / 10
}

// checkin_analyses heeft geen totaal_score-kolom; leid een totaalscore per rij af
// als het gemiddelde van de numerieke domeinwaarden in `scores`.
function totaalScore(scores: unknown): number {
  const values = Object.values((scores ?? {}) as Record<string, number>)
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function dateStr(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const nu = new Date()
  const weekGeleden = new Date(nu.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeekGeleden = new Date(nu.getTime() - 14 * 24 * 60 * 60 * 1000)

  const vandaagStr = nu.toISOString().split('T')[0]
  const weekStr = weekGeleden.toISOString().split('T')[0]
  const twoWeekStr = twoWeekGeleden.toISOString().split('T')[0]

  // Last 7 days for activity dots
  const dagStrs = Array.from({ length: 7 }, (_, i) => dateStr(6 - i))

  const [
    { data: slaapDezW },
    { data: slaapVorigeW },
    { data: stemmingDezW },
    { data: stemmingVorigeW },
    { data: checkinDezW },
    { data: checkinVorigeW },
    { data: slaapDagen },
    { data: stemmingDagen },
    { data: sportDagen },
  ] = await Promise.all([
    admin.from('slaap_logs').select('uren_slaap').eq('user_id', user.id).gte('datum', weekStr).lte('datum', vandaagStr),
    admin.from('slaap_logs').select('uren_slaap').eq('user_id', user.id).gte('datum', twoWeekStr).lt('datum', weekStr),
    admin.from('stemming_logs').select('stemming').eq('user_id', user.id).gte('aangemaakt_op', weekGeleden.toISOString()),
    admin.from('stemming_logs').select('stemming').eq('user_id', user.id).gte('aangemaakt_op', twoWeekGeleden.toISOString()).lt('aangemaakt_op', weekGeleden.toISOString()),
    admin.from('checkin_analyses').select('scores').eq('user_id', user.id).gte('aangemaakt_op', weekGeleden.toISOString()),
    admin.from('checkin_analyses').select('scores').eq('user_id', user.id).gte('aangemaakt_op', twoWeekGeleden.toISOString()).lt('aangemaakt_op', weekGeleden.toISOString()),
    // Per-day activity data for dots
    admin.from('slaap_logs').select('datum, uren_slaap').eq('user_id', user.id).in('datum', dagStrs),
    admin.from('stemming_logs').select('aangemaakt_op, stemming').eq('user_id', user.id).gte('aangemaakt_op', weekGeleden.toISOString()),
    admin.from('sport_logs').select('aangemaakt_op').eq('user_id', user.id).gte('aangemaakt_op', weekGeleden.toISOString()),
  ])

  const slaapGem = avg(slaapDezW?.map(r => r.uren_slaap) ?? [])
  const slaapVorigGem = avg(slaapVorigeW?.map(r => r.uren_slaap) ?? [])
  const stemmingGem = avg(stemmingDezW?.map(r => r.stemming) ?? [])
  const stemmingVorigGem = avg(stemmingVorigeW?.map(r => r.stemming) ?? [])
  const checkinGem = avg(checkinDezW?.map(r => totaalScore(r.scores)) ?? [])
  const checkinVorigGem = avg(checkinVorigeW?.map(r => totaalScore(r.scores)) ?? [])

  // Build per-day activity summary
  const slaapByDag = new Map((slaapDagen ?? []).map(r => [r.datum, r.uren_slaap]))
  const stemmingByDag = new Map(
    (stemmingDagen ?? []).map(r => [r.aangemaakt_op.split('T')[0], r.stemming])
  )
  const sportSet = new Set(
    (sportDagen ?? []).map(r => (r as { aangemaakt_op: string }).aangemaakt_op.split('T')[0])
  )

  const dagActiviteit = dagStrs.map(dag => {
    const slaap = slaapByDag.get(dag) ?? null
    const stemming = stemmingByDag.get(dag) ?? null
    const sport = sportSet.has(dag)
    const actief = slaap !== null || stemming !== null || sport
    return { datum: dag, slaap, stemming, sport, actief }
  })

  return NextResponse.json({
    slaap: { gem: slaapGem, vorige: slaapVorigGem },
    stemming: { gem: stemmingGem, vorige: stemmingVorigGem },
    readiness: { gem: checkinGem, vorige: checkinVorigGem },
    actief_dagen: slaapDezW?.length ?? 0,
    dagActiviteit,
  })
}
