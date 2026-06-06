
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

// Disable default body parser — we receive FormData with a file
export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const ANALYSE_PROMPT = `Je bent een professionele voedingsdeskundige. Analyseer deze foto van een maaltijd of voedingsmiddel.

Geef een nauwkeurige schatting van de voedingswaarden. Wees realistisch — overschat niet.

Geef je antwoord ALLEEN als valide JSON (geen extra tekst, geen markdown):

{
  "gerecht": "naam van het gerecht in het Nederlands",
  "beschrijving": "korte beschrijving van wat je ziet (1 zin)",
  "portie_gram": 350,
  "calorieen": 520,
  "macros": {
    "eiwitten_g": 28.5,
    "koolhydraten_g": 45.0,
    "vetten_g": 18.0,
    "vezels_g": 4.5
  },
  "ingredienten": ["pasta", "tomatensaus", "gehakt", "parmezaan"],
  "maaltijd_type": "lunch",
  "gezondheid_score": 7,
  "tips": "Voeg meer groenten toe voor meer vezels.",
  "betrouwbaarheid": "hoog"
}

Regels:
- maaltijd_type: kies uit "ontbijt", "lunch", "diner", "snack"
- gezondheid_score: 1 (ongezond) tot 10 (zeer gezond)
- betrouwbaarheid: "laag", "gemiddeld" of "hoog" — wees eerlijk
- Alle getallen als cijfers, niet als strings
- Als de foto onduidelijk is of geen voedsel bevat, stel betrouwbaarheid op "laag"`

export async function POST(request: Request) {
  // Auth check
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse FormData
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ongeldige FormData' }, { status: 400 })
  }

  const file = formData.get('foto') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Geen foto gevonden' }, { status: 400 })
  }

  // Convert to base64
  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')
  const mediaType = (file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp') || 'image/jpeg'

  // Send to Claude Vision
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: ANALYSE_PROMPT,
          },
        ],
      },
    ],
  })

  const responseText = (message.content[0] as { type: string; text: string }).text.trim()

  // Parse JSON response
  let analyse: Record<string, unknown>
  try {
    // Claude may sometimes wrap in ```json ... ```, strip that
    const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
    analyse = JSON.parse(cleaned)
  } catch {
    return NextResponse.json(
      { error: 'AI kon de analyse niet verwerken. Probeer een duidelijkere foto.' },
      { status: 422 }
    )
  }

  return NextResponse.json({ analyse })
}
