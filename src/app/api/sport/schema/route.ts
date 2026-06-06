import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function auth(r: Request) {
  const h = r.headers.get('authorization')
  return h?.startsWith('Bearer ') ? h.slice(7) : null
}

export async function GET(request: Request) {
  const token = auth(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const schemaId = searchParams.get('id')

  if (schemaId) {
    const { data: schema } = await supabaseAdmin.from('sport_schemas').select('*').eq('id', schemaId).eq('user_id', user.id).single()
    const { data: trainingen } = await supabaseAdmin.from('sport_trainingen').select('*, sport_oefeningen(*)').eq('schema_id', schemaId).order('volgorde')
    return NextResponse.json({ schema, trainingen: trainingen || [] })
  }

  const { data: schemas } = await supabaseAdmin.from('sport_schemas').select('*').eq('user_id', user.id).order('aangemaakt_op', { ascending: false })
  return NextResponse.json({ schemas: schemas || [] })
}

export async function DELETE(request: Request) {
  const token = auth(request)
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id vereist' }, { status: 400 })

  await supabaseAdmin.from('sport_schemas').delete().eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
