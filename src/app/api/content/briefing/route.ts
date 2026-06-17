import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/api-auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const CONTENT_SYSTEEM_PROMPT = `Je bent het AI Content Operating System van Kane Bongers — personal trainer en performance coach voor ambitieuze ondernemers.

Kane's missie: ondernemers en professionals laten zien dat een sterk lichaam en een sterk bedrijf hand in hand gaan.

Doelgroep: ondernemers en professionals (28–45 jaar), ambitieus, weinig tijd, hoge prestatiedruk.

FOCUS — verdeeld per dag:
- 2 videos: FITNESS (primair) — trainingen, beweging, lichaam als prestatiemachine
- 1 video: ONDERNEMEN (secundair) — performance mindset, systemen, zakelijke discipline

Fitness content ideeën (wissel dagelijks af):
- Korte workout die je overal kunt doen (geen gym nodig)
- Eén oefening uitgelegd met waarom het werkt
- Training tip voor drukke ondernemers
- Herstel & recovery: onderschat onderdeel van succes
- Mentale kant van fysieke training
- Voeding als brandstof voor focus
- Wat je lichaam je vertelt als je niet luistert

Ondernemen content ideeën:
- Systemen die tijd besparen
- Mindset van toppresteerders
- Hoe fysieke discipline zakelijk succes versnelt
- Energie management voor ondernemers

Tone of voice: Direct, geen fluff, actiegericht. Spreek als een topcoach: kort, krachtig, eerlijk.

Video formats:
- Auto talking head (45–90 sec): directe tips
- Gym/workout (30–60 sec): demonstraties, quick wins
- Buiten walking & talking (60–120 sec): energetisch
- Thuis/kantoor (60–90 sec): kennis delen

Hook formules (wissel af):
- "Stop met [slechte gewoonte]. Doe dit in plaats daarvan."
- "[Getal] minuten is genoeg om [resultaat] te bereiken."
- "De reden waarom [probleem] — en hoe je het oplost."
- "Als je dit doet in de gym, verlies je tijd."
- "Meeste coaches vertellen dit niet."

Genereer content die in 15 minuten gefilmd kan worden. Wees specifiek en actionable.`

const BRIEFING_PROMPT = (filmDatum: string, filmDag: string, postDatum: string, postDag: string) => `Genereer de content briefing voor Kane Bongers.

Filmdatum: ${filmDag} ${filmDatum}
Publicatiedatum (post morgen): ${postDag} ${postDatum}

Maak EXACT 3 video-opdrachten:
- Video 1: FITNESS (prioriteit hoog) — gym of thuis workout
- Video 2: FITNESS (prioriteit hoog) — tip, uitleg of mindset rondom beweging
- Video 3: ONDERNEMEN (prioriteit medium) — zakelijke performance, systemen of ondernemers mindset

Locaties variëren: gebruik auto, gym, buiten, thuis — niet allemaal hetzelfde.

Retourneer ALLEEN geldig JSON (geen markdown, geen uitleg):
{
  "groet": "korte motiverende openingszin voor Kane, max 10 woorden",
  "thema_van_de_dag": "overkoepelend thema dat de 3 videos verbindt",
  "videos": [
    {
      "nummer": 1,
      "titel": "Video titel (max 8 woorden, pakkend)",
      "pijler": "fitness|ondernemen",
      "locatie": "Auto | Gym | Buiten | Thuis | Kantoor",
      "duur_sec": 60,
      "platform": ["Instagram Reels", "TikTok"],
      "prioriteit": "hoog|medium|laag",
      "hook": "Openingszin eerste 3 seconden — max 15 woorden, stopt scrollen",
      "script": "Volledig script spreektaal. [PAUZE] en [KIJK NAAR CAMERA] markers. Max 150 woorden voor 60s video. Actieve taal, geen jargon.",
      "broll": ["B-roll suggestie 1", "B-roll suggestie 2", "B-roll suggestie 3"],
      "cta": "Duidelijke call-to-action",
      "caption_idee": "Instagram/TikTok caption max 3 zinnen + 5 hashtags"
    }
  ],
  "totale_opnametijd_sec": 540,
  "tip_van_de_dag": "Concrete tip voor vandaag, max 20 woorden"
}`

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const db = getServiceClient()
  const vandaag = new Date().toISOString().split('T')[0]

  const { data } = await db
    .from('content_briefings')
    .select('*')
    .eq('datum', vandaag)
    .single()

  if (data) return NextResponse.json({ briefing: data, cached: true })
  return NextResponse.json({ briefing: null, cached: false })
}

function isCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  const secret = req.headers.get('x-cron-secret')
  return secret === cronSecret
}

export async function POST(req: NextRequest) {
  const authorised = isCronRequest(req) || !!(await getAuthenticatedUser(req))
  if (!authorised) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { forceer = false } = await req.json().catch(() => ({}))

  const db = getServiceClient()
  const vandaag = new Date().toISOString().split('T')[0]

  if (!forceer) {
    const { data: bestaand } = await db
      .from('content_briefings')
      .select('*')
      .eq('datum', vandaag)
      .single()
    if (bestaand) return NextResponse.json({ briefing: bestaand, cached: true })
  }

  const nu = new Date()
  const dagNamen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const filmDag = dagNamen[nu.getDay()]
  const filmDatumStr = nu.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  const morgen = new Date(nu)
  morgen.setDate(morgen.getDate() + 1)
  const postDag = dagNamen[morgen.getDay()]
  const postDatumStr = morgen.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  const postDatum = morgen.toISOString().split('T')[0]

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: CONTENT_SYSTEEM_PROMPT,
      messages: [{ role: 'user', content: BRIEFING_PROMPT(filmDatumStr, filmDag, postDatumStr, postDag) }],
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = tekst.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Geen JSON in AI response')

    const briefingData = JSON.parse(jsonMatch[0])
    const totaalSec = briefingData.videos?.reduce((s: number, v: { duur_sec?: number }) => s + (v.duur_sec ?? 0), 0) ?? 0

    const meta = {
      groet: briefingData.groet,
      thema: briefingData.thema_van_de_dag,
      tip: briefingData.tip_van_de_dag,
    }

    const { data: opgeslagen, error } = await db
      .from('content_briefings')
      .upsert({
        datum: vandaag,
        videos: briefingData.videos ?? [],
        totale_opnametijd_sec: totaalSec,
        meta,
        status: 'actief',
        gegenereerd_op: new Date().toISOString(),
        post_datum: postDatum,
      }, { onConflict: 'datum' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ briefing: opgeslagen, cached: false })
  } catch (err) {
    console.error('Briefing generatie mislukt:', err)
    return NextResponse.json({ error: 'Generatie mislukt. Probeer opnieuw.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { briefing_id, video_nummer, status } = await req.json()
  const db = getServiceClient()

  const { data: briefing } = await db
    .from('content_briefings')
    .select('videos')
    .eq('id', briefing_id)
    .single()

  if (!briefing) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  const videos = briefing.videos as Array<Record<string, unknown>>
  const idx = videos.findIndex((v) => v.nummer === video_nummer)
  if (idx >= 0) videos[idx].status = status

  await db.from('content_briefings').update({ videos }).eq('id', briefing_id)
  return NextResponse.json({ ok: true })
}
