// POST /api/voeding/voice — spraak naar een maaltijd-schatting.
//
// Je zegt "twee eieren en een banaan" → we transcriberen de audio (Whisper via het
// gedeelde capture-brein) en laten Claude er losse producten met een geschatte
// portie + macro's van maken. Het is nadrukkelijk een SCHATTING: de client toont
// de items en laat je ze corrigeren vóór opslaan (geen verzonnen cijfers).

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { maakWhisperTranscriber } from '@/lib/lifeos/telegram/transcribe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MAX_AUDIO_BYTES = 25 * 1024 * 1024 // 25 MB — ruim voor een gesproken maaltijd

const VOICE_PROMPT = `Je bent een voedingsdeskundige. Hieronder staat een uitgesproken maaltijd in het Nederlands.
Splits het in losse voedingsmiddelen en geef per item een realistische SCHATTING van de portie en macro's.
Wees eerlijk: overschat niet, en zet "betrouwbaarheid" op "laag" als de hoeveelheid onduidelijk is.

Antwoord ALLEEN met valide JSON (geen markdown, geen extra tekst):
{
  "items": [
    {
      "naam": "Ei (gekookt)",
      "portie_omschrijving": "2 stuks",
      "portie_gram": 100,
      "calorieen": 155,
      "eiwitten_g": 13,
      "koolhydraten_g": 1.1,
      "vetten_g": 11,
      "betrouwbaarheid": "gemiddeld"
    }
  ]
}

Als er geen voedsel in zit, geef dan {"items": []}.

Uitgesproken tekst:
`

export async function POST(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.slice(7))
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Ongeldige FormData' }, { status: 400 })
  }
  const file = formData.get('audio')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Geen audio gevonden' }, { status: 400 })
  }
  if (file.size === 0 || file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Audio ontbreekt of is te groot' }, { status: 400 })
  }

  // 1. Transcriberen — een fout hier (geen key/dienst) mag geen 500 met stacktrace geven.
  let transcript: string
  try {
    const transcriber = maakWhisperTranscriber()
    transcript = await transcriber.transcribeer({
      data: await file.arrayBuffer(),
      bestandsnaam: file.name && file.name.length > 0 ? file.name : 'voice.webm',
      mimeType: file.type && file.type.length > 0 ? file.type : 'audio/webm',
    })
  } catch {
    return NextResponse.json({ error: 'Kon de audio niet transcriberen.' }, { status: 502 })
  }

  transcript = transcript.trim()
  if (transcript.length === 0) {
    return NextResponse.json({ transcript: '', items: [] })
  }

  // 2. Parsen naar losse producten met een geschatte portie + macro's.
  let items: unknown
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: `${VOICE_PROMPT}${transcript}` }],
    })
    const eerste = message.content[0]
    const tekst = eerste && eerste.type === 'text' ? eerste.text : ''
    const cleaned = tekst.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
    items = (JSON.parse(cleaned) as { items?: unknown }).items
  } catch {
    return NextResponse.json({ error: 'De AI kon je maaltijd niet verwerken. Probeer het opnieuw of typ het handmatig.' }, { status: 422 })
  }

  return NextResponse.json({ transcript, items: Array.isArray(items) ? items : [] })
}
