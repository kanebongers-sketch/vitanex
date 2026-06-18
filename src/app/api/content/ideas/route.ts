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

async function genereerIdeeën(pijler: string | null, aantal: number) {
  const pijlerContext = pijler
    ? `Focus UITSLUITEND op de pijler: "${pijler}"`
    : 'Verdeel de ideeën evenredig over alle 7 pijlers'

  const prompt = `Genereer ${aantal} unieke, concrete content ideeën voor Kane Bongers (personal trainer gespecialiseerd in krachtsport en physique).

${pijlerContext}

FOCUS: krachtsport en physique. Denk aan spiergroei, techniek bij krachtoefeningen, lichaamscompositie, voeding voor spiermassa, en Kane die zijn eigen lichaam als voorbeeld laat zien. GEEN Hyrox, GEEN cardio-only, GEEN ondernemerscontent.

Elk idee moet:
- Specifiek zijn (niet "tips over fitness" maar "zo activeer je je lats bij elke pull-up")
- Een duidelijke hook hebben die stopt met scrollen
- Actionable zijn voor de doelgroep (20–40 jaar, wil sterker worden en beter eruitzien)
- Passen bij een short-form video format (Reels/TikTok/YouTube Shorts)

Retourneer ALLEEN geldig JSON (geen markdown):
{
  "ideeen": [
    {
      "titel": "Pakkende titel max 10 woorden",
      "pijler": "kracht|physique|voeding|herstel|techniek|spiergroei|leefstijl",
      "hook": "Opening die zorgt dat mensen stoppen met scrollen (max 15 woorden)",
      "format": "reel|carousel|post|video|nieuwsbrief|linkedin",
      "platform": ["Instagram Reels", "TikTok"],
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
