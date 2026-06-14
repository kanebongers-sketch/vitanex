import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function GET(req: NextRequest) {
  if (!anthropic) return NextResponse.json({ error: 'AI niet beschikbaar.' }, { status: 503 })

  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const zevenDagenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: checkIns },
    { data: stemmingLogs },
    { data: slaapLogs },
    { data: stressLogs },
    { data: burnoutScore },
    { data: dankbaarheidLogs },
    { data: focusLogs },
  ] = await Promise.all([
    admin.from('checkin_sessies').select('domein_scores, aangemaakt_op').eq('user_id', user.id).gte('aangemaakt_op', zevenDagenGeleden).order('aangemaakt_op', { ascending: false }),
    admin.from('stemming_logs').select('stemming, energie, aangemaakt_op').eq('user_id', user.id).gte('aangemaakt_op', zevenDagenGeleden),
    admin.from('slaap_logs').select('uren_slaap, kwaliteit, datum').eq('user_id', user.id).gte('datum', zevenDagenGeleden.split('T')[0]),
    admin.from('stress_logs').select('stress_niveau, techniek, aangemaakt_op').eq('user_id', user.id).gte('aangemaakt_op', zevenDagenGeleden),
    admin.from('burnout_predictor_scores').select('risico_score, trending, dominante_factor, week_start').eq('user_id', user.id).order('week_start', { ascending: false }).limit(1).maybeSingle(),
    admin.from('dankbaarheid_logs').select('items, datum').eq('user_id', user.id).gte('datum', zevenDagenGeleden.split('T')[0]),
    admin.from('focus_timer_logs').select('duur_minuten, type, aangemaakt_op').eq('user_id', user.id).gte('aangemaakt_op', zevenDagenGeleden),
  ])

  // Verwerk data
  const gemStemming = stemmingLogs?.length
    ? (stemmingLogs.reduce((s, l) => s + l.stemming, 0) / stemmingLogs.length).toFixed(1)
    : null

  const gemSlaap = slaapLogs?.length
    ? (slaapLogs.reduce((s, l) => s + l.uren_slaap, 0) / slaapLogs.length).toFixed(1)
    : null

  const gemStress = stressLogs?.length
    ? (stressLogs.reduce((s, l) => s + l.stress_niveau, 0) / stressLogs.length).toFixed(1)
    : null

  const focusMinuten = focusLogs?.reduce((s, l) => s + (l.duur_minuten ?? 0), 0) ?? 0

  const contextDelen = [
    checkIns?.length ? `Check-ins deze week: ${checkIns.length}` : '',
    gemStemming ? `Gemiddelde stemming: ${gemStemming}/5` : '',
    gemSlaap ? `Gemiddelde slaap: ${gemSlaap} uur` : '',
    gemStress ? `Gemiddeld stress: ${gemStress}/10` : '',
    burnoutScore ? `Burnout risico: ${burnoutScore.risico_score}% (${burnoutScore.trending ?? 'stabiel'})` : '',
    dankbaarheidLogs?.length ? `Dankbaarheid ingevuld: ${dankbaarheidLogs.length}x` : '',
    focusMinuten > 0 ? `Focus sessies: ${focusMinuten} minuten` : '',
  ].filter(Boolean).join('\n')

  if (!contextDelen) {
    return NextResponse.json({
      inzichten: null,
      bericht: 'Vul eerst je check-in, stemming of slaap in om wekelijkse inzichten te ontvangen.',
    })
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Geef wekelijkse welzijnsinzichten op basis van:

${contextDelen}

Geef JSON terug:
{
  "samenvatting": "2-3 zinnen samenvatting van de week",
  "patroon": "1 opvallend patroon of trend",
  "tip_van_de_week": "1 concrete tip voor volgende week gebaseerd op de data",
  "score_label": "Sterke week/Goede week/Gemiddelde week/Uitdagende week"
}

Schrijf in het Nederlands, warm en persoonlijk.`,
    }],
  })

  const tekst = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
  let parsed: Record<string, string> = {}
  try {
    const m = tekst.match(/\{[\s\S]*\}/)
    if (m) parsed = JSON.parse(m[0])
  } catch { /* ignore */ }

  return NextResponse.json({
    inzichten: parsed,
    stats: {
      checkins: checkIns?.length ?? 0,
      stemming: gemStemming,
      slaap: gemSlaap,
      stress: gemStress,
      burnout_risico: burnoutScore?.risico_score ?? null,
      burnout_trending: burnoutScore?.trending ?? null,
      focus_minuten: focusMinuten,
      dankbaarheid_dagen: dankbaarheidLogs?.length ?? 0,
    },
  })
}
