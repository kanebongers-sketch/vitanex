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

function getMaandagVanWeek(datum: Date): string {
  const d = new Date(datum)
  const dag = d.getDay()
  const diff = dag === 0 ? -6 : 1 - dag
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

const KALENDER_SYSTEEM_PROMPT = `Je bent het AI Content Calendar systeem van Kane Bongers — personal trainer gespecialiseerd in krachtsport en physique.

Kane's merk: krachtsport + physique = sterker en beter eruitzien. Kane bouwt zichtbaar spiermassa en laat zijn eigen lichaam zien als social proof. Doelgroep: mannen en vrouwen 20–40 jaar die sterker willen worden, spiermassa willen opbouwen en een beter lichaam willen — geen Hyrox, geen performance sport.

PLATFORMSTRATEGIE (bewezen voor NL markt 2025-2026 — research-backed):

INSTAGRAM (prioriteit 1 — meeste groei-potentieel):
- Reels: 4x/week (ma, wo, vr, za) — 7-15 seconden presteert het beste (hogere herbekijkkans)
  → Reels geven 2.25x meer bereik dan foto-posts (bereik = nieuwe volgers)
  → DM-shares zijn het sterkste algoritme-signaal — maak content die mensen doorsturen
  → Hook MOET in eerste 3 seconden — 50% kijkers haakt eerder af
- Carousels: 2x/week (di, do) — HOOGSTE engagement (10% vs Reels 6%)
  → Gebruik voor educatieve content: lijstjes, stappenplannen, vergelijkingen
  → Minimaal 5 slides, eerste slide = hook, laatste slide = CTA
- Stories: dagelijks spontaan (niet in kalender) — polls, vragen, behind-the-scenes
  → Dagelijkse Stories = positie vooraan in Story-feed van volgers
- Beste tijden NL: 07:00-09:00 (ochtend) en 19:00-21:00 (avond)
- Hashtags: 5-8 stuks, mix niche (#fitnessondernemer, #performancecoach) + breed (#fitness, #ondernemen)

FACEBOOK (prioriteit 2 — voor 35+ doelgroep):
- Reels/Video: 3x/week (ma, wo, vr) — Facebook Reels presteren 5-10x beter dan gewone posts
  → Native video upload, NIET links naar Instagram
  → Iets langere uitleg dan Instagram, zelfde video mag gerecycled worden
- Beste tijden NL: 13:00-16:00
- Geen hashtags nodig op Facebook

LINKEDIN (prioriteit 3 — B2B en ondernemer-doelgroep):
- Posts: 5x/week (ma t/m vr) — carousels/PDF-posts zijn top format 2026 (20+ seconden kijktijd)
  → Persoonlijke verhalen met zakelijke les werken het beste
  → Eerste regel = hook (zichtbaar vóór "meer lezen") — moet stoppen met scrollen
  → Eindig met een vraag — trekt comments = meer bereik
- Beste tijden NL: 08:00-10:00, PIEK op dinsdag + woensdag + donderdag
- Hashtags: max 3-5 stuks
- Call-to-action in eerste COMMENT plaatsen, niet in de post zelf

CONTENT VERDELING PER WEEK:
- 50% krachtsport (techniek, progressieve overload, trainingsschema's, oefeningen)
- 30% physique (spiergroei, lichaamscompositie, voeding voor spiermassa/vetverbranding, Kane's eigen lichaam als voorbeeld)
- 20% leefstijl (herstel, slaap, voeding buiten training, consistentie)

NOOIT: Hyrox, cardio-only content, performance sport, ondernemen-focus.

TONE: Direct, geen fluff, actiegericht. Spreek als topcoach: kort, krachtig, eerlijk.`

const KALENDER_PROMPT = (weekStart: string, dagNamen: string[]) => `Genereer een complete content kalender voor de week van ${weekStart} (${dagNamen[0]} t/m ${dagNamen[6]}).

Retourneer ALLEEN geldig JSON (geen markdown, geen uitleg):
{
  "instagram": [
    {
      "dag": 1,
      "dag_naam": "maandag",
      "datum": "YYYY-MM-DD",
      "items": [
        {
          "type": "reel",
          "pijler": "fitness",
          "titel": "Korte pakkende titel max 8 woorden",
          "hook": "Openingszin eerste 3 seconden, max 12 woorden",
          "caption": "Instagram caption, 2-3 zinnen + 5-8 hashtags op nieuwe regel",
          "beste_tijd": "07:00"
        }
      ]
    }
  ],
  "facebook": [
    {
      "dag": 1,
      "dag_naam": "maandag",
      "datum": "YYYY-MM-DD",
      "items": [
        {
          "type": "post",
          "pijler": "fitness",
          "titel": "Titel van de post",
          "caption": "Facebook caption iets langer dan Instagram, 3-4 zinnen, geen hashtags",
          "beste_tijd": "13:00"
        }
      ]
    }
  ],
  "linkedin": [
    {
      "dag": 1,
      "dag_naam": "maandag",
      "datum": "YYYY-MM-DD",
      "items": [
        {
          "type": "post",
          "pijler": "fitness",
          "titel": "LinkedIn post titel",
          "hook": "Eerste regel — MOET stoppen met scrollen, max 15 woorden",
          "caption": "Volledige LinkedIn post, 150-300 woorden. Gebruik enters voor leesbaarheid. Eindig met 1 vraag aan de lezer. Max 3-5 hashtags.",
          "beste_tijd": "08:00"
        }
      ]
    }
  ],
  "groei_acties": [
    {
      "dag": 1,
      "dag_naam": "maandag",
      "acties": [
        "Reageer op 10 posts in jouw niche (fitness/ondernemen) — echte reacties, geen 'nice!'",
        "Volg 5 nieuwe accounts in je doelgroep (ondernemers 28-45 NL)",
        "Beantwoord ALLE comments op je eigen posts binnen 1 uur na plaatsing"
      ]
    }
  ]
}

REGELS:
- Instagram: Reel op ma/wo/vr/za, Carousel op di, Post op do
- Facebook: Post op ma/wo/vr
- LinkedIn: Post elke werkdag (ma t/m vr)
- Wisselende pijlers: afwisselen fitness, performance, ondernemen, leefstijl
- Datums correct invullen gebaseerd op ${weekStart}
- Groei_acties: 3 concrete acties per dag voor alle 7 dagen
- Caption LinkedIn: echte waarde, persoonlijk verhaal of data`

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const url = new URL(req.url)
  const weekParam = url.searchParams.get('week')
  const weekStart = weekParam ?? getMaandagVanWeek(new Date())

  const db = getServiceClient()
  const { data } = await db
    .from('content_kalender')
    .select('*')
    .eq('week_start', weekStart)
    .single()

  if (data) return NextResponse.json({ kalender: data, cached: true })
  return NextResponse.json({ kalender: null, cached: false, weekStart })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { forceer = false, week } = await req.json().catch(() => ({}))
  const weekStart = week ?? getMaandagVanWeek(new Date())

  const db = getServiceClient()

  if (!forceer) {
    const { data: bestaand } = await db
      .from('content_kalender')
      .select('*')
      .eq('week_start', weekStart)
      .single()
    if (bestaand) return NextResponse.json({ kalender: bestaand, cached: true })
  }

  const dagNamen: string[] = []
  const startDatum = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDatum)
    d.setDate(d.getDate() + i)
    dagNamen.push(d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' }))
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: KALENDER_SYSTEEM_PROMPT,
      messages: [{ role: 'user', content: KALENDER_PROMPT(weekStart, dagNamen) }],
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = tekst.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Geen JSON in AI response')

    const data = JSON.parse(jsonMatch[0])

    const { data: opgeslagen, error } = await db
      .from('content_kalender')
      .upsert({
        week_start: weekStart,
        instagram: data.instagram ?? [],
        facebook: data.facebook ?? [],
        linkedin: data.linkedin ?? [],
        groei_acties: data.groei_acties ?? [],
        gegenereerd_op: new Date().toISOString(),
      }, { onConflict: 'week_start' })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ kalender: opgeslagen, cached: false })
  } catch (err) {
    console.error('Kalender generatie mislukt:', err)
    return NextResponse.json({ error: 'Generatie mislukt. Probeer opnieuw.' }, { status: 500 })
  }
}
