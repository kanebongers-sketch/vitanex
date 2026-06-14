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
    .from('stemming_logs')
    .select('id, stemming, energie, emoji, notitie, aangemaakt_op')
    .eq('user_id', user.id)
    .order('aangemaakt_op', { ascending: false })
    .limit(limit)

  return NextResponse.json({ logs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { stemming, energie, emoji, notitie }: {
    stemming: number
    energie?: number
    emoji?: string
    notitie?: string
  } = await req.json()

  if (!Number.isInteger(stemming) || stemming < 1 || stemming > 5) {
    return NextResponse.json({ error: 'stemming moet 1-5 zijn.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('stemming_logs')
    .insert({
      user_id: user.id,
      stemming,
      energie: energie ?? null,
      emoji: emoji ?? null,
      notitie: notitie?.trim() ?? null,
    })
    .select('id, stemming, aangemaakt_op')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ log: data }, { status: 201 })
}
