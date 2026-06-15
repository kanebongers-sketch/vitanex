import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

function berekenWeekStart(datum: Date): string {
  const d = new Date(datum)
  const dag = d.getDay()
  const diff = dag === 0 ? -6 : 1 - dag
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function normaliseer(score: number): number {
  return Math.max(0, Math.min(1, (score - 4) / 16))
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const weekStart = berekenWeekStart(new Date())

  // Haal laatste 4 weken aan checkin-sessies op
  const { data: sessies } = await admin
    .from('checkin_sessies')
    .select('id, week_start, checkin_antwoorden(vraag_code, waarde_schaal)')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(4)

  if (!sessies?.length) {
    return NextResponse.json({ bericht: 'Nog geen check-ins gevonden.' }, { status: 200 })
  }

  // Bereken domain scores per sessie
  type DomeinScores = Record<string, number>
  const sessiescores: { week: string; scores: DomeinScores }[] = sessies.map(s => {
    const domeinSommen: Record<string, number[]> = {}
    for (const a of (s.checkin_antwoorden ?? [])) {
      const domein = a.vraag_code.split('_')[0]
      if (!domeinSommen[domein]) domeinSommen[domein] = []
      domeinSommen[domein].push(a.waarde_schaal)
    }
    const scores: DomeinScores = {}
    for (const [d, vals] of Object.entries(domeinSommen)) {
      scores[d] = vals.reduce((a, b) => a + b, 0)
    }
    return { week: s.week_start as string, scores }
  })

  // Meest recente sessie
  const recent = sessiescores[0]

  // Risicoberekening: gewogen inversie van welzijnsdomeinen
  const gewichten: Record<string, number> = {
    stress: 0.30,
    slaap: 0.25,
    energie: 0.20,
    balans: 0.15,
    focus: 0.05,
    motivatie: 0.05,
  }

  let risicoScore = 0
  let dominanteFactor = ''
  let maxBijdrage = 0

  for (const [domein, gewicht] of Object.entries(gewichten)) {
    const rawScore = recent.scores[domein] ?? 4
    const norm = normaliseer(rawScore)
    const bijdrage = gewicht * (1 - norm) * 100
    risicoScore += bijdrage
    if (bijdrage > maxBijdrage) {
      maxBijdrage = bijdrage
      dominanteFactor = domein
    }
  }

  // Trending bepalen
  let trending: 'stijgend' | 'dalend' | 'stabiel' = 'stabiel'
  if (sessiescores.length >= 2) {
    const ouder = sessiescores[1]
    const oudGemiddeld =
      Object.values(ouder.scores).reduce((a, b) => a + b, 0) /
      Math.max(1, Object.values(ouder.scores).length)
    const nieuwGemiddeld =
      Object.values(recent.scores).reduce((a, b) => a + b, 0) /
      Math.max(1, Object.values(recent.scores).length)
    const delta = nieuwGemiddeld - oudGemiddeld
    if (delta < -0.5) trending = 'stijgend' // risico stijgt → score daalt
    else if (delta > 0.5) trending = 'dalend'
  }

  const risicoAfrond = Math.round(Math.min(100, Math.max(0, risicoScore)) * 10) / 10

  // Sla op
  await admin
    .from('burnout_predictor_scores')
    .upsert(
      {
        user_id: user.id,
        week_start: weekStart,
        risico_score: risicoAfrond,
        trending,
        dominante_factor: dominanteFactor,
        details: recent.scores,
      },
      { onConflict: 'user_id,week_start' },
    )

  return NextResponse.json({
    risico_score: risicoAfrond,
    trending,
    dominante_factor: dominanteFactor,
    week_start: weekStart,
  })
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('burnout_predictor_scores')
    .select('risico_score, trending, dominante_factor, week_start')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(8)

  return NextResponse.json({ scores: data ?? [] })
}
