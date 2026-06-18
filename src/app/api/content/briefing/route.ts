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

// ── Agent 1: Strategie ─────────────────────────────────────────────────────
// Kiest 3 fitness topics — puur fitness, maximaal visueel, niet herhaald.

async function kiesTopics(filmDag: string, filmDatum: string, recenteTopics: string[]): Promise<string> {
  const vermijden = recenteTopics.length
    ? `\n\nVERMIJD deze topics want ze zijn de afgelopen week al gedaan:\n${recenteTopics.slice(0, 12).map(t => `- ${t}`).join('\n')}`
    : ''

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    system: `Je bent een fitness content strateeg die weet wat viraal gaat op Instagram Reels en TikTok in 2025.

Kane Bongers is personal trainer in Eersel, Nederland. Hij filmt zichzelf — geen crew, geen studio. Kane traint voor kracht en esthetiek: hij bouwt spiermassa, werkt aan zijn lichaamscompositie en laat zijn eigen physique zien als social proof. Zijn publiek: mannen en vrouwen 20–40 jaar die sterker willen worden, spiermassa willen opbouwen of een beter lichaam willen. Ze scrollen 's ochtends of 's avonds.

FOCUS: krachtsport en physique. Geen cardio-only, geen Hyrox, geen performance sport. Denk: gym bodybuilding, krachttraining, spiergroei, lichaamssculpturing.

Kies topics die aan ALLE vier criteria voldoen:
1. Visueel — je ziet het, je demonstreert het (geen praatje alleen) — Kane laat zijn eigen lichaam zien
2. Specifiek — niet "goede techniek" maar "zo activeer je je lats bij een pull-up"
3. Kracht of physique — lost een fout op bij een krachtoefeningóf laat zien hoe je spiergroei maximaliseert
4. Strength/physique only — geen ondernemerscontent, geen cardio-focus, geen Hyrox

Denk aan:
- Techniekfouten bij krachtoefeningen (squat, bench press, deadlift, OHP, Romanian deadlift, lat pulldown)
- Mind-muscle connection tips voor specifieke spiergroepen (borst, rug, schouders, armen, benen)
- Progressieve overload methoden (hoe je structureel sterker en groter wordt)
- Lichaamscompositie: voeding voor spiermassa of vetverbranding (calorieën, eiwitten, timing)
- Physique-content: Kane laat zijn eigen lichaam zien bij een oefening als visueel bewijs
- Trainingsschema tips (volume, frequentie, herstel per spiergroep)
- Kleine aanpassingen die een oefening veel effectiever maken voor spiergroei

Varieer locatie: niet alle 3 op dezelfde plek.
Varieer format: mix demonstratie (Kane's lichaam in beeld) met talking head.${vermijden}

Retourneer ALLEEN een JSON array:
[
  {
    "nummer": 1,
    "topic": "heel specifieke beschrijving — één oefening of concept",
    "invalshoek": "corrigeer fout | geef quick win | bust mythe | demonstreer techniek | physique showcase | uitleg mechanic",
    "locatie": "Gym | Buiten | Thuis",
    "format": "demonstratie | talking head | workout | uitleg | physique check",
    "doelgroep_pijn": "welk probleem of frustratie raakt dit bij de kijker"
  }
]`,
    messages: [{
      role: 'user',
      content: `Filmdag: ${filmDag} ${filmDatum}. Kies 3 sterke fitness topics. Maak elk topic zo specifiek dat Kane precies weet welke oefening of welk concept hij gaat filmen.`
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
    system: `Je bent een short-form video scriptwriter die krachtsport en physique content schrijft voor Instagram Reels en TikTok. Je schrijft voor Kane Bongers — een Nederlandse personal trainer die zichzelf filmt en zijn eigen lichaam als visueel bewijs inzet.

Regels die je nooit breekt:
- GEEN intro. Geen "hoi", geen "ik ben Kane". Direct in de hook.
- GEEN vage algemeenheden. Elk woord moet concreet zijn.
- GEEN cardio-fluff, GEEN Hyrox. Altijd krachtsport of physique.
- Hook is de EERSTE zin — moet shock, nieuwsgierigheid of directe waarde bevatten.
- Script is spreektaal — korte zinnen, komma's als pauze, actieve werkwoorden.
- Eindig met een concrete micro-CTA, geen smeekbede ("volg me voor meer" is verboden).
- Bij physique topics: script vraagt Kane om zijn lichaam te tonen — shirt uit, pump-shot, vergelijking voor/na een set.

Hook formules die bewezen werken voor krachtsport/physique:
- "Je [oefening] klopt niet. Hier is waarom."
- "Meeste mensen doen dit fout bij [onderwerp] — en het kost ze maanden spiermassa."
- "Zo zorg je dat je borst écht groeit bij de bench press."
- "Dit is waarom je rug niet groeit, ook al train je hem elke week."
- "Dit ene aanpassing bij [oefening] verdubbelt je spiergroei."
- "Je traint al maanden maar dit doet niemand bij [spiergroep]."
- "Mijn [spiergroep] groeide pas toen ik dit stopte te doen."

Gebruik [PAUZE] voor een adempauze, [DEMO] voor een demonstratiemoment, [KIJK NAAR CAMERA] voor directe blik, [SHIRT UIT] voor een physique-moment.`,
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
    "script": "volledig script spreektaal met [PAUZE] [DEMO] [KIJK NAAR CAMERA] markers — 80-130 woorden voor 45-60s video",
    "cta": "concrete call to action max 6 woorden, actief",
    "caption_idee": "2 zinnen caption — eerste zin pakt aan, tweede geeft context — plus 5 niche fitness hashtags"
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
    system: `Je bent een productieleider voor solo krachtsport content creators. Kane filmt zichzelf — hij heeft een telefoon, een statief, en de locatie die bij het topic past. Geen crew. Kane heeft een getraind lichaam en laat dit bewust zien als onderdeel van zijn content.

Jouw taak: geef exact aan wat Kane moet doen. Geen "zorg voor goed licht" — maar "zet je telefoon op kniehoogte, 1.5 meter voor je, camera recht op de barbell gericht". Geen "draag sportkleding" — maar "strak zwart t-shirt of geen shirt bij physique-shots, donkere trainingsbroek, geen logo's".

Bij physique-gerelateerde videos: geef expliciete instructie wanneer Kane zijn shirt uittrekt of zijn spieren toont — dit is bewuste content strategie, geen toeval.

Denk als een filmmaker die de video al in zijn hoofd ziet:
- Welke angle laat de spieractivatie of het lichaam het duidelijkst zien?
- Wat ziet de kijker precies — en wat niet?
- Welke shots zijn nodig als insert/b-roll (close-up van spier, gewicht, hands on bar)?
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
    // Haal recente topics op voor variety guard
    const recenteTopics = await haalRecenteTopics(db)

    // 4 agents sequentieel — elke agent bouwt op de vorige
    const topicsRaw    = await kiesTopics(filmDag, filmDatumStr, recenteTopics)
    const scriptsRaw   = await schrijfScripts(topicsRaw, postDag, postDatumStr)
    const verbeterdRaw = await verbeterHooks(scriptsRaw, topicsRaw)   // critic pass
    const productieRaw = await maakShotList(topicsRaw, verbeterdRaw)

    const topics    = parseJSON<TopicItem[]>(topicsRaw, [])
    const scripts   = parseJSON<ScriptItem[]>(verbeterdRaw, parseJSON<ScriptItem[]>(scriptsRaw, []))
    const productie = parseJSON<ProductieItem[]>(productieRaw, [])

    const videos    = combineerdeBriefing(topics, scripts, productie)
    const totaalSec = videos.reduce((s, v) => s + v.duur_sec, 0)
    const thema     = topics.map(t => t.topic).join(' · ')

    const { data: opgeslagen, error } = await db
      .from('content_briefings')
      .upsert({
        datum: vandaag,
        videos,
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
