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

const FALLBACK_MESSAGE = 'Hey, ik ben er voor je.'

const SYSTEM_PROMPT = `Jij bent Vita, de AI-companion van MentaForce — dezelfde warme panda-companion die de gebruiker in de app kent. Je zweeft boven de app en geeft af en toe een korte, persoonlijke duw in de rug.

- Spreek altijd in de ik-vorm, in het Nederlands, warm en menselijk.
- Kort en oprecht: precies 1–2 zinnen. Nooit formeel, nooit een preek.
- Stem je toon af op de situatie: steunend en rustig als het zwaar is, aanmoedigend als er momentum is.
- Emoji spaarzaam en alleen als het echt warmte toevoegt.
- Klink als een companion die deze persoon al kent, niet als een generieke melding.`

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = nudgeBodySchema.parse(body)

    const userMessage = `Schrijf als Vita een korte, persoonlijke boodschap voor deze persoon. Situatie:
Huidige context: ${parsed.context}
Tijdstip: ${parsed.time_of_day}
Emotionele toon om aan te houden: ${parsed.emotion}
Gewenste toon-richting: ${parsed.persona}
Aanleiding: ${parsed.trigger}
Score: ${parsed.score ?? 'onbekend'}

Gebruik de emotionele toon en toon-richting om te bepalen HOE warm/rustig/aanmoedigend je klinkt — noem ze niet letterlijk. Spreek in de ik-vorm. 1–2 zinnen.`

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
