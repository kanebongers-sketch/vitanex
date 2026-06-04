import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/api-auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Simple in-memory rate limiter per user (resets on deploy/restart)
const rateMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 20
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

const VLAK_LABELS: Record<string, string> = {
  slaap:    'Slaap',
  stress:   'Stress',
  energie:  'Energie',
  focus:    'Focus',
  balans:   'Werk-privé balans',
  motivatie:'Motivatie',
}

function scoreLabel(s: number) {
  if (s >= 16) return 'Goed'
  if (s >= 12) return 'Matig'
  if (s >= 8)  return 'Aandacht nodig'
  return 'Laag'
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: 'Te veel analyses. Probeer het over een uur opnieuw.' },
      { status: 429 }
    )
  }

  try {
    const { vlak_scores, antwoorden } = await req.json()

    const scoresTekst = Object.entries(vlak_scores as Record<string, number>)
      .map(([v, s]) => `${VLAK_LABELS[v] ?? v}: ${s}/20 — ${scoreLabel(s)}`)
      .join('\n')

    const tekstAntwoorden = (antwoorden as { categorie: string; waarde_tekst: string }[])
      .filter(a => a.waarde_tekst?.trim())
      .map(a => {
        const domein = Object.keys(VLAK_LABELS).find(d => a.categorie.startsWith(d))
        const label = domein ? VLAK_LABELS[domein] : a.categorie
        return `[${label}]: "${a.waarde_tekst}"`
      })
      .join('\n')

    const gesorteerd = Object.entries(vlak_scores as Record<string, number>)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([v, s]) => `${VLAK_LABELS[v] ?? v} (score: ${s}/20)`)
      .join(', ')

    const prompt = `Je bent een empathische welzijnscoach bij het Vitanex-platform voor Nederlandse bedrijven. Analyseer de volgende wekelijkse check-in resultaten van een medewerker en schrijf een uitgebreide, persoonlijke analyse in het Nederlands.

SCORES (schaal 4–20, waarbij 4 = slecht en 20 = uitstekend):
${scoresTekst}

${tekstAntwoorden ? `OPEN ANTWOORDEN VAN DE MEDEWERKER:\n${tekstAntwoorden}` : ''}

LAAGST SCORENDE VLAKKEN (candidates voor doelen): ${gesorteerd}

Schrijf een grondige analyse als JSON. Wees empathisch, concreet en praktisch. Schrijf in de tweede persoon ("je", "jij"). Minimaal 3 items per array. Houd rekening met zowel de scores als de open antwoorden.

BELANGRIJK voor "aanbevolen_doelen":
- Kies ALTIJD precies 3 doelen: één per laagst scorend vlak (op basis van de scores + open antwoorden)
- Als iemand zegt dat ze slecht slapen of maar 6 uur slapen → stel een concreet slaapdoel voor (bijv. "Om 23:00 in bed liggen" of "8 uur slaap per nacht")
- De doelen moeten SPECIFIEK, MEETBAAR en DAGELIJKS uitvoerbaar zijn
- "meetType" is "dagelijks" tenzij het echt een wekelijks doel is

BELANGRIJK voor "wellbeing_categorieen": bevat ALTIJD exact 6 items met namen: "Slaap", "Stress", "Energie", "Focus", "Werk-privé balans", "Motivatie". Geef voor elke categorie een niveau (goed/matig/laag) op basis van de score (≥16=goed, ≥12=matig, <12=laag).

Geef UITSLUITEND geldige JSON terug, zonder markdown of extra tekst:
{
  "samenvatting": "3-4 zinnen die een eerlijk en empathisch totaalbeeld geven van deze week",
  "sterke_punten": [
    "concreet sterk punt gebaseerd op hoge scores of positieve antwoorden"
  ],
  "aandachtspunten": [
    {
      "titel": "kort en duidelijk titel voor dit aandachtspunt",
      "uitleg": "2-3 zinnen die uitleggen wat dit betekent en wat het effect kan zijn"
    }
  ],
  "actieplan": [
    {
      "actie": "één concrete, uitvoerbare actie",
      "waarom": "korte uitleg waarom dit helpt",
      "wanneer": "concreet moment of frequentie"
    }
  ],
  "burnout_risico": {
    "niveau": "laag of matig of hoog",
    "score": 3,
    "uitleg": "2-3 zinnen over het risiconiveau"
  },
  "bericht": "2-3 zinnen warm, persoonlijk slotbericht",
  "wellbeing_categorieen": [
    {
      "naam": "Slaap",
      "niveau": "goed of matig of laag",
      "samenvatting": "1-2 zinnen over slaap op basis van de score",
      "tips": ["tip 1 specifiek voor slaap", "tip 2", "tip 3"]
    },
    {
      "naam": "Stress",
      "niveau": "goed of matig of laag",
      "samenvatting": "1-2 zinnen over stressniveau",
      "tips": ["tip 1", "tip 2", "tip 3"]
    },
    {
      "naam": "Energie",
      "niveau": "goed of matig of laag",
      "samenvatting": "1-2 zinnen over energieniveau",
      "tips": ["tip 1", "tip 2", "tip 3"]
    },
    {
      "naam": "Focus",
      "niveau": "goed of matig of laag",
      "samenvatting": "1-2 zinnen over focusvermogen",
      "tips": ["tip 1", "tip 2", "tip 3"]
    },
    {
      "naam": "Werk-privé balans",
      "niveau": "goed of matig of laag",
      "samenvatting": "1-2 zinnen over balans",
      "tips": ["tip 1", "tip 2", "tip 3"]
    },
    {
      "naam": "Motivatie",
      "niveau": "goed of matig of laag",
      "samenvatting": "1-2 zinnen over motivatie",
      "tips": ["tip 1", "tip 2", "tip 3"]
    }
  ],
  "aanbevolen_doelen": [
    {
      "vlak": "slaap",
      "score": 9,
      "doel_titel": "8 uur slaap per nacht",
      "doel_beschrijving": "Leg je telefoon weg om 22:30 en ga voor 23:00 naar bed. Dit geeft je lichaam de nachtrust die het nodig heeft.",
      "target_waarde": 8,
      "eenheid": "uur",
      "meetType": "dagelijks"
    },
    {
      "vlak": "stress",
      "score": 7,
      "doel_titel": "10 minuten ademhaling per dag",
      "doel_beschrijving": "Neem elke ochtend 10 minuten voor een eenvoudige ademhalingsoefening om de dag rustiger te beginnen.",
      "target_waarde": 10,
      "eenheid": "minuten",
      "meetType": "dagelijks"
    },
    {
      "vlak": "energie",
      "score": 10,
      "doel_titel": "30 minuten bewegen per dag",
      "doel_beschrijving": "Een wandeling, fietsen of sport telt mee. Beweging verhoogt direct je energieniveau.",
      "target_waarde": 30,
      "eenheid": "minuten",
      "meetType": "dagelijks"
    }
  ]
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''
    const schoon = tekst.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    let analyse
    try {
      analyse = JSON.parse(schoon)
    } catch (parseErr) {
      console.error('[analyse] JSON parse mislukt. stop_reason:', response.stop_reason, 'tokens:', response.usage, 'tekst lengte:', schoon.length)
      console.error('[analyse] parse fout:', parseErr)
      return NextResponse.json({ error: 'Analyse JSON ongeldig — mogelijk afgekapt.' }, { status: 500 })
    }
    return NextResponse.json({ analyse })
  } catch (err) {
    console.error('[analyse]', err)
    return NextResponse.json({ error: 'Analyse kon niet worden gegenereerd.' }, { status: 500 })
  }
}
