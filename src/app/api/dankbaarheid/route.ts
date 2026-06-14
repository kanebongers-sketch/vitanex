import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limiet = Math.min(30, Number(searchParams.get('limiet') ?? '7'))

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dankbaarheid_logs')
    .select('id, datum, items, aangemaakt_op')
    .eq('user_id', user.id)
    .order('datum', { ascending: false })
    .limit(limiet)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { items, datum }: { items: string[]; datum?: string } = await req.json()

  if (!Array.isArray(items) || !items.length) {
    return NextResponse.json({ error: 'Minimaal één item vereist.' }, { status: 400 })
  }
  const geldigItems = items.map(i => String(i).trim()).filter(Boolean).slice(0, 5)
  if (!geldigItems.length) {
    return NextResponse.json({ error: 'Geen geldige items.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const dag = datum ?? new Date().toISOString().split('T')[0]

  const { data, error } = await admin
    .from('dankbaarheid_logs')
    .upsert(
      { user_id: user.id, datum: dag, items: geldigItems },
      { onConflict: 'user_id,datum' },
    )
    .select('id, datum, items')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}
