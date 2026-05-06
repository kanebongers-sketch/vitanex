import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI coach is niet beschikbaar: ANTHROPIC_API_KEY ontbreekt.' }, { status: 503 })
  }

  try {
    const { berichten, systeem: systeemOverride, maxTokens }: {
      berichten: Bericht[]
      systeem?: string
      maxTokens?: number
    } = await req.json()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens ?? 400,
      system: systeemOverride ?? SYSTEEM,
      messages: berichten,
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ tekst })
  } catch (err) {
    console.error('[coach]', err)
    return NextResponse.json({ error: 'Kon de coach niet bereiken.' }, { status: 500 })
  }
}
