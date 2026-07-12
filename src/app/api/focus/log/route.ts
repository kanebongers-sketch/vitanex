import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { duur_minuten, type = 'pomodoro', datum }: {
    duur_minuten: number
    type?: string
    datum?: string
  } = await req.json()

  if (!Number.isInteger(duur_minuten) || duur_minuten <= 0 || duur_minuten > 480) {
    return NextResponse.json({ error: 'Duur moet tussen 1 en 480 minuten zijn.' }, { status: 400 })
  }

  const geldige_typen = ['pomodoro', 'deep_work', 'pauze', 'adem']
  if (!geldige_typen.includes(type)) {
    return NextResponse.json({ error: `Type moet één van: ${geldige_typen.join(', ')}` }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('focus_timer_logs')
    .insert({
      user_id: user.id,
      duur_minuten,
      type,
      datum: datum ?? new Date().toISOString().split('T')[0],
    })
    .select('id, duur_minuten, type, datum')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  // Statistieken: totaal focus-minuten, per type, deze week
  const weekGeleden = new Date()
  weekGeleden.setDate(weekGeleden.getDate() - 7)
  const weekGeledenStr = weekGeleden.toISOString().split('T')[0]

  const { data } = await admin
    .from('focus_timer_logs')
    .select('id, duur_minuten, type, datum, aangemaakt_op')
    .eq('user_id', user.id)
    .gte('datum', weekGeledenStr)
    .order('datum', { ascending: false })

  const logs = data ?? []
  const totaal = logs.filter(l => l.type !== 'pauze' && l.type !== 'adem').reduce((s, l) => s + l.duur_minuten, 0)
  const perType = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.type] = (acc[l.type] ?? 0) + l.duur_minuten
    return acc
  }, {})

  return NextResponse.json({ logs, totaal_minuten: totaal, per_type: perType })
}
