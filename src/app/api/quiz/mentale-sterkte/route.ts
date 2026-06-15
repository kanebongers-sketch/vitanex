import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'

if (!process.env.ANTHROPIC_API_KEY) {
  // Gracefully handled at runtime
}

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

const VRAGEN = [
  'Als ik een tegenslag ervaar, herstel ik me snel.',
  'Ik kan omgaan met onzekerheid zonder overmatige stress.',
  'Ik stel prioriteiten goed en voorkom overbelasting.',
  'Ik durf nee te zeggen als mijn grenzen worden overschreden.',
  'Ik heb een duidelijk gevoel van wat mij motiveert.',
  'Ik heb goede sociale steun om op terug te vallen.',
  'Ik slaap voldoende en herstel goed van inspanning.',
  'Ik houd mijn negatieve gedachten goed onder controle.',
]

export async function GET() {
  return NextResponse.json({ vragen: VRAGEN })
}

export async function POST(req: NextRequest) {
  if (!anthropic) {
    return NextResponse.json({ error: 'AI niet beschikbaar.' }, { status: 503 })
  }

  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { antwoorden }: { antwoorden: number[] } = await req.json()

  if (!Array.isArray(antwoorden) || antwoorden.length !== VRAGEN.length) {
    return NextResponse.json({ error: 'Ongeldige antwoorden.' }, { status: 400 })
  }

  for (const a of antwoorden) {
    if (!Number.isInteger(a) || a < 1 || a > 5) {
      return NextResponse.json({ error: 'Elke score moet tussen 1 en 5 zijn.' }, { status: 400 })
    }
  }

  const totaal = antwoorden.reduce((s, a) => s + a, 0)
  const maximaal = VRAGEN.length * 5
  const percentage = Math.round((totaal / maximaal) * 100)

  const niveauLabel = percentage >= 80 ? 'Sterk' : percentage >= 60 ? 'Gemiddeld' : percentage >= 40 ? 'Kwetsbaar' : 'Aandacht nodig'

  const scorePairs = VRAGEN.map((v, i) => `${i + 1}. "${v}" — score: ${antwoorden[i]}/5`)

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    messages: [
      {
        role: 'user',
        content: `Geef een gepersonaliseerde analyse van de mentale veerkracht van iemand op basis van deze quiz-scores (1=nooit, 5=altijd):

${scorePairs.join('\n')}

Totaalscore: ${percentage}% (${niveauLabel})

Schrijf:
1. Een opening van 1 zin over het algemene niveau
2. Twee specifieke sterke punten (laagste score overslaan)
3. Twee concrete ontwikkelpunten (laagste 2 scores)
4. Één praktische actietip voor komende week

Schrijf in het Nederlands, warm maar direct. Max 200 woorden. Geen bullet-lists, gewoon doorlopende tekst.`,
      },
    ],
  })

  const analyse = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  return NextResponse.json({
    score: percentage,
    niveau: niveauLabel,
    totaal,
    maximaal,
    analyse,
    per_vraag: VRAGEN.map((v, i) => ({ vraag: v, score: antwoorden[i] })),
  })
}
