import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const nudgeBodySchema = z.object({
  context: z.string(),
  emotion: z.string(),
  persona: z.string(),
  score: z.number().optional(),
  time_of_day: z.string(),
  trigger: z.string(),
})

const FALLBACK_MESSAGE = 'Hey, ik ben er voor je! 🐼'

const SYSTEM_PROMPT = `Jij bent VITA, een vriendelijke AI gezondheidscoach die boven een lifestyle app zweeft als een persoonlijke companion. Je communiceert kort, warm en motiverend in het Nederlands. Altijd 1-2 zinnen. Nooit formeel. Gebruik soms een emoji.`

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = nudgeBodySchema.parse(body)

    const userMessage = `Stuur een korte, persoonlijke boodschap voor een gebruiker in de volgende situatie:
Huidige context: ${parsed.context}
Tijdstip: ${parsed.time_of_day}
Emotionele staat: ${parsed.emotion}
Persona: ${parsed.persona}
Aanleiding: ${parsed.trigger}
Score: ${parsed.score ?? 'onbekend'}
Schrijf 1-2 zinnen, warm en persoonlijk.`

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const firstBlock = response.content[0]
    const message = firstBlock.type === 'text' ? firstBlock.text : FALLBACK_MESSAGE

    return Response.json({ message })
  } catch {
    return Response.json({ message: FALLBACK_MESSAGE })
  }
}
