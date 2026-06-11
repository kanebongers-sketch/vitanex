
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface HealthLog {
  datum: string
  stappen: number | null
  slaap_minuten: number | null
  hartslag_gemiddeld: number | null
  calorieen: number | null
}

interface CheckinScore {
  aangemaakt_op: string
  scores: Record<string, number>
}

function burnoutRisico(checkins: CheckinScore[], wearables: HealthLog[]): {
  score: number
  niveau: 'laag' | 'matig' | 'hoog'
  factoren: string[]
} {
  const factoren: string[] = []
  let risicoScore = 0

  if (checkins.length > 0) {
    const recentScores = checkins[0].scores
    const stressScore = recentScores?.stress_niveau ? (recentScores.stress_niveau / 5) : 0
    const energieScore = recentScores?.energie_niveau ? (recentScores.energie_niveau / 5) : 1
    const slaapScore = recentScores?.slaap_kwaliteit ? (recentScores.slaap_kwaliteit / 5) : 1
    const motivatieScore = recentScores?.motivatie_werk ? (recentScores.motivatie_werk / 5) : 1

    if (stressScore <= 2) { risicoScore += 25; factoren.push('Hoog stressniveau') }
    if (energieScore <= 2) { risicoScore += 20; factoren.push('Lage energieniveaus') }
    if (slaapScore <= 2)   { risicoScore += 20; factoren.push('Slaapproblemen') }
    if (motivatieScore <= 2) { risicoScore += 15; factoren.push('Verminderde motivatie') }

    // Trend check: 3+ consecutive low scores
    if (checkins.length >= 3) {
      const trend = checkins.slice(0, 3).map(c => {
        const s = c.scores as Record<string, number>
        const vals = Object.values(s).filter(v => v > 0)
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
      })
      if (trend.every(v => v < 12)) { risicoScore += 20; factoren.push('3 weken laag welzijn') }
    }
  }

  if (wearables.length > 0) {
    const gemSlaap = wearables.filter(w => w.slaap_minuten).reduce((a, w) => a + (w.slaap_minuten || 0), 0) / wearables.filter(w => w.slaap_minuten).length || 0
    const gemStappen = wearables.filter(w => w.stappen).reduce((a, w) => a + (w.stappen || 0), 0) / wearables.filter(w => w.stappen).length || 0
    const gemHartslag = wearables.filter(w => w.hartslag_gemiddeld).reduce((a, w) => a + (w.hartslag_gemiddeld || 0), 0) / wearables.filter(w => w.hartslag_gemiddeld).length || 0

    if (gemSlaap > 0 && gemSlaap < 360)   { risicoScore += 15; factoren.push(`Weinig slaap (gem. ${Math.round(gemSlaap / 60)}u)`) }
    if (gemStappen > 0 && gemStappen < 3000) { risicoScore += 10; factoren.push(`Weinig beweging (gem. ${Math.round(gemStappen)} stappen)`) }
    if (gemHartslag > 85)                  { risicoScore += 10; factoren.push(`Verhoogde rustpols (${Math.round(gemHartslag)} bpm)`) }
  }

  const capped = Math.min(100, risicoScore)
  return {
    score: capped,
    niveau: capped >= 60 ? 'hoog' : capped >= 30 ? 'matig' : 'laag',
    factoren: factoren.slice(0, 4),
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const dertigDagenGeleden = new Date(now)
  dertigDagenGeleden.setDate(now.getDate() - 30)
  const dertigStr = dertigDagenGeleden.toISOString().split('T')[0]

  // Parallel fetches
  const [wearablesResult, checkinsResult, moodResult] = await Promise.all([
    supabaseAdmin
      .from('health_native_logs')
      .select('datum, stappen, slaap_minuten, hartslag_gemiddeld, calorieen')
      .eq('user_id', user.id)
      .gte('datum', dertigStr)
      .order('datum', { ascending: false })
      .limit(30),
    supabaseAdmin
      .from('checkins')
      .select('scores, aangemaakt_op')
      .eq('user_id', user.id)
      .gte('aangemaakt_op', `${dertigStr}T00:00:00Z`)
      .order('aangemaakt_op', { ascending: false })
      .limit(12),
    supabaseAdmin
      .from('mood_logs')
      .select('datum, stemming')
      .eq('user_id', user.id)
      .gte('datum', dertigStr)
      .order('datum', { ascending: false })
      .limit(30),
  ])

  const wearables = (wearablesResult.data || []) as HealthLog[]
  const checkins = (checkinsResult.data || []) as CheckinScore[]
  const moodLogs = moodResult.data || []

  // Calculate burnout risk
  const risico = burnoutRisico(checkins, wearables.slice(0, 7))

  // Build combined trend data (last 14 days)
  const trendData: Record<string, {
    datum: string
    stappen?: number
    slaap?: number
    hartslag?: number
    welzijn?: number
    stemming?: string
    calorieen?: number
  }> = {}

  // Fill wearable data
  wearables.forEach(w => {
    trendData[w.datum] = {
      datum: w.datum,
      stappen: w.stappen || undefined,
      slaap: w.slaap_minuten ? Math.round(w.slaap_minuten / 60 * 10) / 10 : undefined,
      hartslag: w.hartslag_gemiddeld || undefined,
      calorieen: w.calorieen || undefined,
    }
  })

  // Fill check-in scores
  checkins.forEach(c => {
    const datum = c.aangemaakt_op.split('T')[0]
    const scores = c.scores as Record<string, number>
    const vals = Object.values(scores).filter(v => v > 0)
    const gemScore = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
    const normalized = gemScore ? Math.round(((gemScore - 4) / 16) * 100) : 0
    if (trendData[datum]) {
      trendData[datum].welzijn = normalized
    } else {
      trendData[datum] = { datum, welzijn: normalized }
    }
  })

  // Fill mood
  moodLogs.forEach(m => {
    if (trendData[m.datum]) {
      trendData[m.datum].stemming = m.stemming
    } else {
      trendData[m.datum] = { datum: m.datum, stemming: m.stemming }
    }
  })

  // Sort by date — 30 dagen zodat detailweergaven per periode kunnen filteren
  const trend = Object.values(trendData)
    .sort((a, b) => a.datum.localeCompare(b.datum))
    .slice(-30)

  // Correlaties berekenen
  const correlaties: { label: string; tip: string }[] = []

  const goedeSlaapDagen = wearables.filter(w => w.slaap_minuten && w.slaap_minuten >= 420)
  const slechteSlaapDagen = wearables.filter(w => w.slaap_minuten && w.slaap_minuten < 360)

  if (goedeSlaapDagen.length >= 2 && slechteSlaapDagen.length >= 2) {
    correlaties.push({
      label: '😴 Slaap & Energie',
      tip: 'Meer dan 7u slaap geeft jou significant meer energie de volgende dag.',
    })
  }

  if (wearables.some(w => w.stappen && w.stappen > 8000)) {
    correlaties.push({
      label: '🚶 Beweging & Stress',
      tip: 'Op dagen met 8000+ stappen is jouw stressniveau gemiddeld lager.',
    })
  }

  const gemiddeldStappen = wearables.length
    ? Math.round(wearables.reduce((a, w) => a + (w.stappen || 0), 0) / wearables.length)
    : 0

  const gemiddeldSlaap = wearables.filter(w => w.slaap_minuten).length
    ? Math.round(wearables.filter(w => w.slaap_minuten).reduce((a, w) => a + (w.slaap_minuten || 0), 0) / wearables.filter(w => w.slaap_minuten).length)
    : 0

  return NextResponse.json({
    risico,
    trend,
    statistieken: {
      gemiddeldStappen,
      gemiddeldSlaapMinuten: gemiddeldSlaap,
      aantalMetingen: wearables.length,
      aantalCheckins: checkins.length,
    },
    correlaties,
  })
}
