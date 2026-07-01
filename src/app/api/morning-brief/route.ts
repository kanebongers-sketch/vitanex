
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
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vandaag = new Date().toISOString().split('T')[0]

  // Check cache (today's brief)
  const { data: cached } = await supabaseAdmin
    .from('checkin_analyses')
    .select('analyse_json')
    .eq('user_id', user.id)
    .gte('aangemaakt_op', `${vandaag}T00:00:00Z`)
    .not('analyse_json->morning_brief', 'is', null)
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (cached?.analyse_json?.morning_brief) {
    return NextResponse.json({ bericht: cached.analyse_json.morning_brief })
  }

  // Fetch last check-in scores
  const { data: checkin } = await supabaseAdmin
    .from('checkin_analyses')
    .select('scores, aangemaakt_op')
    .eq('user_id', user.id)
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!checkin) {
    return NextResponse.json({ error: 'no_checkin' }, { status: 404 })
  }

  // Fetch wearable data (yesterday)
  const gisteren = new Date()
  gisteren.setDate(gisteren.getDate() - 1)
  const gisterenStr = gisteren.toISOString().split('T')[0]

  const { data: wearable } = await supabaseAdmin
    .from('health_native_logs')
    .select('stappen, slaap_minuten, hartslag_gemiddeld, calorieen')
    .eq('user_id', user.id)
    .eq('datum', gisterenStr)
    .maybeSingle()

  // Fetch profile name
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('naam')
    .eq('id', user.id)
    .maybeSingle()

  const naam = profile?.naam || 'je'
  const scores = checkin.scores as Record<string, number> || {}

  const wearableContext = wearable
    ? `Gisteren heb je ${wearable.stappen ?? '?'} stappen gezet, ${wearable.slaap_minuten ? Math.round(wearable.slaap_minuten / 60) + 'u' + (wearable.slaap_minuten % 60) + 'min' : '?'} geslapen${wearable.hartslag_gemiddeld ? ` en je hartslag was gemiddeld ${wearable.hartslag_gemiddeld} bpm` : ''}.`
    : ''

  const scoreContext = Object.entries(scores)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}: ${((v / 20) * 5).toFixed(1)}/5`)
    .join(', ')

  const prompt = `Je bent een warme, motiverende welzijnscoach. Schrijf een persoonlijke ochtendgroet voor ${naam}.

Welzijnsscores (schaal 1-5): ${scoreContext || 'niet beschikbaar'}
${wearableContext}

Schrijf een bericht van 2-3 zinnen dat:
- Begint met "${naam}" of een variatie
- Warm en persoonlijk aanvoelt
- Aansluit op de scores/data
- Praktisch en motiverend eindigt
- In het Nederlands is
- Geen opsommingen of bullets gebruikt

Geef alleen het bericht, geen extra uitleg.`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  })

  const bericht = (message.content[0] as { type: string; text: string }).text.trim()

  // Cache the brief (try to update today's latest analysis, or create a stub)
  const { data: existingAnalyse } = await supabaseAdmin
    .from('checkin_analyses')
    .select('id, analyse_json')
    .eq('user_id', user.id)
    .gte('aangemaakt_op', `${vandaag}T00:00:00Z`)
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingAnalyse) {
    const updated = { ...(existingAnalyse.analyse_json as object || {}), morning_brief: bericht }
    await supabaseAdmin
      .from('checkin_analyses')
      .update({ analyse_json: updated })
      .eq('id', existingAnalyse.id)
  }

  return NextResponse.json({ bericht })
}
