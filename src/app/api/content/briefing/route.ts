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

// ── Haal recente topics op (variety guard) ─────────────────────────────────

async function haalRecenteTopics(db: ReturnType<typeof getServiceClient>): Promise<string[]> {
  const zeven = new Date()
  zeven.setDate(zeven.getDate() - 7)
  const { data } = await db
    .from('content_briefings')
    .select('videos')
    .gte('datum', zeven.toISOString().split('T')[0])
    .order('datum', { ascending: false })
    .limit(7)

  if (!data) return []
  return data.flatMap((r: { videos: Array<{ titel?: string; hook?: string }> }) =>
    (r.videos ?? []).map((v) => v.titel ?? v.hook ?? '').filter(Boolean)
  )
}

// ── Agent 0: Trend Research (web search) ──────────────────────────────────
// Zoekt actuele fitness trends — resultaat wordt meegestuurd naar Agent 1.

async function zoekDagTrends(): Promise<string> {
  const vandaag = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: `Wat zijn vandaag (${vandaag}) trending fitness onderwerpen op TikTok en Instagram Reels? Geef maximaal 5 concrete trending topics of formats die nu scoren in de fitness niche. Noem ook 1 format of hook-stijl die nu viraal gaat.`,
  }]

  let response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    // @ts-ignore — web_search_20250305 is a valid Anthropic hosted tool not yet in SDK types
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
    system: 'Je bent een fitness content trend researcher. Zoek actuele trends voor de Nederlandse fitness creator markt. Geef een korte, concrete samenvatting.',
    messages,
  })

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
        content: 'Search executed.',
      })),
    })
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      // @ts-ignore
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      system: 'Je bent een fitness content trend researcher.',
      messages,
    })
  }

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n')
    .slice(0, 600)
}

// ── Algoritme-inzichten (research-backed 2026) ─────────────────────────────
// Bron: Instagram/TikTok algoritme-onderzoek juni 2026
const ALGORITME_CONTEXT = `
ALGORITME-FEITEN 2026 (gebruik dit bij elke keuze):
- DM-shares zijn het ZWAARSTE signaal op Instagram Reels — maak content die mensen doorsturen
- 7–30 seconden video heeft hoogste completion rate en meeste nieuw bereik
- Eerste 3 seconden bepalen 50% van de kijktijd — hook moet instant raken
- Originality Score: geen hergebruikte content, geen TikTok-watermark op Instagram
- Wat gaat viral op fitness TikTok/Reels in 2026:
  * Techniekfouten corrigeren (mensen herkennen zichzelf, sturen het door)
  * "Dit doe je waarschijnlijk fout bij [oefening]" — confronterend, deelbaar
  * Minimal equipment / thuis workout content (breed bereik)
  * Resultaat in één shot (voor/na beweging, form fix in real time)
  * Cijfers die schrikken: "Je verliest 40% spierkracht als je dit doet"
- VERMIJD: vage motivatiequotes, lange talking heads, content waarbij je je ongemakkelijk voelt`

// ── Agent 1: Strategie ─────────────────────────────────────────────────────
// Kiest 3 fitness topics — puur fitness, maximaal visueel, niet herhaald.

async function kiesTopics(filmDag: string, filmDatum: string, recenteTopics: string[], dagTrends: string): Promise<string> {
  const vermijden = recenteTopics.length
    ? `\n\nVERMIJD deze topics want ze zijn de afgelopen week al gedaan:\n${recenteTopics.slice(0, 12).map(t => `- ${t}`).join('\n')}`
    : ''

  const trendBlok = dagTrends.trim()
    ? `\n\nACTUELE TRENDS VANDAAG (web search resultaat — gebruik dit om topics aan te scherpen):\n${dagTrends}`
    : ''

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    system: `Je bent een fitness content strateeg die weet wat viraal gaat op Instagram Reels en TikTok in 2026.

Kane Bongers is personal trainer in Eersel, Nederland. Hij filmt zichzelf — geen crew, geen studio. Zijn publiek: mannen en vrouwen 20–40 jaar die willen afvallen, spiermassa opbouwen of meer energie willen. Ze scrollen 's ochtends of 's avonds.

${ALGORITME_CONTEXT}

Kies topics die aan ALLE vijf criteria voldoen:
1. Deelbaar — iemand stuurt dit door naar een vriend ("dit ben jij")
2. Visueel — je ziet het, je demonstreert het in max 30 seconden
3. Specifiek — niet "goede techniek" maar "zo til je bij een Romanian Deadlift"
4. Herkenbaar fout/win — lost een veelgemaakte fout op óf geeft direct resultaat
5. Niet ongemakkelijk — Kane moet zich op zijn gemak voelen bij het filmen

Denk aan:
- Techniekfouten bij populaire oefeningen (squat, bench, deadlift, shoulder press)
- Quick wins die mensen direct kunnen toepassen (30 seconden om te laten zien)
- Voeding die direct invloed heeft op prestatie
- Herstel tips die mensen niet kennen
- Progressie methoden (hoe je sterker wordt)

Varieer locatie: niet alle 3 op dezelfde plek.
Varieer format: mix demonstratie met talking head.${trendBlok}${vermijden}

Retourneer ALLEEN een JSON array:
[
  {
    "nummer": 1,
    "topic": "heel specifieke beschrijving — één oefening of concept",
    "invalshoek": "corrigeer fout | geef quick win | bust mythe | demonstreer techniek | uitleg mechanic",
    "locatie": "Gym | Buiten | Thuis",
    "format": "demonstratie | talking head | workout | uitleg",
    "doelgroep_pijn": "welk probleem of frustratie raakt dit bij de kijker",
    "dm_share_reden": "waarom stuurt iemand dit door aan een vriend?"
  }
]`,
    messages: [{
      role: 'user',
      content: `Filmdag: ${filmDag} ${filmDatum}. Kies 3 sterke fitness topics. Maak elk topic zo specifiek dat Kane precies weet welke oefening of welk concept hij gaat filmen. Prioriteit: DM-shareability.`
    }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : '[]'
}

// ── Agent 2: Scripts ───────────────────────────────────────────────────────
// Schrijft een hook die scrollen stopt + strak script in echte spreektaal.

async function schrijfScripts(topicsJson: string, postDag: string, postDatum: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3500,
    system: `Je bent een short-form video scriptwriter die fitness content schrijft voor Instagram Reels en TikTok. Je schrijft voor een Nederlandse personal trainer die zichzelf filmt.

${ALGORITME_CONTEXT}

Regels die je nooit breekt:
- GEEN intro. Geen "hoi", geen "ik ben Kane". Direct in de hook.
- GEEN vage algemeenheden. Elk woord moet concreet zijn.
- GEEN jargon. Gewone taal, zoals je het in de gym zou zeggen.
- Hook is de EERSTE zin — moet shock, nieuwsgierigheid of directe waarde bevatten.
- Script is spreektaal — korte zinnen, komma's als pauze, actieve werkwoorden.
- Doellengte: 15–30 seconden (hogere completion rate = meer bereik).
- Eindig met een concrete micro-CTA, geen smeekbede ("volg me voor meer" is verboden).
- Schrijf content waarbij Kane zich op zijn gemak voelt — geen ongemakkelijke poses of situaties.

Hook formules die DM-shares genereren (mensen sturen dit door):
- "Je [oefening] klopt niet. Hier is waarom." → mensen sturen naar gym-buddy
- "Dit doe jij ook fout bij [oefening]" → confronterend maar herkenbaar
- "Meeste mensen verliezen [resultaat] omdat ze dit missen"
- "Probeer dit 30 seconden. Je voelt het verschil direct."
- "[Getal] seconden aanpassing bij [oefening] = direct resultaat"

Gebruik [PAUZE] voor een adempauze, [DEMO] voor een demonstratiemoment, [KIJK NAAR CAMERA] voor directe blik.`,
    messages: [{
      role: 'user',
      content: `Topics: ${topicsJson}

Schrijf voor elk topic een volledig script. Publicatiedatum: ${postDag} ${postDatum}.

Retourneer ALLEEN geldig JSON array:
[
  {
    "nummer": 1,
    "titel": "pakkende videotitel max 5 woorden, lowercase behalve eerste woord",
    "hook": "exacte eerste zin die het scrollen stopt — max 10 woorden, eindigt NIET met punt",
    "script": "volledig script spreektaal met [PAUZE] [DEMO] [KIJK NAAR CAMERA] markers — 40-70 woorden voor 15-30s video",
    "duur_doel": "15s | 20s | 25s | 30s",
    "cta": "concrete call to action max 6 woorden, actief",
    "caption_idee": "2 zinnen caption — eerste zin pakt aan, tweede geeft context — plus 5 niche fitness hashtags",
    "dm_share_trigger": "waarom stuurt iemand dit door? max 1 zin"
  }
]`
    }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : '[]'
}

// ── Agent 5: Stories ───────────────────────────────────────────────────────
// Genereert 3 simpele Story-frames die aansluiten op de Reels van die dag.

async function maakStories(topicsJson: string, scriptsJson: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: `Je maakt Instagram Stories voor een Nederlandse personal trainer. Simpel, direct, geen gedoe.

REGELS:
- Maximaal 3 story-frames per dag
- Elke story heeft een duidelijk doel: engagement, tip, of CTA
- Tekst op screen: max 8 woorden per frame — people scan, not read
- Geen ongemakkelijke of nep-poses
- Frame 1: altijd een poll of vraag (boogt engagement, zet Kane vooraan in de Story-tray)
- Frame 2: één concrete tip van vandaag (direct toepasbaar)
- Frame 3: simpele CTA aansluitend op de Reel van die dag

POLL-formules die werken:
- "Doe jij dit ook?" → Ja / Nee
- "Welke doe jij?" → Optie A / Optie B
- "Raad eens" → A / B

STORY IS GEEN REEL: geen lang script, geen voice-over. Puur visueel + tekst overlay.`,
    messages: [{
      role: 'user',
      content: `Topics van vandaag: ${topicsJson}
Scripts van vandaag: ${scriptsJson}

Maak 3 story-frames die aansluiten op deze content.

Retourneer ALLEEN geldig JSON array:
[
  {
    "frame": 1,
    "type": "poll | tip | cta | vraag",
    "achtergrond": "gym footage | selfie | tekst op kleur | b-roll",
    "tekst": "tekst die op het scherm staat — max 8 woorden",
    "interactie": "poll-vraag met 2 opties, OF vraagsticker tekst, OF geen",
    "optie_a": "poll optie A of leeg",
    "optie_b": "poll optie B of leeg",
    "doel": "wat dit frame bereikt"
  }
]`
    }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : '[]'
}

// ── Agent 3: Productie ─────────────────────────────────────────────────────
// Exacte filmopnames — alsof een productieleider op set staat.

async function maakShotList(topicsJson: string, scriptsJson: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system: `Je bent een productieleider voor solo fitness content creators. Kane filmt zichzelf — hij heeft een telefoon, een statief, en de locatie die bij het topic past. Geen crew.

Jouw taak: geef exact aan wat Kane moet doen. Geen "zorg voor goed licht" — maar "zet je telefoon op kniehoogte, 1.5 meter voor je, camera recht op de barbell gericht". Geen "draag sportkleding" — maar "zwart t-shirt en donkere trainingsbroek, geen logo's".

Denk als een filmmaker die de video al in zijn hoofd ziet:
- Welke angle maakt de oefening/boodschap het duidelijkst?
- Wat ziet de kijker precies — en wat niet?
- Welke shots zijn nodig als insert/b-roll?
- Wat gaat er mis als hij dit niet weet?`,
    messages: [{
      role: 'user',
      content: `Topics: ${topicsJson}
Scripts: ${scriptsJson}

Geef voor elke video exacte productie-instructies. Retourneer ALLEEN geldig JSON array:
[
  {
    "nummer": 1,
    "duur_sec": 60,
    "platform": ["Instagram Reels", "TikTok"],
    "camera_opstelling": "exacte hoogte, hoek, afstand in centimeters/meters — stel je voor je geeft instructie aan iemand die er nog nooit een video mee heeft gemaakt",
    "kleding": "specifiek: kleur, type kledingstuk, waarom deze keuze",
    "opname_volgorde": [
      "shot 1: wat doe je precies, hoeveel herhalingen/seconden",
      "shot 2: volgende shot beschrijving"
    ],
    "broll": [
      "b-roll 1: welke shot, hoek, duratie",
      "b-roll 2: volgende b-roll"
    ],
    "licht": "specifieke lichtinstructie — raamkant, tijdstip, schaduwen",
    "tip": "1 productiefout die beginners maken bij dit type video — en hoe het beter kan"
  }
]`
    }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : '[]'
}

// ── Agent 4: Critic ────────────────────────────────────────────────────────
// Beoordeelt de hooks en scripts — maakt ze scherper of geeft betere versie.

async function verbeterHooks(scriptsJson: string, topicsJson: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `Je bent een brutaal eerlijke short-form video editor. Je ziet in 2 seconden of een hook werkt of niet.

Je criterium voor een goede hook:
- Maakt de kijker nieuwsgierig OF raakt een pijn/frustratie
- Is specifiek genoeg om geloofwaardig te zijn
- Is NIET generic ("Wil jij afvallen?" — nooit)
- Heeft urgentie of verrassing
- Max 10 woorden

Je criterium voor een goed script:
- Elke zin heeft een reden om er te zijn
- Geen herhaling van de hook in andere woorden
- Demo-momenten zijn concreet (niet "doe de oefening" maar "zak door je knieën tot je dijen parallel zijn")
- CTA is een actie, geen wens

Beoordeel elk script. Als iets beter kan: herschrijf dat stuk. Als het al goed is: laat het staan.`,
    messages: [{
      role: 'user',
      content: `Topics: ${topicsJson}
Scripts: ${scriptsJson}

Verbeter de hooks en scripts waar nodig. Retourneer dezelfde JSON structuur terug, met verbeterde hooks/scripts waar je aanpassingen hebt gemaakt. ALLEEN geldig JSON array, zelfde format als input.`
    }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : scriptsJson
}

// ── Helpers ────────────────────────────────────────────────────────────────

function parseJSON<T>(tekst: string, fallback: T): T {
  try {
    const match = tekst.match(/\[[\s\S]*\]/)
    return match ? JSON.parse(match[0]) : fallback
  } catch {
    return fallback
  }
}

interface TopicItem {
  nummer: number
  topic: string
  locatie: string
  format: string
  invalshoek?: string
  doelgroep_pijn?: string
}

interface ScriptItem {
  nummer: number
  titel: string
  hook: string
  script: string
  duur_doel?: string
  cta: string
  caption_idee: string
  dm_share_trigger?: string
}

interface StoryFrame {
  frame: number
  type: string
  achtergrond: string
  tekst: string
  interactie: string
  optie_a: string
  optie_b: string
  doel: string
}

interface ProductieItem {
  nummer: number
  duur_sec: number
  platform: string[]
  camera_opstelling: string
  kleding: string
  opname_volgorde: string[]
  broll: string[]
  licht: string
  tip: string
}

function combineerdeBriefing(topics: TopicItem[], scripts: ScriptItem[], productie: ProductieItem[]) {
  return topics.map((t) => {
    const s = scripts.find(x => x.nummer === t.nummer) ?? {} as ScriptItem
    const p = productie.find(x => x.nummer === t.nummer) ?? {} as ProductieItem
    return {
      nummer: t.nummer,
      titel: s.titel ?? t.topic,
      pijler: 'fitness',
      locatie: t.locatie,
      format: t.format,
      invalshoek: t.invalshoek ?? '',
      doelgroep_pijn: t.doelgroep_pijn ?? '',
      duur_sec: p.duur_sec ?? 30,
      duur_doel: s.duur_doel ?? '30s',
      dm_share_trigger: s.dm_share_trigger ?? '',
      platform: p.platform ?? ['Instagram Reels', 'TikTok'],
      prioriteit: 'hoog',
      hook: s.hook ?? '',
      script: s.script ?? '',
      camera_opstelling: p.camera_opstelling ?? '',
      kleding: p.kleding ?? '',
      opname_volgorde: p.opname_volgorde ?? [],
      broll: p.broll ?? [],
      licht: p.licht ?? '',
      productie_tip: p.tip ?? '',
      cta: s.cta ?? '',
      caption_idee: s.caption_idee ?? '',
    }
  })
}

// ── Route handlers ─────────────────────────────────────────────────────────

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
  return req.headers.get('x-cron-secret') === cronSecret
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
    // Agent 0 + variety guard parallel — onafhankelijk van elkaar
    const [recenteTopics, dagTrends] = await Promise.all([
      haalRecenteTopics(db),
      zoekDagTrends(),
    ])

    // Agent 1-4 sequentieel — elke agent bouwt op de vorige
    const topicsRaw    = await kiesTopics(filmDag, filmDatumStr, recenteTopics, dagTrends)
    const scriptsRaw   = await schrijfScripts(topicsRaw, postDag, postDatumStr)
    const verbeterdRaw = await verbeterHooks(scriptsRaw, topicsRaw)   // critic pass
    const productieRaw = await maakShotList(topicsRaw, verbeterdRaw)

    // Agent 5: Stories parallel aan productie (onafhankelijk)
    const storiesRaw = await maakStories(topicsRaw, verbeterdRaw)

    const topics    = parseJSON<TopicItem[]>(topicsRaw, [])
    const scripts   = parseJSON<ScriptItem[]>(verbeterdRaw, parseJSON<ScriptItem[]>(scriptsRaw, []))
    const productie = parseJSON<ProductieItem[]>(productieRaw, [])
    const stories   = parseJSON<StoryFrame[]>(storiesRaw, [])

    const videos    = combineerdeBriefing(topics, scripts, productie)
    const totaalSec = videos.reduce((s, v) => s + v.duur_sec, 0)
    const thema     = topics.map(t => t.topic).join(' · ')

    const { data: opgeslagen, error } = await db
      .from('content_briefings')
      .upsert({
        datum: vandaag,
        videos,
        stories,
        totale_opnametijd_sec: totaalSec,
        meta: {
          groet: `${videos.length} fitness videos klaar voor ${filmDag}`,
          thema,
          tip: topics[0]?.doelgroep_pijn ?? '',
        },
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
