import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '14'), 30)

  const { data } = await admin
    .from('stress_logs')
    .select('id, stress_niveau, aangemaakt_op, notitie, techniek')
    .eq('user_id', user.id)
    .order('aangemaakt_op', { ascending: false })
    .limit(limit)

  return NextResponse.json({ logs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { stress_niveau, notitie, techniek }: {
    stress_niveau: number
    notitie?: string
    techniek?: string
  } = await req.json()

  if (!Number.isInteger(stress_niveau) || stress_niveau < 1 || stress_niveau > 10) {
    return NextResponse.json({ error: 'stress_niveau moet 1-10 zijn.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('stress_logs')
    .insert({
      user_id: user.id,
      stress_niveau,
      notitie: notitie?.trim() ?? null,
      techniek: techniek ?? null,
    })
    .select('id, stress_niveau, aangemaakt_op, notitie, techniek')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ log: data }, { status: 201 })
}
