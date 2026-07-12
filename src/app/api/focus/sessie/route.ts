import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '14'), 30)

  const admin = createAdminClient()

  const [{ data: sessies }, { data: totalen }] = await Promise.all([
    admin.from('focus_sessies')
      .select('id, type, duur_minuten, notitie, aangemaakt_op')
      .eq('user_id', user.id)
      .order('aangemaakt_op', { ascending: false })
      .limit(limit),
    admin.from('focus_sessies')
      .select('duur_minuten')
      .eq('user_id', user.id)
      .gte('aangemaakt_op', new Date(Date.now() - 30 * 86400000).toISOString()),
  ])

  const totaal_minuten = (totalen ?? []).reduce((s, r) => s + (r.duur_minuten ?? 0), 0)

  return NextResponse.json({ sessies: sessies ?? [], totaal_minuten })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { type = 'pomodoro', duur_minuten, notitie } = await req.json() as {
    type?: string; duur_minuten: number; notitie?: string
  }

  if (!duur_minuten || duur_minuten < 1 || duur_minuten > 240) {
    return NextResponse.json({ error: 'Ongeldige duur.' }, { status: 400 })
  }

  const GELDIGE_TYPES = ['pomodoro', 'deep', 'quick', 'adem']
  if (!GELDIGE_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Ongeldig type.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('focus_sessies')
    .insert({
      user_id: user.id,
      type,
      duur_minuten: Math.round(duur_minuten),
      notitie: notitie?.trim() || null,
    })
    .select('id, aangemaakt_op')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, id: data.id }, { status: 201 })
}
