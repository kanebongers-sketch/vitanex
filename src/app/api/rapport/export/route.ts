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

  const [
    { data: profiel },
    { data: checkIns },
    { data: burnout },
    { data: groeiplan },
    { data: stemming },
    { data: slaap },
    { data: stress },
    { data: disc },
  ] = await Promise.all([
    admin.from('profiles').select('naam, email, aangemaakt_op').eq('id', user.id).single(),
    admin.from('checkin_sessies').select('aangemaakt_op, domein_scores')
      .eq('user_id', user.id).order('aangemaakt_op', { ascending: false }).limit(8),
    admin.from('burnout_predictor_scores').select('risico_score, trending, dominante_factor')
      .eq('user_id', user.id).order('week_start', { ascending: false }).limit(1).maybeSingle(),
    admin.from('groeiplannen').select('doelen, sterke_punten, aandachtspunten, acties, aangemaakt_op')
      .eq('user_id', user.id).order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle(),
    admin.from('stemming_logs').select('stemming, aangemaakt_op')
      .eq('user_id', user.id).order('aangemaakt_op', { ascending: false }).limit(14),
    admin.from('slaap_logs').select('uren_slaap, kwaliteit').eq('user_id', user.id)
      .order('datum', { ascending: false }).limit(14),
    admin.from('stress_logs').select('stress_niveau').eq('user_id', user.id)
      .order('aangemaakt_op', { ascending: false }).limit(14),
    admin.from('disc_resultaten').select('dominant_type, scores, aangemaakt_op')
      .eq('user_id', user.id).order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle(),
  ])

  const laasteCi = checkIns?.[0]
  const domeinScores = laasteCi?.domein_scores as Record<string, number> | null

  const gemStemming = stemming?.length
    ? Math.round(stemming.reduce((s, l) => s + l.stemming, 0) / stemming.length * 10) / 10
    : null
  const gemSlaap = slaap?.length
    ? Math.round(slaap.reduce((s, l) => s + l.uren_slaap, 0) / slaap.length * 10) / 10
    : null
  const gemStress = stress?.length
    ? Math.round(stress.reduce((s, l) => s + l.stress_niveau, 0) / stress.length * 10) / 10
    : null

  let aiSamenvatting: string | null = null

  if (anthropic && domeinScores) {
    const scoreSummary = Object.entries(domeinScores)
      .map(([k, v]) => `${k}: ${v}/20`)
      .join(', ')

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Schrijf een professionele, empathische samenvatting van 2-3 alinea's voor een welzijnsrapport van een medewerker. Geef inzichten en aanbevelingen.

Data:
- Domeinscores: ${scoreSummary}
- Burnout risico: ${burnout?.risico_score ?? 'onbekend'}% (${burnout?.trending ?? 'stabiel'})
- Gemiddelde stemming: ${gemStemming ?? 'onbekend'}/5
- Gemiddelde slaap: ${gemSlaap ?? 'onbekend'} uur
- Gemiddelde stress: ${gemStress ?? 'onbekend'}/10
- DISC type: ${disc?.dominant_type ?? 'niet ingevuld'}
- Aantal check-ins: ${checkIns?.length ?? 0}

Schrijf in de tweede persoon (jij/jouw), positief en constructief. Max 300 woorden. Nederlands.`,
      }],
    })
    aiSamenvatting = response.content[0].type === 'text' ? response.content[0].text.trim() : null
  }

  return NextResponse.json({
    rapport: {
      gegenereerd_op: new Date().toISOString(),
      periode: checkIns?.length
        ? `${checkIns[checkIns.length - 1]?.aangemaakt_op?.slice(0, 10)} t/m ${checkIns[0]?.aangemaakt_op?.slice(0, 10)}`
        : 'Geen data',
      naam: profiel?.naam ?? 'Medewerker',
      domein_scores: domeinScores,
      burnout: burnout ? {
        risico: burnout.risico_score,
        trending: burnout.trending,
        dominante_factor: burnout.dominante_factor,
      } : null,
      gemiddelden: {
        stemming: gemStemming,
        slaap: gemSlaap,
        stress: gemStress,
      },
      disc_type: disc?.dominant_type ?? null,
      groeiplan: groeiplan ? {
        doelen: groeiplan.doelen,
        sterke_punten: groeiplan.sterke_punten,
        aangemaakt_op: groeiplan.aangemaakt_op,
      } : null,
      ai_samenvatting: aiSamenvatting,
    },
  })
}
