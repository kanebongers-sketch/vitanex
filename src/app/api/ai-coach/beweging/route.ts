
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vandaag = new Date().toISOString().split('T')[0]

  const { data: cached } = await supabaseAdmin.from('checkin_analyses')
    .select('analyse_json').eq('user_id', user.id).gte('aangemaakt_op', `${vandaag}T00:00:00Z`)
    .not('analyse_json->beweging_coach', 'is', null).order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()
  const cacheData = cached?.analyse_json as Record<string, unknown> | null
  if (cacheData?.beweging_coach) return NextResponse.json(cacheData.beweging_coach)

  const veertienGeleden = new Date()
  veertienGeleden.setDate(veertienGeleden.getDate() - 14)
  const veertienStr = veertienGeleden.toISOString().split('T')[0]

  const [wearablesResult, checkinsResult] = await Promise.all([
    supabaseAdmin.from('health_native_logs').select('datum, stappen, slaap_minuten, hartslag_gemiddeld')
      .eq('user_id', user.id).gte('datum', veertienStr).order('datum', { ascending: false }).limit(14),
    supabaseAdmin.from('checkin_analyses').select('scores, aangemaakt_op')
      .eq('user_id', user.id).gte('aangemaakt_op', `${veertienStr}T00:00:00Z`)
      .order('aangemaakt_op', { ascending: false }).limit(4),
  ])

  const wearables = wearablesResult.data || []
  const checkins  = checkinsResult.data || []

  if (wearables.length === 0 && checkins.length === 0) {
    return NextResponse.json({
      inzicht: 'Koppel een wearable om persoonlijke bewegingsinzichten te ontvangen. Je kunt Google Health, Samsung Health of Apple Health koppelen via Koppelingen.',
      trend: 'neutraal', tips: [], heeft_data: false,
    })
  }

  const metStappen = wearables.filter(w => w.stappen)
  const metSlaap = wearables.filter(w => w.slaap_minuten)
  const metHartslag = wearables.filter(w => w.hartslag_gemiddeld)

  const gemStappen   = metStappen.length   ? Math.round(metStappen.reduce((a, w) => a + (w.stappen || 0), 0) / metStappen.length) : null
  const gemSlaap     = metSlaap.length     ? Math.round(metSlaap.reduce((a, w) => a + (w.slaap_minuten || 0), 0) / metSlaap.length) : null
  const gemHartslag  = metHartslag.length  ? Math.round(metHartslag.reduce((a, w) => a + Number(w.hartslag_gemiddeld || 0), 0) / metHartslag.length) : null

  const recente7 = wearables.slice(0, 7).filter(w => w.stappen)
  const eerdere7 = wearables.slice(7, 14).filter(w => w.stappen)
  const recGem = recente7.length ? recente7.reduce((a, w) => a + (w.stappen || 0), 0) / recente7.length : 0
  const eerGem = eerdere7.length ? eerdere7.reduce((a, w) => a + (w.stappen || 0), 0) / eerdere7.length : 0
  const stappenTrend = eerGem > 0 ? Math.round(((recGem - eerGem) / eerGem) * 100) : 0

  const recenteCheckin = checkins[0]?.scores as Record<string, number> | undefined

  const dataRegels: string[] = []
  if (gemStappen)  dataRegels.push(`Gemiddeld stappen: ${gemStappen.toLocaleString('nl')}/dag`)
  if (gemSlaap)    dataRegels.push(`Gemiddelde slaap: ${Math.floor(gemSlaap/60)}u${gemSlaap%60}min`)
  if (gemHartslag) dataRegels.push(`Gemiddelde hartslag: ${gemHartslag} bpm`)
  if (stappenTrend !== 0) dataRegels.push(`Stappentendenz: ${stappenTrend > 0 ? '+' : ''}${stappenTrend}% vs vorige week`)
  if (recenteCheckin?.energie_niveau) dataRegels.push(`Energiescore: ${recenteCheckin.energie_niveau}/5`)

  const prompt = `Je bent een bewegings- en vitaliteitscoach. Geef een persoonlijk inzicht.

Data laatste 14 dagen (${wearables.length} metingen):
${dataRegels.join('\n')}

Schrijf PRECIES 2 zinnen bewegingsinzicht:
1. Benoem een positieve observatie of patroon
2. Geef één concrete motiverende actietip voor komende week

Alleen het inzicht, warm en persoonlijk, in het Nederlands.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5', max_tokens: 180,
    messages: [{ role: 'user', content: prompt }],
  })

  const inzicht = (message.content[0] as { type: string; text: string }).text.trim()
  const tips: string[] = []
  if (gemStappen && gemStappen < 7000) tips.push('Probeer elke dag 500 extra stappen te zetten')
  if (gemSlaap && gemSlaap < 420)      tips.push('Streef naar 7 uur slaap voor beter herstel')

  const trend: 'positief' | 'neutraal' | 'negatief' = stappenTrend > 10 ? 'positief' : stappenTrend < -10 ? 'negatief' : 'neutraal'
  const resultaat = { inzicht, trend, tips, heeft_data: true, gemStappen, gemSlaap, gemHartslag, stappenTrend }

  const { data: existingAnalyse } = await supabaseAdmin.from('checkin_analyses')
    .select('id, analyse_json').eq('user_id', user.id).gte('aangemaakt_op', `${vandaag}T00:00:00Z`)
    .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()
  if (existingAnalyse) {
    const updated = { ...(existingAnalyse.analyse_json as object || {}), beweging_coach: resultaat }
    await supabaseAdmin.from('checkin_analyses').update({ analyse_json: updated }).eq('id', existingAnalyse.id)
  }

  return NextResponse.json(resultaat)
}
