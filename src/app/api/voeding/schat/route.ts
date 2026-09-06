// POST /api/voeding/schat — schat kcal + macro's uit een korte tekst-omschrijving.
//
// Voor het snel loggen op de home: typ "2 boterhammen kaas" en Vita schat de
// voedingswaarden, zodat de voedingskwaliteit-score gevoed wordt zonder dat je
// zelf cijfers hoeft op te zoeken. Eerlijk: het model geeft een betrouwbaarheid
// mee, en de gebruiker kan alles overschrijven.

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export interface VoedingSchatting {
  calorieen: number
  eiwitten_g: number
  koolhydraten_g: number
  vetten_g: number
  betrouwbaarheid: 'laag' | 'gemiddeld' | 'hoog'
}

const PROMPT = (omschrijving: string) => `Je bent een nuchtere voedingsdeskundige. Schat de voedingswaarden van deze maaltijd. Wees realistisch — niet overschatten. Bij een vage omschrijving: neem een gangbare portie en zet betrouwbaarheid op "laag".

Maaltijd: "${omschrijving}"

Antwoord ALLEEN met geldige JSON, geen extra tekst of markdown:
{"calorieen": 350, "eiwitten_g": 18, "koolhydraten_g": 30, "vetten_g": 15, "betrouwbaarheid": "gemiddeld"}

Regels: alle waarden als getal (geen tekst); betrouwbaarheid is "laag", "gemiddeld" of "hoog".`

function getal(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
}

/** Haalt het eerste JSON-object uit een modelantwoord (met of zonder ```-fences). */
function parseJson(tekst: string): Record<string, unknown> | null {
  const start = tekst.indexOf('{')
  const eind = tekst.lastIndexOf('}')
  if (start === -1 || eind <= start) return null
  try {
    const o = JSON.parse(tekst.slice(start, eind + 1))
    return typeof o === 'object' && o !== null ? o as Record<string, unknown> : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const sleutel = process.env.ANTHROPIC_API_KEY
  if (!sleutel) return NextResponse.json({ error: 'Schatten is nu niet beschikbaar.' }, { status: 503 })

  let body: { omschrijving?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Ongeldige JSON.' }, { status: 400 }) }

  const omschrijving = typeof body.omschrijving === 'string' ? body.omschrijving.trim().slice(0, 300) : ''
  if (omschrijving.length < 2) {
    return NextResponse.json({ error: 'Vul kort in wat je at.' }, { status: 400 })
  }

  try {
    const anthropic = new Anthropic({ apiKey: sleutel })
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: PROMPT(omschrijving) }],
    })
    const tekst = message.content.find((b) => b.type === 'text')?.text ?? ''
    const ruw = parseJson(tekst)
    const calorieen = getal(ruw?.calorieen)
    if (ruw === null || calorieen === null) {
      return NextResponse.json({ error: 'Kon dit niet inschatten. Vul de waarden zelf in.' }, { status: 422 })
    }

    const betrouwbaarheid = ruw.betrouwbaarheid === 'hoog' || ruw.betrouwbaarheid === 'laag' ? ruw.betrouwbaarheid : 'gemiddeld'
    const schatting: VoedingSchatting = {
      calorieen: Math.round(calorieen),
      eiwitten_g: Math.round(getal(ruw.eiwitten_g) ?? 0),
      koolhydraten_g: Math.round(getal(ruw.koolhydraten_g) ?? 0),
      vetten_g: Math.round(getal(ruw.vetten_g) ?? 0),
      betrouwbaarheid,
    }
    return NextResponse.json(schatting, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (err) {
    console.error('[voeding/schat]', err)
    return NextResponse.json({ error: 'Schatten is even niet gelukt. Probeer het opnieuw.' }, { status: 502 })
  }
}
