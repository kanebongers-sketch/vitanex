import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { uploadBriefingPDF } from '@/lib/briefing-storage'

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

// ── Algoritme-context (research-backed 2026) ──────────────────────────────
const ALGORITME_CONTEXT = `
ALGORITME-FEITEN 2026:
- DM-shares zijn het ZWAARSTE algoritme-signaal op Instagram Reels
- Reels 7–30 seconden = hoogste completion rate + meest nieuw bereik
- Eerste 3 seconden bepalen 50% kijktijd — hook moet instant raken
- Carousels = hoogste engagement (10%) — gebruik voor educatieve content (lijstjes, stappenplannen)
- Stories dagelijks = positie vooraan in Story-tray van volgers
- Poll/vraagsticker in Stories = sterk engagement-signaal voor algoritme
- Originality Score 2026: geen hergebruikte/watermark content`

// ── Agent 1: Trend Research (web search) ──────────────────────────────────
async function zoekTrends(weekStart: string): Promise<TrendData> {
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: `Zoek voor de week van ${weekStart} welke fitness onderwerpen trending zijn op TikTok en Instagram Reels. Focus op:
1. Trending gym oefeningen of technieken
2. Viral hooks/formats die nu scoren in fitness
3. Trending fitness thema's (bijv. 75 Hard, bepaalde training methodes)
4. Wat Nederlandse fitness creators nu posten dat viraal gaat

Geef concrete, actionable bevindingen. Geen algemene uitleg — specifieke trends met voorbeelden.`
  }]

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    // @ts-ignore — web_search_20250305 is a valid Anthropic hosted tool not yet in SDK types
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    system: `Je bent een fitness content trend researcher voor de Nederlandse markt. Zoek actuele trends op TikTok en Instagram fitness. Geef je bevindingen als gestructureerde lijst.`,
    messages,
  })

  // Agentic loop — verwerk tool_use indien model zoekt
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )
    messages.push({ role: 'assistant', content: response.content })
    messages.push({
      role: 'user',
      content: toolUseBlocks.map(b => ({
        type: 'tool_result' as const,
        tool_use_id: b.id,
        content: 'Search executed by Anthropic.',
      })),
    })
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      // @ts-ignore
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      system: `Je bent een fitness content trend researcher voor de Nederlandse markt.`,
      messages,
    })
  }

  const tekst = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n')

  // Parse trends uit de tekst via een tweede call
  const parseRes = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: 'Verwerk de gegeven trendinformatie naar een gestructureerde JSON.',
    messages: [{
      role: 'user',
      content: `Verwerk deze trendinformatie naar JSON:\n\n${tekst}\n\nRetourneer ALLEEN geldig JSON:\n{\n  "trending_topics": ["topic 1", "topic 2", "topic 3"],\n  "viral_formats": ["format 1", "format 2"],\n  "te_vermijden": ["iets wat niet meer werkt"],\n  "samenvatting": "2 zinnen over de belangrijkste trends"\n}`,
    }],
  })

  const parseTekst = parseRes.content[0].type === 'text' ? parseRes.content[0].text : '{}'
  try {
    const match = parseTekst.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : { trending_topics: [], viral_formats: [], te_vermijden: [], samenvatting: tekst.slice(0, 200) }
  } catch {
    return { trending_topics: [], viral_formats: [], te_vermijden: [], samenvatting: tekst.slice(0, 200) }
  }
}

// ── Agent 2: Week Strategie ────────────────────────────────────────────────
async function maakWeekStrategie(weekStart: string, dagNamen: DagInfo[], trends: TrendData, recenteTopics: string[]): Promise<WeekStrategieItem[]> {
  const vermijden = recenteTopics.length
    ? `\nVERMIJD deze topics (afgelopen 2 weken al gebruikt):\n${recenteTopics.slice(0, 15).map(t => `- ${t}`).join('\n')}`
    : ''

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system: `Je bent een fitness content strateeg voor Kane Bongers — personal trainer in Eersel, Nederland.

${ALGORITME_CONTEXT}

TRENDING DEZE WEEK:
${trends.samenvatting}
Trending topics: ${trends.trending_topics.join(', ')}
Viral formats: ${trends.viral_formats.join(', ')}

WEEK POSTING SCHEMA (bewezen voor NL markt 2026):
- Maandag: Reel — motivatie/lifestyle opener van de week
- Dinsdag: Carousel — educatief, 5-6 slides, hoog engagement
- Woensdag: Reel — training techniek, concrete demonstratie
- Donderdag: Carousel — voeding/herstel, stappenplan
- Vrijdag: Reel — quick win of mythe-busting
- Zaterdag: Reel — gym sessie / physique / intense training
- Zondag: Rustdag (optioneel 1 Story)

REGELS:
- Elk topic moet DM-sharebaar zijn (mensen sturen het door)
- 15-30 seconden voor Reels (max completion rate)
- Geen ongemakkelijke content — Kane moet zich op zijn gemak voelen
- Verwerk trending topics waar relevant, niet geforceerd
- Fitness only: geen motivatiequotes, geen fluff${vermijden}`,
    messages: [{
      role: 'user',
      content: `Maak een complete weekstrategie voor de week van ${weekStart} (${dagNamen[0].dag_naam} t/m ${dagNamen[6].dag_naam}).

Retourneer ALLEEN geldig JSON array (7 items, één per dag):
[
  {
    "dag": 1,
    "datum": "YYYY-MM-DD",
    "dag_naam": "maandag",
    "format": "reel | carousel | rustdag",
    "topic": "specifiek onderwerp — één oefening of concept",
    "invalshoek": "corrigeer fout | quick win | bust mythe | demonstreer | educatief stappenplan",
    "kern_boodschap": "wat de kijker na het kijken weet of voelt",
    "dm_share_reden": "waarom stuurt iemand dit door?",
    "trending_haak": "hoe sluit dit aan op de trends van deze week (of leeg als niet van toepassing)",
    "beste_posttijd": "07:00 | 09:00 | 19:00 | 20:00",
    "locatie": "Gym | Thuis | Buiten"
  }
]`,
    }],
  })

  const tekst = res.content[0].type === 'text' ? res.content[0].text : '[]'
  try {
    const match = tekst.match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : []
  } catch { return [] }
}

// ── Agent 3: Reel Content ─────────────────────────────────────────────────
async function maakReelContent(dag: WeekStrategieItem, trends: TrendData): Promise<ReelContent> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `Je schrijft en produceert short-form fitness video content voor Kane Bongers (personal trainer, Eersel NL).

${ALGORITME_CONTEXT}

TRENDING DEZE WEEK: ${trends.trending_topics.join(', ')}

REGELS:
- GEEN intro, GEEN "hoi". Direct in de hook.
- Script: spreektaal, 40-70 woorden, 15-30 seconden
- Hook: max 10 woorden, confronterend of verrassend
- Gebruik [DEMO] [PAUZE] [KIJK NAAR CAMERA] markers
- Geen ongemakkelijke situaties — Kane filmt zichzelf solo
- Camera instructies: exact, in centimeters/richting
- Kleding: specifiek kleur + type`,
    messages: [{
      role: 'user',
      content: `Maak een volledige Reel brief voor:
Dag: ${dag.dag_naam} ${dag.datum}
Topic: ${dag.topic}
Invalshoek: ${dag.invalshoek}
Kern boodschap: ${dag.kern_boodschap}
DM-share reden: ${dag.dm_share_reden}
Locatie: ${dag.locatie}

Retourneer ALLEEN geldig JSON:
{
  "titel": "max 5 woorden, pakkend",
  "hook": "exacte openingszin — max 10 woorden",
  "script": "volledig spreektaal script met markers — 40-70 woorden",
  "duur_doel": "15s | 20s | 25s | 30s",
  "camera_opstelling": "exacte beschrijving: hoogte, hoek, afstand in cm",
  "kleding": "specifiek: kleur, type",
  "licht": "concrete instructie: raam links/rechts, tijdstip",
  "opname_volgorde": ["shot 1 beschrijving", "shot 2 beschrijving"],
  "broll": ["b-roll 1", "b-roll 2", "b-roll 3", "b-roll 4", "b-roll 5"],
  "cta": "max 6 woorden, actief",
  "caption": "Instagram caption: 2-3 zinnen, pakt aan, geeft context",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7"],
  "productie_tip": "1 veelgemaakte fout bij dit type video + hoe te vermijden"
}`,
    }],
  })

  const tekst = res.content[0].type === 'text' ? res.content[0].text : '{}'
  try {
    const match = tekst.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : {} as unknown as ReelContent
  } catch { return {} as unknown as ReelContent }
}

// ── Agent 4: Carousel Content ─────────────────────────────────────────────
async function maakCarouselContent(dag: WeekStrategieItem): Promise<CarouselContent> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system: `Je maakt Instagram Carousel content voor Kane Bongers (personal trainer, Eersel NL).

CAROUSEL FEITEN 2026:
- Carousels hebben 10% engagement (hoogste van alle Instagram formats)
- Minimaal 5 slides, maximaal 10
- Slide 1 = hook (stopt het scrollen) — visueel + max 8 woorden
- Slides 2-5/6 = content (één punt per slide, simpel en scanbaar)
- Laatste slide = CTA
- Mensen swipen door als elke slide waarde geeft

REGELS:
- Eenvoudige tekst per slide — mensen scannen, niet lezen
- Elk slide heeft een duidelijke visual beschrijving
- Geen ongemakkelijke content
- Fitness educatief: stappenplannen, vergelijkingen, lijstjes`,
    messages: [{
      role: 'user',
      content: `Maak een volledige Carousel brief voor:
Dag: ${dag.dag_naam} ${dag.datum}
Topic: ${dag.topic}
Invalshoek: ${dag.invalshoek}
Kern boodschap: ${dag.kern_boodschap}

Retourneer ALLEEN geldig JSON:
{
  "titel": "carousel titel max 6 woorden",
  "concept": "wat is het overkoepelende thema van de carousel",
  "slides": [
    {
      "nummer": 1,
      "type": "hook",
      "hoofd_tekst": "max 8 woorden — stopt het scrollen",
      "sub_tekst": "optionele ondertekst max 12 woorden",
      "visual": "beschrijving van wat er visueel op dit slide staat",
      "achtergrond_kleur": "donker / licht / groen / wit"
    }
  ],
  "cta": "laatste slide CTA tekst",
  "caption": "Instagram caption 2-3 zinnen",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "design_tip": "1 concrete design instructie voor Canva/Adobe Express"
}`,
    }],
  })

  const tekst = res.content[0].type === 'text' ? res.content[0].text : '{}'
  try {
    const match = tekst.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : {} as unknown as CarouselContent
  } catch { return {} as unknown as CarouselContent }
}

// ── Agent 5: Stories ──────────────────────────────────────────────────────
async function maakDagStories(dag: WeekStrategieItem, content: ReelContent | CarouselContent): Promise<StoryFrame[]> {
  const contentSamenvatting = 'titel' in content ? `Reel: "${content.titel}"` : `Carousel: "${(content as CarouselContent).titel}"`

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: `Je maakt Instagram Stories voor Kane Bongers. Simpel, direct, niet geforceerd.

STORIES REGELS 2026:
- 3 frames per dag maximum
- Frame 1: poll of vraag (algoritme-signaal, zet je vooraan in story-tray)
- Frame 2: tip of teaser van de Reel/Carousel (waarde)
- Frame 3: CTA (simpel, niet salesy)
- Tekst op screen: max 8 woorden
- Geen ongemakkelijke content
- Poll-formules die werken: "Doe jij dit ook?" Ja/Nee`,
    messages: [{
      role: 'user',
      content: `Dag: ${dag.dag_naam}
Content: ${contentSamenvatting}
Topic: ${dag.topic}

Maak 3 story-frames. Retourneer ALLEEN geldig JSON array:
[
  {
    "frame": 1,
    "type": "poll | tip | cta",
    "tekst": "tekst op het scherm — max 8 woorden",
    "interactie": "poll-vraag OF vraagsticker tekst OF leeg",
    "optie_a": "poll optie A of leeg",
    "optie_b": "poll optie B of leeg",
    "achtergrond": "gym footage | selfie | tekst op kleur | b-roll",
    "doel": "wat bereikt dit frame"
  }
]`,
    }],
  })

  const tekst = res.content[0].type === 'text' ? res.content[0].text : '[]'
  try {
    const match = tekst.match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : []
  } catch { return [] }
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function haalRecenteTopics(db: ReturnType<typeof getServiceClient>): Promise<string[]> {
  const veertienDagenGeleden = new Date()
  veertienDagenGeleden.setDate(veertienDagenGeleden.getDate() - 14)
  const { data } = await db
    .from('content_briefings')
    .select('videos')
    .gte('datum', veertienDagenGeleden.toISOString().split('T')[0])
    .order('datum', { ascending: false })
  if (!data) return []
  return data.flatMap((r: { videos: Array<{ titel?: string }> }) =>
    (r.videos ?? []).map(v => v.titel ?? '').filter(Boolean)
  )
}

// ── Types ─────────────────────────────────────────────────────────────────

export interface TrendData {
  trending_topics: string[]
  viral_formats: string[]
  te_vermijden: string[]
  samenvatting: string
}

interface DagInfo {
  dag_naam: string
  datum: string
}

export interface WeekStrategieItem {
  dag: number
  datum: string
  dag_naam: string
  format: 'reel' | 'carousel' | 'rustdag'
  topic: string
  invalshoek: string
  kern_boodschap: string
  dm_share_reden: string
  trending_haak: string
  beste_posttijd: string
  locatie: string
}

export interface ReelContent {
  titel: string
  hook: string
  script: string
  duur_doel: string
  camera_opstelling: string
  kleding: string
  licht: string
  opname_volgorde: string[]
  broll: string[]
  cta: string
  caption: string
  hashtags: string[]
  productie_tip: string
}

export interface CarouselSlide {
  nummer: number
  type: string
  hoofd_tekst: string
  sub_tekst?: string
  visual: string
  achtergrond_kleur: string
}

export interface CarouselContent {
  titel: string
  concept: string
  slides: CarouselSlide[]
  cta: string
  caption: string
  hashtags: string[]
  design_tip: string
}

export interface StoryFrame {
  frame: number
  type: string
  tekst: string
  interactie: string
  optie_a: string
  optie_b: string
  achtergrond: string
  doel: string
}

export interface DagPlanning {
  strategie: WeekStrategieItem
  content: ReelContent | CarouselContent
  stories: StoryFrame[]
}

export interface WeekPlanning {
  week_start: string
  trends: TrendData
  dagen: DagPlanning[]
  gegenereerd_op: string
}

// ── Route Handlers ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const weekParam = url.searchParams.get('week')
  const weekStart = weekParam ?? getMaandagVanWeek(new Date())

  const db = getServiceClient()
  const { data } = await db
    .from('content_weekplanningen')
    .select('*')
    .eq('week_start', weekStart)
    .single()

  if (data) return NextResponse.json({ weekplanning: data, cached: true })
  return NextResponse.json({ weekplanning: null, cached: false, weekStart })
}

function isCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true
  return req.headers.get('x-cron-secret') === cronSecret
}

export async function POST(req: NextRequest) {
  const authorised = isCronRequest(req) || !!(await getAuthenticatedUser(req))
  if (!authorised) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { forceer = false, week } = await req.json().catch(() => ({}))
  const weekStart = week ?? getMaandagVanWeek(new Date())

  const db = getServiceClient()

  if (!forceer) {
    const { data: bestaand } = await db
      .from('content_weekplanningen')
      .select('*')
      .eq('week_start', weekStart)
      .single()
    if (bestaand) return NextResponse.json({ weekplanning: bestaand, cached: true })
  }

  // Bouw daginfo array
  const dagNamen: DagInfo[] = []
  const startDatum = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDatum)
    d.setDate(d.getDate() + i)
    dagNamen.push({
      dag_naam: d.toLocaleDateString('nl-NL', { weekday: 'long' }),
      datum: d.toISOString().split('T')[0],
    })
  }

  try {
    // Stap 1: Trends opzoeken (web search)
    const trends = await zoekTrends(weekStart)

    // Stap 2: Recente topics ophalen (variety guard)
    const recenteTopics = await haalRecenteTopics(db)

    // Stap 3: Week strategie (7 dagen planning)
    const strategie = await maakWeekStrategie(weekStart, dagNamen, trends, recenteTopics)

    // Stap 4: Content per dag — reel of carousel parallel
    const dagenContent = await Promise.all(
      strategie.map(async (dag) => {
        if (dag.format === 'rustdag') {
          return { strategie: dag, content: {} as ReelContent, stories: [] }
        }
        const content = dag.format === 'carousel'
          ? await maakCarouselContent(dag)
          : await maakReelContent(dag, trends)
        const stories = await maakDagStories(dag, content)
        return { strategie: dag, content, stories }
      })
    )

    const weekplanning: WeekPlanning = {
      week_start: weekStart,
      trends,
      dagen: dagenContent,
      gegenereerd_op: new Date().toISOString(),
    }

    // Stap 5: Opslaan in Supabase
    const { data: opgeslagen, error } = await db
      .from('content_weekplanningen')
      .upsert({
        week_start: weekStart,
        trends,
        dagen: dagenContent,
        gegenereerd_op: weekplanning.gegenereerd_op,
      }, { onConflict: 'week_start' })
      .select()
      .single()

    if (error) throw error

    // Stap 6: Genereer en upload PDF
    try {
      const { generateWeekplanningPDF: genPDF } = await import('@/lib/pdf-weekplanning')
      const pdfBuffer = await genPDF(weekplanning)
      const pdfUrl = await uploadBriefingPDF(pdfBuffer, `week-${weekStart}`)
      await db.from('content_weekplanningen').update({ pdf_url: pdfUrl }).eq('week_start', weekStart)
      return NextResponse.json({ weekplanning: opgeslagen, pdf_url: pdfUrl, cached: false })
    } catch (pdfErr) {
      const errMsg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr)
      console.error('[WEEKPLANNING] PDF mislukt:', errMsg)
      return NextResponse.json({ weekplanning: opgeslagen, pdf_url: null, pdf_error: errMsg, cached: false })
    }
  } catch (err) {
    console.error('[WEEKPLANNING] Generatie mislukt:', err)
    return NextResponse.json({ error: 'Generatie mislukt. Probeer opnieuw.' }, { status: 500 })
  }
}
