import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('groeiplannen')
    .select('id, periode_start, doelen, sterke_punten, aandachtspunten, acties, aangemaakt_op')
    .eq('user_id', user.id)
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ groeiplan: data })
}

export async function POST(req: NextRequest) {
  if (!anthropic) return NextResponse.json({ error: 'AI niet beschikbaar.' }, { status: 503 })

  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  // Verzamel context
  const [{ data: profiel }, { data: checkIns }, { data: burnoutScore }, { data: discInzending }] = await Promise.all([
    admin.from('profiles').select('naam, geboortedatum').eq('id', user.id).single(),
    admin.from('checkin_analyses').select('scores, aangemaakt_op').eq('user_id', user.id).order('aangemaakt_op', { ascending: false }).limit(4),
    admin.from('burnout_predictor_scores').select('risico_score, dominante_factor').eq('user_id', user.id).order('week_start', { ascending: false }).limit(1).maybeSingle(),
    admin.from('disc_inzendingen').select('primair_profiel').eq('user_id', user.id).order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle(),
  ])

  const naam = profiel?.naam ?? 'medewerker'
  const disc = discInzending?.primair_profiel ? `DISC-profiel: ${discInzending.primair_profiel}` : ''
  const burnoutInfo = burnoutScore ? `Burnout risico: ${burnoutScore.risico_score}% (dominante factor: ${burnoutScore.dominante_factor ?? 'onbekend'})` : ''

  let domeinInfo = ''
  if (checkIns?.length) {
    const latest = checkIns[0].scores as Record<string, number> | null
    if (latest) {
      domeinInfo = `Huidige domeinscores: ${Object.entries(latest).map(([k, v]) => `${k}=${v}`).join(', ')}`
    }
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Maak een persoonlijk groeiplan voor ${naam} op basis van:
${disc}
${burnoutInfo}
${domeinInfo}

Geef JSON terug (niets anders) in dit formaat:
{
  "doelen": ["doel 1", "doel 2", "doel 3"],
  "sterke_punten": ["sterk punt 1", "sterk punt 2"],
  "aandachtspunten": ["verbeterpunt 1", "verbeterpunt 2"],
  "acties": [
    { "actie": "concrete actie", "domein": "slaap/stress/energie/focus/balans/motivatie", "termijn": "week/maand/kwartaal" }
  ]
}

Maximaal 3 doelen, 2 sterke punten, 2 aandachtspunten, 4 acties. Schrijf in het Nederlands.`,
    }],
  })

  const tekst = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  let parsed: Record<string, unknown>
  try {
    const jsonMatch = tekst.match(/\{[\s\S]*\}/)
    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
  } catch {
    parsed = {}
  }

  const periodeStart = new Date().toISOString().split('T')[0]

  const { data, error } = await admin
    .from('groeiplannen')
    .insert({
      user_id: user.id,
      periode_start: periodeStart,
      doelen:          parsed.doelen ?? [],
      sterke_punten:   parsed.sterke_punten ?? [],
      aandachtspunten: parsed.aandachtspunten ?? [],
      acties:          parsed.acties ?? [],
    })
    .select('id, periode_start, doelen, sterke_punten, aandachtspunten, acties, aangemaakt_op')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ groeiplan: data }, { status: 201 })
}
