import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { scores, antwoorden } = await req.json()

    const scoresTekst = [
      `Energie & Lichaam: ${scores.e}/5`,
      `Mentaal welzijn: ${scores.m}/5`,
      `Werk & Motivatie: ${scores.w}/5`,
      `Team & Samenwerking: ${scores.s}/5`,
      `Groei & Ontwikkeling: ${scores.g}/5`,
      `Totaalscore: ${scores.t}/5`,
    ].join('\n')

    const tekstAntwoorden = (antwoorden as { categorie: string; waarde_tekst: string }[])
      .filter(a => a.waarde_tekst?.trim())
      .map(a => `[${a.categorie}]: "${a.waarde_tekst}"`)
      .join('\n')

    const prompt = `Je bent een empathische welzijnscoach bij het MentaForce-platform voor Nederlandse bedrijven. Analyseer de volgende wekelijkse check-in resultaten van een medewerker en schrijf een uitgebreide, persoonlijke analyse in het Nederlands.

SCORES (schaal 1–5, waarbij 1 = slecht en 5 = uitstekend):
${scoresTekst}

${tekstAntwoorden ? `OPEN ANTWOORDEN VAN DE MEDEWERKER:\n${tekstAntwoorden}` : ''}

Schrijf een grondige analyse als JSON. Wees empathisch, concreet en praktisch. Schrijf in de tweede persoon ("je", "jij"). Minimaal 3 items per array. Houd rekening met zowel de scores als de open antwoorden.

BELANGRIJK: De sectie "wellbeing_categorieen" moet ALTIJD exact 6 items bevatten met PRECIES deze namen (in deze volgorde): "Slaap", "Stress", "Energie", "Focus", "Werk-privé balans", "Motivatie". Geef voor elke categorie een niveau (goed/matig/laag) op basis van de scores, een korte samenvatting, en 3 concrete uitvoerbare tips om dit te verbeteren.

Geef UITSLUITEND geldige JSON terug, zonder markdown of extra tekst:
{
  "samenvatting": "3-4 zinnen die een eerlijk en empathisch totaalbeeld geven van deze week",
  "sterke_punten": [
    "concreet sterk punt gebaseerd op hoge scores of positieve antwoorden",
    "..."
  ],
  "aandachtspunten": [
    {
      "titel": "kort en duidelijk titel voor dit aandachtspunt",
      "uitleg": "2-3 zinnen die uitleggen wat dit betekent, waarom het aandacht verdient en wat het effect kan zijn"
    }
  ],
  "actieplan": [
    {
      "actie": "één concrete, uitvoerbare actie",
      "waarom": "korte uitleg waarom dit helpt voor deze persoon",
      "wanneer": "concreet moment of frequentie (bv. 'elke ochtend', 'deze week', 'dagelijks')"
    }
  ],
  "burnout_risico": {
    "niveau": "laag of matig of hoog",
    "score": 3,
    "uitleg": "2-3 zinnen die uitleggen hoe je tot dit risiconiveau komt en wat de belangrijkste indicatoren zijn"
  },
  "bericht": "2-3 zinnen warm, persoonlijk slotbericht dat motiveert en de medewerker erkent",
  "wellbeing_categorieen": [
    {
      "naam": "Slaap",
      "niveau": "goed of matig of laag",
      "samenvatting": "1-2 zinnen over hoe het gaat met slaap op basis van de check-in scores",
      "tips": [
        "concrete, uitvoerbare tip 1 specifiek voor slaap",
        "concrete, uitvoerbare tip 2 specifiek voor slaap",
        "concrete, uitvoerbare tip 3 specifiek voor slaap"
      ]
    },
    {
      "naam": "Stress",
      "niveau": "goed of matig of laag",
      "samenvatting": "1-2 zinnen over stressniveau op basis van de scores",
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
      "samenvatting": "1-2 zinnen over werk-privé balans",
      "tips": ["tip 1", "tip 2", "tip 3"]
    },
    {
      "naam": "Motivatie",
      "niveau": "goed of matig of laag",
      "samenvatting": "1-2 zinnen over motivatie en betrokkenheid",
      "tips": ["tip 1", "tip 2", "tip 3"]
    }
  ]
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''

    // Strip possible markdown code fences
    const schoon = tekst.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

    const analyse = JSON.parse(schoon)
    return NextResponse.json({ analyse })
  } catch (err) {
    console.error('[analyse]', err)
    return NextResponse.json({ error: 'Analyse kon niet worden gegenereerd.' }, { status: 500 })
  }
}
