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

const CONTENT_SYSTEEM_PROMPT = `Je bent het AI Content Operating System van Kane Bongers — personal trainer, performance coach en leefstijlexpert voor ambitieuze ondernemers en professionals.

Kane's missie: mensen helpen om optimaal te presteren door fitness, discipline en leefstijl te combineren met zakelijk succes.

Doelgroep: ondernemers en professionals (28–45 jaar), ambitieus, weinig tijd, hoge prestatiedruk.

Content pijlers:
1. Fitness — korte, effectieve trainingen, beweging als tool voor succes
2. Ondernemen — performance, systemen, mindset van de beste ondernemers
3. Discipline — gewoontevorming, consistentie, zelfbeheersing
4. Leefstijl — slaap, voeding, herstel, duurzaam gezond leven
5. Stressmanagement — stressregulatie, cortisol, burn-out preventie
6. Performance — energiemanagement, focus, piekprestaties
7. Persoonlijke Groei — identiteit, mentaliteit, continue verbetering

Tone of voice: Direct, eerlijk, data-gedreven, geen fluff. Zoals een topcoach spreekt — kort, krachtig, actiegericht.

Video formats:
- Talking head in auto (45–90 sec): directe tips, korte inzichten
- Walking & talking buiten (60–120 sec): energetisch, lifestylegevoel
- Gym/workout (30–60 sec): demonstraties, quick wins
- Whiteboard/slides (90–180 sec): frameworks, systemen
- Vlog/BTS (60–120 sec): dag in het leven, authentiek

Hook formules (gebruik wisselend):
- Vraag: "Waarom [probleem]?"
- Stat: "[Getal]% van ondernemers heeft [probleem]"
- Claim: "De meeste coaches vertellen je dit niet"
- Actie: "Stop met [slechte gewoonte]. Doe dit in plaats daarvan"
- Confessie: "Ik was ook [probleem] totdat ik dit ontdekte"

Genereer altijd content die in 15 minuten opgenomen kan worden. Wees concreet en actionable.`

const BRIEFING_PROMPT = (datum: string, dag: string) => `Genereer de dagelijkse content briefing voor Kane Bongers op ${dag} ${datum}.

Maak exact 3 video-opdrachten die samen maximaal 15 minuten opnametijd kosten.

Kies een slimme mix van pijlers. Varieer locaties (auto, gym, buiten, thuis, kantoor).

Retourneer ALLEEN geldig JSON in dit formaat (geen markdown, geen uitleg):
{
  "groet": "korte motiverende openingszin voor Kane, max 10 woorden",
  "thema_van_de_dag": "overkoepelend thema dat de 3 videos verbindt",
  "videos": [
    {
      "nummer": 1,
      "titel": "Video titel (max 8 woorden, pakkend)",
      "pijler": "fitness|ondernemen|discipline|leefstijl|stressmanagement|performance|persoonlijke-groei",
      "locatie": "Auto | Gym | Buiten | Thuis | Kantoor",
      "duur_sec": 60,
      "platform": ["Instagram Reels", "TikTok"],
      "prioriteit": "hoog|medium|laag",
      "hook": "De openingszin (eerste 3 seconden, max 15 woorden, moet stoppen met scrollen)",
      "script": "Volledig script in spreektaal. Inclusief [PAUZE] markers, [KIJK NAAR CAMERA] aanwijzingen. Max 150 woorden voor 60 sec video. Gebruik actieve taal, geen jargon.",
      "broll": ["B-roll suggestie 1", "B-roll suggestie 2", "B-roll suggestie 3"],
      "cta": "Duidelijke call-to-action op het einde",
      "caption_idee": "Instagram/TikTok caption in max 3 zinnen + 5 relevante hashtags"
    }
  ],
  "totale_opnametijd_sec": 540,
  "tip_van_de_dag": "Concrete productiviteitstip voor vandaag, max 20 woorden"
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

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

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
  const dag = dagNamen[nu.getDay()]
  const datumStr = nu.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: CONTENT_SYSTEEM_PROMPT,
      messages: [{ role: 'user', content: BRIEFING_PROMPT(datumStr, dag) }],
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = tekst.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Geen JSON in AI response')

    const briefingData = JSON.parse(jsonMatch[0])
    const totaalSec = briefingData.videos?.reduce((s: number, v: { duur_sec?: number }) => s + (v.duur_sec ?? 0), 0) ?? 0

    const { data: opgeslagen, error } = await db
      .from('content_briefings')
      .upsert({
        datum: vandaag,
        videos: briefingData.videos ?? [],
        totale_opnametijd_sec: totaalSec,
        status: 'actief',
        gegenereerd_op: new Date().toISOString(),
      }, { onConflict: 'datum' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      briefing: { ...opgeslagen, meta: { groet: briefingData.groet, thema: briefingData.thema_van_de_dag, tip: briefingData.tip_van_de_dag } },
      cached: false,
    })
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
