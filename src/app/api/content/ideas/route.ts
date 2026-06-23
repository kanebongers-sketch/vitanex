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

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const db = getServiceClient()
  const url = new URL(req.url)
  const pijler = url.searchParams.get('pijler')
  const status = url.searchParams.get('status') ?? 'idee'

  let query = db.from('content_ideas').select('*').order('prioriteit', { ascending: false }).order('aangemaakt_op', { ascending: false })
  if (pijler) query = query.eq('pillar_id', pijler)
  if (status !== 'alle') query = query.eq('status', status)

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ideas: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const body = await req.json()

  if (body.actie === 'genereer') {
    return genereerIdeeën(body.pijler, body.aantal ?? 5)
  }

  if (body.actie === 'opslaan') {
    const db = getServiceClient()
    const { data, error } = await db.from('content_ideas').insert(body.idee).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ idee: data })
  }

  if (body.actie === 'waterfall') {
    return genereerWaterfall(body.titel, body.hook, body.pijler)
  }

  return NextResponse.json({ error: 'Onbekende actie' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id, ...updates } = await req.json()
  const db = getServiceClient()
  const { data, error } = await db.from('content_ideas').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ idee: data })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await req.json()
  const db = getServiceClient()
  await db.from('content_ideas').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}

async function genereerWaterfall(titel: string, hook: string, pijler: string) {
  const prompt = `Je bent een Instagram content strateeg gespecialiseerd in lifestyle content (afvallen, fitter worden, voeding, gezonde gewoontes, mentale gezondheid, energie).

Idee: "${titel}"
Hook: "${hook}"
Pijler: ${pijler}

Doelgroep: mensen (18-45 jaar) die willen afvallen, fitter worden of een gezondere leefstijl opbouwen. Ze scrollen op hun telefoon en hebben maar 3 seconden om te beslissen of ze doorgaan met kijken.

Genereer een DIEPGAANDE INSTAGRAM CONTENT WATERFALL. Uitsluitend Instagram. Maak elk stuk concreet, persoonlijk en actionable.

Retourneer ALLEEN geldig JSON (geen markdown, geen uitleg buiten de JSON):
{
  "kern_boodschap": "De 1 zin die dit idee samenvat",
  "virale_hook": "De sterkste Instagram hook, max 12 woorden — raakt de pijn of het verlangen direct",
  "carousels": [
    {
      "titel": "Carousel 1 titel",
      "doel": "educatief",
      "slides": [
        { "nr": 1, "type": "hook", "tekst": "Slide 1 tekst — stopt het scrollen, max 8 woorden", "visueel": "Hoe de slide eruitziet (achtergrond, font, kleur)" },
        { "nr": 2, "type": "probleem", "tekst": "Het probleem dat iedereen herkent", "visueel": "Visuele beschrijving" },
        { "nr": 3, "type": "waarom", "tekst": "Waarom het niet lukt — de echte reden", "visueel": "Visuele beschrijving" },
        { "nr": 4, "type": "oplossing", "tekst": "Stap 1 — concreet en actionable", "visueel": "Visuele beschrijving" },
        { "nr": 5, "type": "oplossing", "tekst": "Stap 2", "visueel": "Visuele beschrijving" },
        { "nr": 6, "type": "oplossing", "tekst": "Stap 3", "visueel": "Visuele beschrijving" },
        { "nr": 7, "type": "oplossing", "tekst": "Stap 4", "visueel": "Visuele beschrijving" },
        { "nr": 8, "type": "bewijs", "tekst": "Bewijs of resultaat — maakt het geloofwaardig", "visueel": "Visuele beschrijving" },
        { "nr": 9, "type": "samenvatting", "tekst": "De snelle recap in 1 zin", "visueel": "Visuele beschrijving" },
        { "nr": 10, "type": "cta", "tekst": "Concrete actie — sla op, stuur door of reageer", "visueel": "Visuele beschrijving" }
      ],
      "caption": "Volledige Instagram caption met emoji, 150-200 woorden, conversationele toon, eindigt met vraag aan de lezer",
      "hashtags": ["#afvallen", "#gezondeleven", "#fitnessmotivatie", "#voeding", "#gezondheid", "#leefstijl", "#workoutstips", "#weightloss", "#fitnesscoach", "#gezondeten", "#bodytransformation", "#fitleven", "#gezondegewoonten", "#lifestylecoach", "#fitnessinspiratie"],
      "cta": "Concrete call-to-action voor onder de post"
    },
    {
      "titel": "Carousel 2 titel — andere invalshoek",
      "doel": "inspirerend",
      "slides": [
        { "nr": 1, "type": "hook", "tekst": "Andere hook, andere angle", "visueel": "Visuele beschrijving" },
        { "nr": 2, "type": "mythe", "tekst": "Mythe die mensen geloven", "visueel": "Visuele beschrijving" },
        { "nr": 3, "type": "waarheid", "tekst": "De werkelijke waarheid", "visueel": "Visuele beschrijving" },
        { "nr": 4, "type": "tip", "tekst": "Praktische tip 1", "visueel": "Visuele beschrijving" },
        { "nr": 5, "type": "tip", "tekst": "Praktische tip 2", "visueel": "Visuele beschrijving" },
        { "nr": 6, "type": "tip", "tekst": "Praktische tip 3", "visueel": "Visuele beschrijving" },
        { "nr": 7, "type": "tip", "tekst": "Praktische tip 4", "visueel": "Visuele beschrijving" },
        { "nr": 8, "type": "tip", "tekst": "Praktische tip 5", "visueel": "Visuele beschrijving" },
        { "nr": 9, "type": "bewijs", "tekst": "Dit werkt omdat...", "visueel": "Visuele beschrijving" },
        { "nr": 10, "type": "cta", "tekst": "Sla op voor later", "visueel": "Visuele beschrijving" }
      ],
      "caption": "Volledige caption 150-200 woorden andere invalshoek",
      "hashtags": ["#afvallen", "#lifestyle", "#healthylife", "#gezondleven", "#fitness", "#voedingstips", "#motivatie", "#gezondheid", "#fitbody", "#leefstijlverandering", "#gezondgewicht", "#fitnessgoals", "#bodygoals", "#gezondevoeding", "#mindset"],
      "cta": "CTA voor carousel 2"
    }
  ],
  "reels": [
    {
      "titel": "Reel 1 titel",
      "duur_sec": 60,
      "hook": "Exacte openingszin — de eerste 3 seconden. Stopt het scrollen.",
      "script": "Volledig script in spreektaal, 90-120 woorden. Geen intro, direct in de waarde. Eindig met micro-CTA.",
      "shots": [
        "Shot 1: camera-opstelling, wat je ziet, wat de creator doet",
        "Shot 2: volgende shot",
        "Shot 3: volgende shot",
        "Shot 4: afsluiting"
      ],
      "caption": "Caption 80-100 woorden, conversationeel, met emoji",
      "hashtags": ["#afvallen", "#fitterworden", "#gezondegewoontes", "#lifestyletips", "#weightloss", "#fitnessroutine", "#gezondeleeefstijl", "#dagelijksebewegig", "#workout", "#gezondheid"]
    },
    {
      "titel": "Reel 2 titel — talking head of demonstratie",
      "duur_sec": 45,
      "hook": "Andere hook, andere stijl",
      "script": "Script 70-90 woorden, andere energie dan reel 1",
      "shots": ["Shot 1", "Shot 2", "Shot 3"],
      "caption": "Caption 60-80 woorden",
      "hashtags": ["#leefstijl", "#motivatie", "#gezondheidstips", "#afvaltips", "#fitnesscoach", "#beweging", "#gezondeten", "#wilskracht", "#resultaten", "#verandering"]
    },
    {
      "titel": "Reel 3 — myth bust of quick tip",
      "duur_sec": 30,
      "hook": "Korte, punchende hook",
      "script": "Script 40-60 woorden, supersnel, één punt",
      "shots": ["Shot 1", "Shot 2"],
      "caption": "Caption 40-60 woorden",
      "hashtags": ["#gezondetips", "#fitnessmythe", "#voedingsfeit", "#lifehack", "#sneltip", "#afvallensneller", "#gezondheid", "#fitness", "#leefstijl", "#dagelijksetips"]
    }
  ],
  "stories": [
    { "nr": 1, "type": "hook", "tekst": "Openingsstory die nieuwsgierig maakt — stel een vraag of doe een schokkende uitspraak", "visueel": "Achtergrondkleur/foto, tekst positie, sticker gebruik" },
    { "nr": 2, "type": "probleem", "tekst": "Herkenbaar probleem dat de kijker ervaart", "visueel": "Visuele beschrijving" },
    { "nr": 3, "type": "tip", "tekst": "Quick tip of feit dat waarde geeft", "visueel": "Visuele beschrijving" },
    { "nr": 4, "type": "poll", "tekst": "Poll vraag die engagement triggert — twee keuzes", "visueel": "Poll sticker met twee opties" },
    { "nr": 5, "type": "bewijs", "tekst": "Bewijs of resultaat — foto, getal of quote", "visueel": "Visuele beschrijving" },
    { "nr": 6, "type": "tip", "tekst": "Diepere tip of vervolgstap", "visueel": "Visuele beschrijving" },
    { "nr": 7, "type": "swipe", "tekst": "Swipe up of link sticker naar de carousel of reel", "visueel": "Link sticker, pijl, CTA tekst" }
  ],
  "hashtag_strategie": {
    "niche": ["#afvallenmetplezier", "#gezondleven2024", "#lifestylecoachNL", "#gezondlevenNL", "#fitterwordentips"],
    "medium": ["#afvallen", "#gezondegewoontes", "#gezondleven", "#leefstijlverandering", "#fitnesscoach"],
    "breed": ["#fitness", "#gezondheid", "#lifestyle", "#motivatie", "#weightloss"],
    "caption_template": "Korte openingszin die het probleem benoemt. [HOOK]\\n\\nDe 3 dingen die je moet weten:\\n\\n1️⃣ [TIP 1]\\n2️⃣ [TIP 2]\\n3️⃣ [TIP 3]\\n\\n[BEWIJS OF CONTEXT]\\n\\n[CTA — vraag of actie]\\n\\n#afvallen #gezondleven #lifestyle"
  },
  "postplan": {
    "beste_dag": "dinsdag of woensdag (hoogste Instagram engagement lifestyle niche)",
    "beste_tijd": "07:00-09:00 of 18:30-20:30 — voor of na werkdag",
    "volgorde": "Post Reel 1 eerst voor bereik (vrijdag of maandag). 3 dagen later Carousel 1 voor diepgang en opslaan. Stories dagelijks als warm-up voor de posts. Reel 2 en 3 als fill-in content.",
    "tip": "Specifieke posting tip voor dit type lifestyle content op Instagram in 2025"
  }
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = tekst.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Geen JSON in response')

    const waterfall = JSON.parse(jsonMatch[0])
    return NextResponse.json({ waterfall })
  } catch (err) {
    return NextResponse.json({ error: 'Waterfall generatie mislukt' }, { status: 500 })
  }
}

async function genereerIdeeën(pijler: string | null, aantal: number) {
  const pijlerContext = pijler
    ? `Focus UITSLUITEND op de pijler: "${pijler}"`
    : 'Verdeel de ideeën evenredig over alle pijlers'

  const prompt = `Genereer ${aantal} unieke, concrete Instagram content ideeën voor een lifestyle creator (afvallen, fitter worden, gezonde gewoontes, voeding, mentale gezondheid, energie).

${pijlerContext}

Doelgroep: vrouwen en mannen 18-45 jaar die willen afvallen, fitter worden of een gezondere leefstijl opbouwen. Ze scrollen op Instagram. Ze willen praktische tips die echt werken en er niet als "dieet content" uitzien.

FOCUS PIJLERS:
- afvallen: gewicht verliezen zonder crashdieet, calorieën, vetverbranding, eetpatroon
- voeding: gezond eten zonder obsessie, maaltijdprep, eiwitten, ontbijt, snacks, uiteten
- beweging: workouts voor beginners, thuis trainen, stappen, korte trainingen, gym basics
- gewoontes: ochtendroutine, slaap, consistentie, kleine veranderingen, habit stacking
- mentaal: mindset, body image, motivatie, zelfvertrouwen, stress, emotioneel eten
- energie: slaap, hydratatie, herstel, vermoeidheid, dagritme
- transformatie: voor/na verhalen, mijlpalen, obstakels overwinnen, langetermijn

Elk idee moet:
- Specifiek zijn (niet "afvaltips" maar "waarom je 's avonds altijd trek hebt — en wat je doet")
- Een hook hebben die pijn of verlangen raakt (max 12 woorden)
- Geschikt zijn voor Instagram Reels OF Carousels
- Herkenbaar voelen voor de doelgroep

Retourneer ALLEEN geldig JSON (geen markdown):
{
  "ideeen": [
    {
      "titel": "Pakkende titel max 10 woorden",
      "pijler": "afvallen|voeding|beweging|gewoontes|mentaal|energie|transformatie",
      "hook": "Opening die scrollen stopt (max 12 woorden)",
      "format": "reel|carousel|post",
      "platform": ["Instagram"],
      "prioriteit": 4,
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const tekst = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = tekst.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Geen JSON')

    const parsed = JSON.parse(jsonMatch[0])
    const db = getServiceClient()

    const toInsert = parsed.ideeen.map((i: Record<string, unknown>) => ({
      pillar_id: i.pijler,
      titel: i.titel,
      hook: i.hook,
      format: i.format,
      platform: i.platform,
      prioriteit: i.prioriteit ?? 3,
      tags: i.tags ?? [],
      status: 'idee',
    }))

    const { data, error } = await db.from('content_ideas').insert(toInsert).select()
    if (error) throw error

    return NextResponse.json({ ideeen: data, gegenereerd: true })
  } catch (err) {
    console.error('Idee generatie mislukt:', err)
    return NextResponse.json({ error: 'Generatie mislukt' }, { status: 500 })
  }
}
