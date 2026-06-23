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
    system: `Je bent een Instagram lifestyle content strateeg die weet wat viraal gaat in 2025.

De creator filmt zichzelf — smartphone, eventueel statief, geen crew. De content gaat over een gezonde leefstijl: afvallen, fitter worden, voeding, gewoontes, mentale gezondheid en energie. Doelgroep: vrouwen en mannen 18-45 jaar die willen afvallen, fitter worden of een gezondere leefstijl opbouwen. Ze scrollen 's ochtends vroeg of 's avonds op Instagram.

CONTENT PIJLERS:
- Afvallen: calorieën begrijpen, verzadiging, avondhonger, plateau doorbreken, eetpatroon aanpassen
- Voeding: gezond eten zonder obsessie, maaltijdprep, eiwitten, snelle gezonde maaltijden, uiteten
- Beweging: workouts voor beginners, thuis trainen, meer bewegen in het dagelijks leven, stappen
- Gewoontes: ochtendroutine, slaapgewoontes, consistentie, kleine veranderingen die groot effect hebben
- Mentaal: motivatie vinden, body image, emotioneel eten, mindset rondom afvallen, zelfvertrouwen
- Energie: slaap optimaliseren, hydratatie, middagdip voorkomen, herstel, dagritme

Kies topics die aan ALLE vier criteria voldoen:
1. Herkenbaar — de kijker denkt direct "dit herken ik" of "dit wil ik weten"
2. Specifiek — niet "tips om af te vallen" maar "waarom je 's avonds altijd trek hebt na het avondeten"
3. Actionable — er zit een concrete tip of inzicht in dat mensen morgen kunnen toepassen
4. Filmbaar — je kunt het laten zien, demonstreren of er is een sterk talking head moment

Varieer: niet 3x dezelfde pijler. Mix talking head met iets dat je kunt laten zien (keuken, buiten, thuis).${vermijden}

Retourneer ALLEEN een JSON array:
[
  {
    "nummer": 1,
    "topic": "heel specifieke omschrijving van het onderwerp",
    "invalshoek": "corrigeer misvatting | geef quick win | bust mythe | persoonlijk verhaal | voor-na | uitleg waarom",
    "locatie": "Thuis | Keuken | Buiten | Gym | Supermarkt | Slaapkamer",
    "format": "talking head | demonstratie | voor-na vergelijking | dag-in-leven | uitleg met props",
    "doelgroep_pijn": "welk herkenbaar probleem of verlangen raakt dit direct"
  }
]`,
    messages: [{
      role: 'user',
      content: `Filmdag: ${filmDag} ${filmDatum}. Kies 3 sterke lifestyle topics. Maak elk topic zo specifiek dat de creator precies weet wat hij/zij filmt en wat de kernboodschap is.`
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
    system: `Je bent een Instagram Reels scriptwriter gespecialiseerd in lifestyle content (afvallen, voeding, gewoontes, mentale gezondheid, energie). Je schrijft voor een Nederlandse lifestyle creator die zichzelf filmt.

Regels die je nooit breekt:
- GEEN intro. Geen "hoi guys", geen "ik ben X". Direct in de hook.
- GEEN vage algemeenheden. Elk woord moet concreet en herkenbaar zijn.
- Hook is de EERSTE zin — raakt een pijn, een verlangen of een verrassing.
- Script is spreektaal — korte zinnen, komma's als pauze, persoonlijk en direct.
- Eindig met een concrete micro-CTA: "sla dit op", "stuur dit naar iemand die dit nodig heeft", "probeer dit vanavond".
- Nooit: "volg me voor meer", "laat een like achter", of andere generieke smeekbedes.
- Bij voedings-/keukencontent: geef aan wat de creator laat zien of vasthoudt.

Hook formules die bewezen werken voor lifestyle/afvallen:
- "Dit is waarom je niet afvalt, ook al eet je 'gezond'."
- "De reden dat je 's avonds altijd trek hebt — en hoe je het stopt."
- "Ik at 3 maanden lang dit ontbijt en verloor [X] kilo zonder diëten."
- "Meeste mensen doen dit fout bij het afvallen — en het saboteert alles."
- "Dit ene ding veranderde mijn lichaam meer dan elk dieet ooit deed."
- "Je hebt geen willpower nodig. Je hebt dit nodig."
- "Stop met [mythe]. Doe dit in plaats daarvan."

Gebruik [PAUZE] voor adempauze, [DEMO] voor een demonstratiemoment, [KIJK NAAR CAMERA] voor directe blik, [TOON] voor iets dat je vasthoudt of laat zien.`,
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
    system: `Je bent een productieleider voor solo Instagram lifestyle creators. De creator filmt zichzelf — smartphone, statief, natuurlijk licht. Geen crew, geen studio. Locaties: thuis, keuken, buiten, gym, supermarkt.

Jouw taak: geef exacte instructies. Niet "zorg voor goed licht" maar "ga bij het raam staan, licht van links, voor 10 uur of na 16 uur voor zacht daglicht". Niet "draag iets moois" maar "neutraal shirt zonder opvallende tekst, effen kleur — geen wit (valt weg), geen zwart (zuigt licht op bij dark mode)".

Denk als een filmmaker die de video al voor zich ziet:
- Welke camerahoek maakt het verhaal geloofwaardig en persoonlijk?
- Wat houdt de creator vast of laat hij/zij zien (eten, app, boodschappenlijst, weegschaal)?
- Welke b-roll shots maken de video professioneler (close-up handen, scherm, product)?
- Wat is de meest gemaakte fout bij dit type video — en hoe vermijd je die?`,
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
    system: `Je bent een brutaal eerlijke Instagram Reels editor gespecialiseerd in lifestyle content. Je ziet in 2 seconden of een hook werkt of niet.

Criteria voor een goede hook (lifestyle/afvallen niche):
- Raakt een echte pijn OF een sterk verlangen van de doelgroep
- Is specifiek — niet "afvaltip" maar "waarom je 's avonds altijd honger hebt"
- Is NOOIT generiek: "Wil jij afvallen?", "Heb jij last van X?" — nooit als opening
- Heeft verrassing, tegenstelling of urgentie
- Max 10 woorden, eindigt niet met een punt

Criteria voor een goed script:
- Elke zin verdient zijn plek — geen opvulling
- Geen herhaling van de hook in andere woorden
- Demo-momenten zijn concreet: niet "laat gezond eten zien" maar "houd de cottage cheese naast de gewone yoghurt"
- CTA is een directe actie: "sla dit op", "stuur dit door", "probeer dit vanavond"
- Geen smeekbedes, geen "als je dit interessant vond"

Beoordeel elk script. Herschrijf alleen wat écht beter kan. Laat staan wat al sterk is.`,
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
      pijler: 'lifestyle',
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
