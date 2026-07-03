import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { getPlanVoorUser } from '@/lib/plan-server'
import { heeftFeature } from '@/lib/plan'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const plan = await getPlanVoorUser(admin, user.id)
  if (!heeftFeature(plan, 'persoonlijke_patronen')) {
    return NextResponse.json(
      { error: 'AI-weekinzichten zijn onderdeel van het Groei-plan.', code: 'premium' },
      { status: 403 },
    )
  }

  const weekStart = (() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().slice(0, 10)
  })()

  // Check cache eerst
  const { data: cache } = await admin
    .from('wellbeing_weekrapporten')
    .select('samenvatting, patroon, tip, score_label, stats')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (cache?.samenvatting) {
    return NextResponse.json({ rapport: cache, week_start: weekStart })
  }

  // Data ophalen parallel
  const [
    { data: stemming },
    { data: slaap },
    { data: stress },
    { data: dankbaar },
    { data: checkins },
  ] = await Promise.all([
    admin.from('stemming_logs').select('stemming, aangemaakt_op')
      .eq('user_id', user.id).gte('aangemaakt_op', `${weekStart}T00:00:00Z`),
    admin.from('slaap_logs').select('uren_slaap, kwaliteit, datum')
      .eq('user_id', user.id).gte('datum', weekStart),
    admin.from('stress_logs').select('stress_niveau, aangemaakt_op')
      .eq('user_id', user.id).gte('aangemaakt_op', `${weekStart}T00:00:00Z`),
    admin.from('dankbaarheid_logs').select('items, datum')
      .eq('user_id', user.id).gte('datum', weekStart),
    admin.from('checkin_analyses').select('scores, aangemaakt_op')
      .eq('user_id', user.id).gte('aangemaakt_op', `${weekStart}T00:00:00Z`),
  ])

  const gemStemming = stemming?.length
    ? (stemming.reduce((s, l) => s + l.stemming, 0) / stemming.length).toFixed(1)
    : null
  const gemSlaap = slaap?.length
    ? (slaap.reduce((s, l) => s + l.uren_slaap, 0) / slaap.length).toFixed(1)
    : null
  const gemStress = stress?.length
    ? (stress.reduce((s, l) => s + l.stress_niveau, 0) / stress.length).toFixed(1)
    : null

  const stats = {
    stemming: gemStemming ? parseFloat(gemStemming) : null,
    slaap: gemSlaap ? parseFloat(gemSlaap) : null,
    stress: gemStress ? parseFloat(gemStress) : null,
    aantal_checkins: checkins?.length ?? 0,
    dankbaarheid_items: (dankbaar ?? []).flatMap(d => d.items as string[]).length,
  }

  let samenvatting: string | null = null
  let patroon: string | null = null
  let tip: string | null = null
  let score_label: string | null = null

  if (anthropic && (stats.stemming || stats.slaap || stats.stress || stats.aantal_checkins > 0)) {
    const prompt = `Analyseer de welzijnsdata van deze week voor een medewerker.

Weekdata:
- Stemming: ${stats.stemming ?? 'geen data'}/5
- Slaap: ${stats.slaap ?? 'geen data'} uur gemiddeld
- Stress: ${stats.stress ?? 'geen data'}/10
- Check-ins: ${stats.aantal_checkins}
- Dankbaarheidsitems: ${stats.dankbaarheid_items}

Geef een JSON met exact deze structuur:
{
  "samenvatting": "2-3 zinnen in tweede persoon (jij/jouw), empathisch en specifiek over de data",
  "patroon": "1 observatie: een patroon of verband in de data",
  "tip": "1 concrete, praktische tip voor volgende week",
  "score_label": "één woord: Uitstekend/Goed/Matig/Lastig"
}

Alleen JSON, geen extra tekst. Nederlands.`

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      })
      const tekst = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
      const match = tekst.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        samenvatting = parsed.samenvatting
        patroon = parsed.patroon
        tip = parsed.tip
        score_label = parsed.score_label
      }
    } catch { /* non-critical */ }
  }

  const rapport = { samenvatting, patroon, tip, score_label, stats }

  // Sla op als we iets hebben
  if (samenvatting) {
    await admin.from('wellbeing_weekrapporten').upsert({
      user_id: user.id,
      week_start: weekStart,
      samenvatting,
      patroon,
      tip,
      score_label,
      stats,
    }, { onConflict: 'user_id,week_start' })
  }

  return NextResponse.json({ rapport, week_start: weekStart })
}
