import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function GET(req: NextRequest) {
  if (!anthropic) return NextResponse.json({ error: 'AI niet beschikbaar.' }, { status: 503 })

  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const [{ data: checkIns }, { data: burnout }] = await Promise.all([
    admin.from('checkin_analyses')
      .select('scores')
      .eq('user_id', user.id)
      .order('aangemaakt_op', { ascending: false })
      .limit(2),
    admin.from('burnout_predictor_scores')
      .select('risico_score, dominante_factor, trending')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const scores = checkIns?.[0]?.scores as Record<string, number> | null
  const prevScores = checkIns?.[1]?.scores as Record<string, number> | null

  if (!scores) return NextResponse.json({ adviezen: [] })

  const scoreSummary = Object.entries(scores)
    .map(([k, v]) => {
      const trend = prevScores ? (v > prevScores[k] ? '↑' : v < prevScores[k] ? '↓' : '=') : ''
      return `${k}: ${v}/20 ${trend}`
    })
    .join(', ')

  const burnoutInfo = burnout
    ? `Burnout risico: ${burnout.risico_score}% (${burnout.trending ?? 'stabiel'}, dominante factor: ${burnout.dominante_factor ?? 'onbekend'})`
    : ''

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Stel 3 concrete weekdoelen voor op basis van:
Domeinscores: ${scoreSummary}
${burnoutInfo}

Geef JSON terug:
{
  "adviezen": [
    { "domein": "slaap|stress|energie|focus|balans|motivatie", "doel": "concreet weekdoel", "waarom": "1 zin uitleg" },
    ...
  ]
}

3 adviezen. Focus op laagste scores. Doelen moeten specifiek, meetbaar en haalbaar zijn in 1 week. Nederlands.`,
    }],
  })

  const tekst = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  let parsed: { adviezen: { domein: string; doel: string; waarom: string }[] } = { adviezen: [] }
  try {
    const m = tekst.match(/\{[\s\S]*\}/)
    if (m) parsed = JSON.parse(m[0])
  } catch { /* negeer */ }

  return NextResponse.json(parsed)
}
