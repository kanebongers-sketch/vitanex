import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[coach] ANTHROPIC_API_KEY is niet ingesteld in de omgevingsvariabelen')
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEEM = `Je bent de MentaForce Coach — een warme, empathische welzijnscoach die werknemers begeleidt bij stress, burn-out preventie, energiebeheer, werk-privébalans en mentale veerkracht. Je werkt voor het MentaForce platform dat gebruikt wordt door Nederlandse bedrijven.

Jouw stijl:
- Je communiceert altijd in het Nederlands (nederlands)
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

// Simple in-memory rate limiter per user (resets on deploy/restart)
const rateMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 30  // max messages
const RATE_WINDOW = 60 * 60 * 1000  // per hour

function checkRateLimit(userId: string): boolean {
  const now  = Date.now()
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

  // ── Auth verification ──────────────────────────────────────────────────────
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Te veel berichten. Probeer het over een uur opnieuw.' },
      { status: 429 }
    )
  }

  try {
    const { berichten, maxTokens }: {
      berichten: Bericht[]
      systeem?: string
      maxTokens?: number
    } = await req.json()

    // Validate input
    if (!Array.isArray(berichten) || berichten.length === 0) {
      return NextResponse.json({ error: 'Geen berichten meegegeven.' }, { status: 400 })
    }
    if (berichten.length > 50) {
      return NextResponse.json({ error: 'Te veel berichten in de context.' }, { status: 400 })
    }

    // systeemOverride is niet toegestaan — gebruik altijd het server-side systeem-prompt
    const systeemTekst = SYSTEEM

    // Prompt caching: cache het systeem-prompt
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
        // Cache de voorlaatste user-message als die lang genoeg is
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
