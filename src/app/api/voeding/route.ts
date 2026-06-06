
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getAuth(request: Request) {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7)
}

// GET: fetch logs for a date (default today)
export async function GET(request: Request) {
  const token = getAuth(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const datum = searchParams.get('datum') || new Date().toISOString().split('T')[0]
  const dagen = searchParams.get('dagen') // e.g. "7" for last 7 days

  if (dagen) {
    const vanafDatum = new Date()
    vanafDatum.setDate(vanafDatum.getDate() - parseInt(dagen))
    const vanafStr = vanafDatum.toISOString().split('T')[0]

    const { data, error: fetchError } = await supabaseAdmin
      .from('voeding_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('datum', vanafStr)
      .order('datum', { ascending: false })
      .order('aangemaakt_op', { ascending: false })

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
    return NextResponse.json({ logs: data || [] })
  }

  const { data, error: fetchError } = await supabaseAdmin
    .from('voeding_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('datum', datum)
    .order('aangemaakt_op', { ascending: true })

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  return NextResponse.json({ logs: data || [] })
}

// POST: add a new voeding log
export async function POST(request: Request) {
  const token = getAuth(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as {
    datum?: string
    maaltijd_type: string
    omschrijving: string
    calorieen?: number
    eiwitten_g?: number
    koolhydraten_g?: number
    vetten_g?: number
    vezels_g?: number
    portie_gram?: number
    bron?: string
    foto_url?: string
    ai_analyse?: unknown
  }

  const { data, error: insertError } = await supabaseAdmin
    .from('voeding_logs')
    .insert({
      user_id: user.id,
      datum: body.datum || new Date().toISOString().split('T')[0],
      maaltijd_type: body.maaltijd_type,
      omschrijving: body.omschrijving,
      calorieen: body.calorieen || null,
      eiwitten_g: body.eiwitten_g || null,
      koolhydraten_g: body.koolhydraten_g || null,
      vetten_g: body.vetten_g || null,
      vezels_g: body.vezels_g || null,
      portie_gram: body.portie_gram || null,
      bron: body.bron || 'manueel',
      foto_url: body.foto_url || null,
      ai_analyse: body.ai_analyse || null,
    })
    .select()
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ log: data }, { status: 201 })
}

// DELETE: remove a voeding log
export async function DELETE(request: Request) {
  const token = getAuth(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id vereist' }, { status: 400 })

  const { error: deleteError } = await supabaseAdmin
    .from('voeding_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // extra RLS check

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
