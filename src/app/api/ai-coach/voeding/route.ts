
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const RDI = { calorieen: 2000, eiwitten_g: 50, koolhydraten_g: 260, vetten_g: 70, vezels_g: 25 }

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.slice(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vandaag = new Date().toISOString().split('T')[0]

  // Cache
  const { data: cached } = await supabaseAdmin
    .from('checkin_analyses').select('analyse_json').eq('user_id', user.id)
    .gte('aangemaakt_op', `${vandaag}T00:00:00Z`).not('analyse_json->voeding_coach', 'is', null)
    .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()

  const cacheData = cached?.analyse_json as Record<string, unknown> | null
  if (cacheData?.voeding_coach) return NextResponse.json(cacheData.voeding_coach)

  const { data: logs } = await supabaseAdmin
    .from('voeding_logs').select('maaltijd_type, calorieen, eiwitten_g, koolhydraten_g, vetten_g, vezels_g, omschrijving')
    .eq('user_id', user.id).eq('datum', vandaag)

  if (!logs || logs.length === 0) {
    return NextResponse.json({ tip: 'Log je eerste maaltijd van vandaag om persoonlijke voedingscoaching te ontvangen!', score: null, maaltijden_gelogd: 0, status: 'leeg' })
  }

  const totaal = logs.reduce((acc, l) => ({
    calorieen: acc.calorieen + (l.calorieen || 0),
    eiwitten_g: acc.eiwitten_g + (l.eiwitten_g || 0),
    koolhydraten_g: acc.koolhydraten_g + (l.koolhydraten_g || 0),
    vetten_g: acc.vetten_g + (l.vetten_g || 0),
    vezels_g: acc.vezels_g + (l.vezels_g || 0),
  }), { calorieen: 0, eiwitten_g: 0, koolhydraten_g: 0, vetten_g: 0, vezels_g: 0 })

  const maaltijdTypes = [...new Set(logs.map(l => l.maaltijd_type))]
  const heeftOntbijt = maaltijdTypes.includes('ontbijt')
  const uurNu = new Date().getHours()

  const calPct = Math.min(100, (totaal.calorieen / RDI.calorieen) * 100)
  const eiPct  = Math.min(100, (totaal.eiwitten_g / RDI.eiwitten_g) * 100)
  const vezPct = Math.min(100, (totaal.vezels_g / RDI.vezels_g) * 100)
  const score  = Math.round(calPct * 0.3 + eiPct * 0.4 + vezPct * 0.3)

  const tekort: string[] = []
  const goed: string[] = []
  if (eiPct < 60)  tekort.push(`eiwit (${totaal.eiwitten_g.toFixed(0)}g / ${RDI.eiwitten_g}g)`)
  if (vezPct < 50) tekort.push(`vezels (${totaal.vezels_g.toFixed(0)}g / ${RDI.vezels_g}g)`)
  if (!heeftOntbijt && uurNu >= 10) tekort.push('ontbijt overgeslagen')
  if (eiPct >= 80)  goed.push('eiwitdoel bijna gehaald')
  if (vezPct >= 80) goed.push('goede vezelinname')

  const maaltijdNamen = logs.map(l => l.omschrijving).filter(Boolean).join(', ')
  const prompt = `Je bent een warme voedingscoach. Geef persoonlijke feedback.

Vandaag gelogd (${logs.length} maaltijden): ${maaltijdTypes.join(', ')}
Maaltijden: ${maaltijdNamen}
Calorieen: ${totaal.calorieen} / ${RDI.calorieen} kcal (${Math.round(calPct)}%)
Eiwit: ${totaal.eiwitten_g.toFixed(0)}g / ${RDI.eiwitten_g}g (${Math.round(eiPct)}%)
Koolhydraten: ${totaal.koolhydraten_g.toFixed(0)}g / ${RDI.koolhydraten_g}g
Vezels: ${totaal.vezels_g.toFixed(0)}g / ${RDI.vezels_g}g (${Math.round(vezPct)}%)
${tekort.length > 0 ? `Aandachtspunten: ${tekort.join(', ')}` : ''}
${goed.length > 0 ? `Goed: ${goed.join(', ')}` : ''}

Schrijf PRECIES 2 zinnen coaching:
1. Erken wat goed gaat (specifiek)
2. Geef één concrete haalbare tip voor vandaag

Alleen het bericht, geen groet.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5', max_tokens: 180,
    messages: [{ role: 'user', content: prompt }],
  })

  const tip = (message.content[0] as { type: string; text: string }).text.trim()
  const resultaat = {
    tip, score, maaltijden_gelogd: logs.length,
    calorieen_pct: Math.round(calPct), eiwit_pct: Math.round(eiPct), vezels_pct: Math.round(vezPct),
    tekort, goed,
    status: score >= 70 ? 'goed' : score >= 40 ? 'matig' : 'aandacht',
  }

  const { data: existingAnalyse } = await supabaseAdmin.from('checkin_analyses')
    .select('id, analyse_json').eq('user_id', user.id)
    .gte('aangemaakt_op', `${vandaag}T00:00:00Z`).order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle()
  if (existingAnalyse) {
    const updated = { ...(existingAnalyse.analyse_json as object || {}), voeding_coach: resultaat }
    await supabaseAdmin.from('checkin_analyses').update({ analyse_json: updated }).eq('id', existingAnalyse.id)
  }

  return NextResponse.json(resultaat)
}
