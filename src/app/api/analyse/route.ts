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

    const prompt = `Je bent een empathische welzijnscoach bij het Vitanex-platform voor Belgische bedrijven. Analyseer de volgende wekelijkse check-in resultaten van een medewerker en schrijf een uitgebreide, persoonlijke analyse in het Nederlands.

SCORES (schaal 1–5, waarbij 1 = slecht en 5 = uitstekend):
${scoresTekst}

${tekstAntwoorden ? `OPEN ANTWOORDEN VAN DE MEDEWERKER:\n${tekstAntwoorden}` : ''}

Schrijf een grondige analyse als JSON. Wees empathisch, concreet en praktisch. Schrijf in de tweede persoon ("je", "jij"). Minimaal 3 items per array. Houd rekening met zowel de scores als de open antwoorden.

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
  "bericht": "2-3 zinnen warm, persoonlijk slotbericht dat motiveert en de medewerker erkent"
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
