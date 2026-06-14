import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { buildCoachSystemPrompt } from '@/lib/coach-context'

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[coach] ANTHROPIC_API_KEY is niet ingesteld')
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASIS_SYSTEEM = `Je bent de MentaForce Coach — een warme, empathische welzijnscoach die werknemers begeleidt bij stress, burn-out preventie, energiebeheer, werk-privébalans en mentale veerkracht.

Jouw stijl:
- Je communiceert altijd in het Nederlands
- Je bent warm, niet-oordelend en praktisch
- Je stelt reflectieve vragen om inzicht te stimuleren
- Je biedt concrete, toepasbare tips
- Je herkent patronen en helpt die benoemen
- Antwoorden zijn beknopt (max 120 woorden) tenzij de gebruiker uitgebreider vraagt
- Gebruik geen medisch jargon

Grenzen:
- Je bent geen therapeut of psycholoog
- Bij ernstige symptomen (burn-out, depressie, crisis) verwijs je vriendelijk door naar professionele hulp of de huisarts
- Je geeft nooit medicatieadvies`

type Bericht = { role: 'user' | 'assistant'; content: string }

type GebruikerContext = {
  naam: string
  discPrimair?: string
  domeinScores?: Record<string, number>
  actieveDoelen?: string[]
}

const rateMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60 * 60 * 1000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const data = rateMap.get(userId)
  if (!data || now > data.reset) {
    rateMap.set(userId, { count: 1, reset: now + RATE_WINDOW })
    return true
  }
  if (data.count >= RATE_LIMIT) return false
  data.count++
  return true
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI coach is niet beschikbaar.' }, { status: 503 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Te veel berichten. Probeer het over een uur opnieuw.' },
      { status: 429 },
    )
  }

  try {
    const { berichten, gebruiker_context, maxTokens }: {
      berichten: Bericht[]
      gebruiker_context?: GebruikerContext
      maxTokens?: number
    } = await req.json()

    if (!Array.isArray(berichten) || berichten.length === 0) {
      return NextResponse.json({ error: 'Geen berichten meegegeven.' }, { status: 400 })
    }
    if (berichten.length > 50) {
      return NextResponse.json({ error: 'Te veel berichten in de context.' }, { status: 400 })
    }

    // Bouw gepersonaliseerd systeem-prompt met gebruikerscontext
    const defaultContext: GebruikerContext = { naam: 'je', ...gebruiker_context }
    const systeemTekst = await buildCoachSystemPrompt(BASIS_SYSTEEM, user.id, defaultContext)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens ?? 400,
      system: [
        {
          type: 'text',
          text: systeemTekst,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: berichten.map((b, i) => {
        if (i === berichten.length - 2 && b.role === 'user' && b.content.length > 200) {
          return {
            role: b.role,
            content: [{ type: 'text' as const, text: b.content, cache_control: { type: 'ephemeral' as const } }],
          }
        }
        return b
      }),
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({ tekst })
  } catch (err) {
    console.error('[coach]', err)
    return NextResponse.json({ error: 'Kon de coach niet bereiken.' }, { status: 500 })
  }
}
