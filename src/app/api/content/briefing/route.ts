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

// ── Agent 1: Strategie ────────────────────────────────────────────────────────
// Kiest 3 fitness topics die vandaag het beste scoren op Reels/TikTok.
// Output: raw JSON array met topic-objecten.

async function kiesTopics(filmDag: string, filmDatum: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `Je bent een fitness content strateeg. Je enige taak: kiezen welke fitness topics vandaag maximaal engagement opleveren op Instagram Reels en TikTok.

Kane Bongers is personal trainer in Eersel. Hij filmt zichzelf. Zijn kijkers: mensen die willen afvallen, sterker worden, of meer energie willen — maar het lastig vinden om consistent te trainen.

Kies topics die:
- Direct actionable zijn (iets wat de kijker vandaag nog kan doen)
- Visueel sterk zijn (je kunt het demonstreren, niet alleen praten)
- Een veelgemaakte fout corrigeren, OF een quick win geven
- Aansluiten bij wat er trending is in fitness (niet verouderd)

Varieer formaten per dag: mix demonstraties, uitleg, myth-busting, transformatie mindset.

Retourneer ALLEEN een JSON array, geen uitleg:
[
  {
    "nummer": 1,
    "topic": "exacte beschrijving van het onderwerp",
    "invalshoek": "hoe je het aanvliegt — bijv. 'corrigeer fout', 'geef quick win', 'bust mythe'",
    "locatie": "Gym | Buiten | Thuis | Auto",
    "format": "demonstratie | talking head | workout | uitleg",
    "waarom_nu": "waarom dit topic nu scoort (max 1 zin)"
  }
]`,
    messages: [{
      role: 'user',
      content: `Filmdag: ${filmDag} ${filmDatum}. Kies 3 fitness topics voor vandaag. Maak ze specifiek, visueel en actionable. Geen ondernemerscontent — puur fitness.`
    }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : '[]'
}

// ── Agent 2: Scripts ──────────────────────────────────────────────────────────
// Schrijft voor elk topic een killer hook + strak script.

async function schrijfScripts(topicsJson: string, postDag: string, postDatum: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `Je bent een ervaren short-form video scriptwriter, gespecialiseerd in fitness content voor Instagram Reels en TikTok.

Schrijf scripts die:
- Beginnen met een hook die in de eerste 2 seconden het scrollen stopt
- Geen intro, geen "hoi ik ben Kane" — direct to the point
- Conversatietaal — zoals je het zou zeggen tegen iemand in de gym
- Concreet en specifiek — geen vage algemeenheden
- Eindigen met een micro-CTA (kort, geen smeekbede)

Hook formules die werken:
- "Je doet [oefening] al jaren verkeerd."
- "Dit is waarom je geen [resultaat] ziet."
- "[Getal] seconden. Probeer dit."
- "Stop met [foute aanpak]. Doe dit."
- "Meeste mensen missen dit bij [onderwerp]."

Spreektaal. Nederlandse tekst. Geen jargon. Gebruik [PAUZE] en [DEMO] als markers.`,
    messages: [{
      role: 'user',
      content: `Topics: ${topicsJson}

Schrijf voor elk topic een volledig script. Publicatiedatum: ${postDag} ${postDatum}.

Retourneer ALLEEN geldig JSON array:
[
  {
    "nummer": 1,
    "titel": "video titel max 6 woorden pakkend",
    "hook": "exacte openingszin, max 12 woorden",
    "script": "volledig script met [PAUZE] en [DEMO] markers, max 120 woorden voor 60s",
    "cta": "call to action max 8 woorden",
    "caption_idee": "caption max 2 zinnen + 5 relevante hashtags"
  }
]`
    }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : '[]'
}

// ── Agent 3: Productie ────────────────────────────────────────────────────────
// Vertaalt topics + scripts naar exacte filmopnames.

async function maakShotList(topicsJson: string, scriptsJson: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `Je bent een video productieleider voor fitness content. Jouw taak: zorg dat de filmmaker precies weet wat hij moet doen. Geen vaagheid.

Geef voor elke video:
- Exacte cameraopstelling (hoogte, hoek, afstand)
- Wat Kane draagt (kleding die past bij de locatie en boodschap)
- Welke specifieke shots/oefeningen — inclusief herhalingen, tempo
- Lichtinstructies (raam links, buiten in schaduw, etc.)
- B-roll shots die de video versterken
- Volgorde van opnames (meest energie eerst)

Schrijf alsof je direct tegen de cameraman praat. Praktisch, concreet.`,
    messages: [{
      role: 'user',
      content: `Topics: ${topicsJson}
Scripts: ${scriptsJson}

Retourneer ALLEEN geldig JSON array:
[
  {
    "nummer": 1,
    "duur_sec": 60,
    "platform": ["Instagram Reels", "TikTok"],
    "camera_opstelling": "exacte beschrijving positie en hoek camera",
    "kleding": "wat aantrekken",
    "opname_volgorde": ["shot 1 beschrijving", "shot 2 beschrijving"],
    "broll": ["b-roll shot 1", "b-roll shot 2", "b-roll shot 3"],
    "licht": "lichtinstructie",
    "tip": "1 concrete productieopmerking die de video beter maakt"
  }
]`
    }],
  })
  return res.content[0].type === 'text' ? res.content[0].text : '[]'
}

// ── Samenvoegen ───────────────────────────────────────────────────────────────

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
  waarom_nu?: string
}

interface ScriptItem {
  nummer: number
  titel: string
  hook: string
  script: string
  cta: string
  caption_idee: string
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

function combineerdeBriefing(
  topics: TopicItem[],
  scripts: ScriptItem[],
  productie: ProductieItem[]
) {
  return topics.map((t) => {
    const s = scripts.find(x => x.nummer === t.nummer) ?? {} as ScriptItem
    const p = productie.find(x => x.nummer === t.nummer) ?? {} as ProductieItem
    return {
      nummer: t.nummer,
      titel: s.titel ?? t.topic,
      pijler: 'fitness',
      locatie: t.locatie,
      format: t.format,
      duur_sec: p.duur_sec ?? 60,
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
    // Drie agents draaien sequentieel — elke agent bouwt op de vorige
    const topicsRaw = await kiesTopics(filmDag, filmDatumStr)
    const scriptsRaw = await schrijfScripts(topicsRaw, postDag, postDatumStr)
    const productieRaw = await maakShotList(topicsRaw, scriptsRaw)

    const topics = parseJSON<TopicItem[]>(topicsRaw, [])
    const scripts = parseJSON<ScriptItem[]>(scriptsRaw, [])
    const productie = parseJSON<ProductieItem[]>(productieRaw, [])

    const videos = combineerdeBriefing(topics, scripts, productie)
    const totaalSec = videos.reduce((s, v) => s + v.duur_sec, 0)

    const thema = topics.map(t => t.topic).join(' · ')

    const { data: opgeslagen, error } = await db
      .from('content_briefings')
      .upsert({
        datum: vandaag,
        videos,
        totale_opnametijd_sec: totaalSec,
        meta: {
          groet: `Film dag ${filmDag} — ${videos.length} videos klaarstaan`,
          thema,
          tip: topics[0]?.waarom_nu ?? '',
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
