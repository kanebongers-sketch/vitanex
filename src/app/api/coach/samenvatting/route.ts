import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function berekenWeekStart(datum: Date): string {
  const d = new Date(datum)
  const dag = d.getDay()
  const diff = dag === 0 ? -6 : 1 - dag
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI niet beschikbaar.' }, { status: 503 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { berichten }: { berichten: { role: string; content: string }[] } = await req.json()

  if (!Array.isArray(berichten) || berichten.length < 2) {
    return NextResponse.json({ bericht: 'Te weinig berichten om samen te vatten.' })
  }

  const gespreksTekst = berichten
    .filter(b => b.role === 'user' || b.role === 'assistant')
    .map(b => `${b.role === 'user' ? 'Gebruiker' : 'Coach'}: ${b.content}`)
    .join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Vat dit coach-gesprek samen in maximaal 2 zinnen. Focus op de kern: wat speelde er, welke inzichten of tips kwamen naar voren. Schrijf in de derde persoon ("De gebruiker..."). Antwoord alleen met de samenvatting, niets anders.\n\n${gespreksTekst}`,
      },
    ],
  })

  const samenvatting =
    response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  if (!samenvatting) {
    return NextResponse.json({ bericht: 'Samenvatting mislukt.' })
  }

  const admin = createAdminClient()
  const weekStart = berekenWeekStart(new Date())

  await admin
    .from('coach_samenvattingen')
    .upsert(
      { user_id: user.id, week_start: weekStart, samenvatting },
      { onConflict: 'user_id,week_start' },
    )

  return NextResponse.json({ samenvatting, week_start: weekStart })
}
