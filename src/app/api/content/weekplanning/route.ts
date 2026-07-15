import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser, isFounder } from '@/lib/auth/api-auth'
import { uploadBriefingPDF } from '@/lib/pdf/briefing-storage'

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
- Originality Score 2026: geen hergebruikte/watermark content
- Wat viraal gaat: techniekfouten corrigeren, mythe busten, quick wins, cijfers die schrikken`

// ── Agent 1: Trend Research (web search) ──────────────────────────────────
async function zoekTrends(weekStart: string): Promise<TrendData> {
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: `Zoek voor de week van ${weekStart} welke onderwerpen trending zijn op TikTok en Instagram Reels rondom: krachtraining, physique opbouwen, spiermassa, vetverbranding, eiwitinname en fitness voeding. Wat posten fitness creators die focussen op lichaamsbouw en sterker worden — GEEN wedstrijdsporten zoals HYROX, triathlon of hardlopen.`,
  }]

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    // @ts-ignore — web_search_20250305 is a valid Anthropic hosted tool not yet in SDK types
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
    system: 'Je bent een fitness content trend researcher voor de Nederlandse markt.',
    messages,
  })

  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    messages.push({ role: 'assistant', content: response.content })
    messages.push({
      role: 'user',
      content: toolUseBlocks.map(b => ({ type: 'tool_result' as const, tool_use_id: b.id, content: 'Search executed.' })),
    })
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      // @ts-ignore
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
      system: 'Je bent een fitness content trend researcher voor de Nederlandse markt.',
      messages,
    })
  }

  const tekst = response.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map(b => b.text).join('\n')

  const parseRes = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: 'Verwerk trendinformatie naar JSON.',
    messages: [{
      role: 'user',
      content: `Verwerk:\n\n${tekst}\n\nRetourneer ALLEEN:\n{"trending_topics":["topic 1","topic 2","topic 3"],"viral_formats":["format 1","format 2"],"te_vermijden":["verouderd"],"samenvatting":"2 zinnen"}`,
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

// ── Agent 2: Week Strategie — 3 Reels per dag, 21 items totaal ────────────
async function maakWeekStrategie(weekStart: string, dagNamen: DagInfo[], trends: TrendData, recenteTopics: string[]): Promise<WeekStrategieItem[]> {
  const vermijden = recenteTopics.length
    ? `\nVERMIJD deze topics (afgelopen 2 weken al gebruikt):\n${recenteTopics.slice(0, 20).map(t => `- ${t}`).join('\n')}`
    : ''

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: `Je bent een fitness content strateeg voor Kane Bongers — personal trainer in Eersel, Nederland.

KANE ZIJN NICHE EN STIJL:
- Focust op: physique opbouwen, krachtraining (compound lifts, progressive overload), fitness voeding (eiwitten, calorie deficit, bulken/cutten)
- Doelgroep: mensen die sterker en slanker willen worden — geen wedstrijdsporters
- Stijl: direct, eerlijk, praktisch. Geen hype, geen fluff. Kane spreekt als iemand die het zelf doet.
- GEEN HYROX, geen wedstrijdsport, geen hardloopspecifieke content
- WEL: hoe spieren groeien, wat je moet eten, welke oefeningen werken, veelgemaakte fouten in de gym

${ALGORITME_CONTEXT}

TRENDING DEZE WEEK:
${trends.samenvatting}
Topics: ${trends.trending_topics.join(', ')}

SCHEMA: Elke dag 3 Reels. Geen carousels. Zondag is rustdag (0 Reels).
Dat zijn 18 Reels over 6 dagen (ma t/m za).

REGELS PER DAG:
- Reel 1 (07:00): motivatie of mindset — waarom iets werkt, wat mensen verkeerd begrijpen
- Reel 2 (12:00): techniek of oefening — één beweging of concept uitgelegd
- Reel 3 (19:00): voeding of lifestyle — eiwitten, maaltijden, gewoontes

REGELS VOOR ALLE REELS:
- Elk topic DM-sharebaar (mensen sturen het door)
- 15-30 seconden
- Geen ongemakkelijke situaties
- Varieer locatie: gym voor oefeningen, thuis/keuken voor voeding
- 3 Reels per dag mogen NIET allemaal dezelfde invalshoek hebben${vermijden}`,
    messages: [{
      role: 'user',
      content: `Maak een weekstrategie voor week van ${weekStart} (${dagNamen[0].dag_naam} t/m ${dagNamen[5].dag_naam} — 6 dagen × 3 Reels = 18 items).

Retourneer ALLEEN geldig JSON array (18 items — zondag weglaten):
[
  {
    "dag": 1,
    "datum": "YYYY-MM-DD",
    "dag_naam": "maandag",
    "reel_nummer": 1,
    "topic": "specifiek onderwerp — één oefening of concept",
    "invalshoek": "corrigeer fout | quick win | bust mythe | demonstreer techniek",
    "kern_boodschap": "wat de kijker na het kijken weet of voelt",
    "dm_share_reden": "waarom stuurt iemand dit door?",
    "posttijd": "07:00",
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
async function maakReelContent(item: WeekStrategieItem, trends: TrendData): Promise<ReelContent> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1800,
    system: `Je schrijft fitness Reel content voor Kane Bongers (personal trainer, Eersel NL).

KANE ZIJN STIJL:
- Niche: physique, krachtraining, fitness voeding — GEEN wedstrijdsporten of HYROX
- Toon: direct, nuchter, praktisch — geen motivatiehype
- Spreekt vanuit eigen ervaring als personal trainer en iemand die zelf traint
- Locaties: gym (oefeningen), thuis/keuken (voeding), buiten (cardio/mindset)

${ALGORITME_CONTEXT}
TRENDING: ${trends.trending_topics.join(', ')}

- GEEN intro, GEEN "hoi". Direct in de hook.
- Script: spreektaal, 40-70 woorden, 15-30 seconden
- Hook: max 10 woorden, confronterend of verrassend
- Gebruik [DEMO] [PAUZE] [KIJK NAAR CAMERA] markers
- Geen ongemakkelijke situaties
- Camera instructies: exact in centimeters`,
    messages: [{
      role: 'user',
      content: `Reel ${item.reel_nummer}/3 voor ${item.dag_naam} ${item.datum}
Topic: ${item.topic}
Invalshoek: ${item.invalshoek}
Kern boodschap: ${item.kern_boodschap}
Posttijd: ${item.posttijd}
Locatie: ${item.locatie}

Retourneer ALLEEN geldig JSON:
{
  "titel": "max 5 woorden",
  "hook": "exacte openingszin — max 10 woorden",
  "script": "volledig script met markers — 40-70 woorden",
  "duur_doel": "15s | 20s | 25s | 30s",
  "camera_opstelling": "hoogte, hoek, afstand in cm",
  "kleding": "kleur + type",
  "licht": "concrete instructie",
  "opname_volgorde": ["shot 1", "shot 2", "shot 3"],
  "broll": ["b-roll 1", "b-roll 2", "b-roll 3"],
  "cta": "max 6 woorden",
  "caption": "2-3 zinnen",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "productie_tip": "1 concrete tip"
}`,
    }],
  })

  const tekst = res.content[0].type === 'text' ? res.content[0].text : '{}'
  try {
    const match = tekst.match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : {} as unknown as ReelContent
  } catch { return {} as unknown as ReelContent }
}

// ── Agent 4: Stories (op basis van de 3 reels van die dag) ───────────────
async function maakDagStories(dagNaam: string, reels: ReelContent[]): Promise<StoryFrame[]> {
  const reelSamenvatting = reels.map((r, i) => `Reel ${i + 1}: "${r.titel ?? ''}" — hook: "${r.hook ?? ''}"`).join('\n')

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: `Je maakt Instagram Stories voor Kane Bongers. 3 frames per dag. Simpel, direct.
- Frame 1: poll (zet je vooraan in story-tray)
- Frame 2: teaser van de beste Reel van vandaag
- Frame 3: simpele CTA`,
    messages: [{
      role: 'user',
      content: `Dag: ${dagNaam}\nReels vandaag:\n${reelSamenvatting}\n\nMaak 3 story-frames. ALLEEN geldig JSON array:\n[{"frame":1,"type":"poll | tip | cta","tekst":"max 8 woorden","interactie":"poll-vraag of leeg","optie_a":"A of leeg","optie_b":"B of leeg","achtergrond":"gym footage | selfie | tekst op kleur","doel":"wat bereikt dit frame"}]`,
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
  reel_nummer: number
  topic: string
  invalshoek: string
  kern_boodschap: string
  dm_share_reden: string
  posttijd: string
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

export interface ReelPlanning {
  strategie: WeekStrategieItem
  content: ReelContent
}

export interface DagPlanning {
  dag_nummer: number
  datum: string
  dag_naam: string
  reels: ReelPlanning[]
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
  const user = await getAuthenticatedUser(req)
  if (!user || !isFounder(user)) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

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
  if (!cronSecret) return false // fail closed
  return req.headers.get('x-cron-secret') === cronSecret
}

export async function POST(req: NextRequest) {
  const authorised = isCronRequest(req) || isFounder(await getAuthenticatedUser(req))
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

  // Bouw daginfo array (ma t/m zo)
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
    // Stap 1 + 2 parallel: trends + recente topics
    const [trends, recenteTopics] = await Promise.all([
      zoekTrends(weekStart),
      haalRecenteTopics(db),
    ])

    // Stap 3: 18 reel-topics (3 per dag × 6 dagen)
    const strategieItems = await maakWeekStrategie(weekStart, dagNamen, trends, recenteTopics)

    // Stap 4: Genereer alle 18 reels parallel, dan per dag de stories
    const alleReels = await Promise.all(
      strategieItems.map(item => maakReelContent(item, trends))
    )

    // Groepeer per dag (dag 1–6)
    const dagenMap = new Map<number, { strategie: WeekStrategieItem; content: ReelContent }[]>()
    strategieItems.forEach((item, idx) => {
      if (!dagenMap.has(item.dag)) dagenMap.set(item.dag, [])
      dagenMap.get(item.dag)!.push({ strategie: item, content: alleReels[idx] })
    })

    // Stap 5: Stories per dag parallel
    const dagenContent: DagPlanning[] = await Promise.all(
      Array.from(dagenMap.entries()).map(async ([dagNr, reels]) => {
        const dagInfo = dagNamen[dagNr - 1]
        const reelContents = reels.map(r => r.content)
        const stories = await maakDagStories(dagInfo.dag_naam, reelContents)
        return {
          dag_nummer: dagNr,
          datum: dagInfo.datum,
          dag_naam: dagInfo.dag_naam,
          reels,
          stories,
        }
      })
    )

    // Voeg zondag toe als rustdag
    const zondag = dagNamen[6]
    dagenContent.push({
      dag_nummer: 7,
      datum: zondag.datum,
      dag_naam: zondag.dag_naam,
      reels: [],
      stories: [],
    })

    // Sorteer op dag_nummer
    dagenContent.sort((a, b) => a.dag_nummer - b.dag_nummer)

    const weekplanning: WeekPlanning = {
      week_start: weekStart,
      trends,
      dagen: dagenContent,
      gegenereerd_op: new Date().toISOString(),
    }

    // Stap 6: Opslaan in Supabase
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

    // Stap 7: PDF
    try {
      const { generateWeekplanningPDF: genPDF } = await import('@/lib/pdf/pdf-weekplanning')
      const pdfBuffer = await genPDF(weekplanning)
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const pdfUrl = await uploadBriefingPDF(pdfBuffer, `week-${weekStart}-${ts}`)
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
