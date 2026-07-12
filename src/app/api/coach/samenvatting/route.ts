import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { isRateLimited } from '@/lib/utils/rate-limit'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Bericht = { role: 'user' | 'assistant'; content: string }

// Zelfde systeemgrens-validatie als /api/coach: role 'user' | 'assistant'
// en content van 1–4000 tekens.
function valideerBericht(b: unknown): b is Bericht {
  if (typeof b !== 'object' || b === null) return false
  const { role, content } = b as Record<string, unknown>
  return (role === 'user' || role === 'assistant')
    && typeof content === 'string'
    && content.length >= 1
    && content.length <= 4000
}

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

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    // Best-effort rem per gebruiker: één samenvatting per gesprek-beurt is
    // ruim voldoende; 10 per uur dekt normaal gebruik.
    if (isRateLimited(`coach-samenvatting:${user.id}`, 10, 3600_000)) {
      return NextResponse.json(
        { error: 'Te veel samenvattingsverzoeken. Probeer het later opnieuw.' },
        { status: 429 },
      )
    }

    const { berichten }: { berichten: unknown } = await req.json()

    if (!Array.isArray(berichten) || berichten.length < 4) {
      return NextResponse.json({ ok: true })
    }
    if (berichten.length > 50) {
      return NextResponse.json({ error: 'Te veel berichten in de context.' }, { status: 400 })
    }
    for (const b of berichten) {
      if (!valideerBericht(b)) {
        return NextResponse.json({ error: 'Ongeldig bericht.' }, { status: 400 })
      }
    }
    const geldigeBerichten: Bericht[] = berichten

    const gespreksTekst = geldigeBerichten
      .slice(-20)
      .map(b => `${b.role === 'user' ? 'Gebruiker' : 'Vita'}: ${b.content}`)
      .join('\n')

    const admin = createAdminClient()
    const weekStart = berekenWeekStart(new Date())

    // Haal de bestaande weeksamenvatting op, zodat een tweede gesprek het
    // onderwerp van het eerste niet wist maar ermee gecombineerd wordt.
    const { data: bestaand } = await admin
      .from('coach_samenvattingen')
      .select('samenvatting')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle()

    const eerdereContext = bestaand?.samenvatting
      ? `Eerdere samenvatting van deze week: ${bestaand.samenvatting}\nCombineer met dit nieuwe gesprek tot maximaal 3 zinnen.\n\n`
      : ''

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Vat dit coach-gesprek samen in maximaal 2 zinnen. Focus op de kern: wat speelde er, welke inzichten of tips kwamen naar voren. Schrijf in de derde persoon ("De gebruiker..."). Antwoord alleen met de samenvatting.\n\n${eerdereContext}${gespreksTekst}`,
      }],
    })

    const samenvatting = response.content[0].type === 'text'
      ? response.content[0].text.trim()
      : ''

    if (!samenvatting) return NextResponse.json({ ok: true })

    await admin.from('coach_samenvattingen').upsert(
      { user_id: user.id, week_start: weekStart, samenvatting, berichten_count: berichten.length, bijgewerkt_op: new Date().toISOString() },
      { onConflict: 'user_id,week_start' },
    )

    return NextResponse.json({ samenvatting, week_start: weekStart })
  } catch (err) {
    console.error('[coach/samenvatting POST]', err)
    return NextResponse.json({ error: 'Samenvatting mislukt.' }, { status: 500 })
  }
}
