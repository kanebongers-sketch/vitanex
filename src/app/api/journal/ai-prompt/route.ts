import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function GET(req: NextRequest) {
  if (!anthropic) return NextResponse.json({ prompt: null })

  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const [{ data: stemming }, { data: stress }, { data: checkin }] = await Promise.all([
    admin.from('stemming_logs').select('stemming, notitie').eq('user_id', user.id)
      .order('aangemaakt_op', { ascending: false }).limit(3),
    admin.from('stress_logs').select('stress_niveau').eq('user_id', user.id)
      .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle(),
    admin.from('checkin_analyses').select('scores').eq('user_id', user.id)
      .order('aangemaakt_op', { ascending: false }).limit(1).maybeSingle(),
  ])

  const gemStemming = stemming?.length
    ? Math.round(stemming.reduce((s, l) => s + l.stemming, 0) / stemming.length * 10) / 10
    : null

  const stressNiveau = stress?.stress_niveau ?? null
  const scores = checkin?.scores as Record<string, number> | null

  const context = [
    gemStemming !== null ? `Gemiddelde stemming recent: ${gemStemming}/5` : null,
    stressNiveau !== null ? `Huidig stressniveau: ${stressNiveau}/10` : null,
    scores ? `Laagste domein: ${Object.entries(scores).sort(([,a],[,b]) => a - b)[0]?.[0] ?? 'onbekend'}` : null,
  ].filter(Boolean).join('. ')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `Genereer 1 persoonlijke reflectievraag voor een journaalentry op basis van:
${context || 'Geen context beschikbaar'}

De vraag moet:
- Persoonlijk en uitnodigend zijn
- Gericht op zelfinzicht, niet op problemen oplossen
- Nederlands
- Max 1 zin

Geef alleen de vraag terug, geen uitleg.`,
    }],
  })

  const prompt = response.content[0].type === 'text' ? response.content[0].text.trim() : null

  return NextResponse.json({ prompt })
}
