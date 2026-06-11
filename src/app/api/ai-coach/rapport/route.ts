
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DOMEIN_LABELS: Record<string, string> = {
  slaap_kwaliteit: 'Slaap', energie_niveau: 'Energie', stress_niveau: 'Stress',
  focus_concentratie: 'Focus', balans_werk_prive: 'Balans', motivatie_werk: 'Motivatie',
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vandaag = new Date().toISOString().split('T')[0]

  const { data: cached } = await supabaseAdmin.from('checkin_analyses')
    .select('analyse_json').eq('user_id', user.id).gte('aangemaakt_op', `${vandaag}T00:00:00Z`)
    .not('analyse_json->checkin_trend', 'is', null).order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()
  const cacheData = cached?.analyse_json as Record<string, unknown> | null
  if (cacheData?.checkin_trend) return NextResponse.json(cacheData.checkin_trend)

  const { data: checkins } = await supabaseAdmin.from('checkins')
    .select('scores, aangemaakt_op').eq('user_id', user.id)
    .order('aangemaakt_op', { ascending: false }).limit(4)

  if (!checkins || checkins.length < 2) {
    return NextResponse.json({
      trend_bericht: 'Doe minimaal 2 check-ins om je welzijnstrend te zien.',
      positieve_trends: [], aandachtspunten: [], acties: [], heeft_data: false,
    })
  }

  const recenteScores = checkins[0].scores as Record<string, number>
  const vorigeScores  = checkins[1].scores as Record<string, number>

  const trends: { label: string; delta: number; recent: number }[] = []
  for (const [code, label] of Object.entries(DOMEIN_LABELS)) {
    const recent = recenteScores[code] || 0
    const vorige = vorigeScores[code] || 0
    if (recent > 0 && vorige > 0) trends.push({ label, delta: recent - vorige, recent })
  }

  const verbeterd    = trends.filter(t => t.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3)
  const verslechterd = trends.filter(t => t.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 2)

  const scoreRegels = Object.entries(recenteScores)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${DOMEIN_LABELS[k] || k}: ${v}/5`)
    .join(', ')

  const prompt = `Je bent een empathische welzijnscoach. Analyseer check-in trends.

Recente scores: ${scoreRegels}
${verbeterd.length > 0 ? `Verbeterd vs vorige week: ${verbeterd.map(t => `${t.label} (+${t.delta.toFixed(1)})`).join(', ')}` : ''}
${verslechterd.length > 0 ? `Gedaald: ${verslechterd.map(t => `${t.label} (${t.delta.toFixed(1)})`).join(', ')}` : ''}

Geef PRECIES:
1. Een persoonlijk trend-bericht (2 zinnen, warm en empathisch)
2. Maximaal 2 concrete actietips

Formatteer als JSON zonder markdown:
{"trend_bericht": "...", "acties": ["tip 1", "tip 2"]}`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5', max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = (message.content[0] as { type: string; text: string }).text.trim()
    .replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()

  let aiResponse: { trend_bericht: string; acties: string[] }
  try { aiResponse = JSON.parse(responseText) }
  catch { aiResponse = { trend_bericht: responseText, acties: [] } }

  const resultaat = {
    trend_bericht: aiResponse.trend_bericht, acties: aiResponse.acties || [],
    positieve_trends: verbeterd, aandachtspunten: verslechterd,
    aantalCheckins: checkins.length, heeft_data: true,
  }

  const { data: existingAnalyse } = await supabaseAdmin.from('checkin_analyses')
    .select('id, analyse_json').eq('user_id', user.id).gte('aangemaakt_op', `${vandaag}T00:00:00Z`)
    .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()
  if (existingAnalyse) {
    const updated = { ...(existingAnalyse.analyse_json as object || {}), checkin_trend: resultaat }
    await supabaseAdmin.from('checkin_analyses').update({ analyse_json: updated }).eq('id', existingAnalyse.id)
  }

  return NextResponse.json(resultaat)
}
