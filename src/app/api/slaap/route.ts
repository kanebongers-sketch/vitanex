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
    .from('slaap_logs')
    .select('id, datum, uren_slaap, kwaliteit, bedtijd, wektijd, notitie, aangemaakt_op')
    .eq('user_id', user.id)
    .order('datum', { ascending: false })
    .limit(limit)

  const gemiddeldUren = data?.length
    ? Math.round((data.reduce((s, l) => s + l.uren_slaap, 0) / data.length) * 10) / 10
    : null

  const gemiddeldKwaliteit = data?.filter(l => l.kwaliteit).length
    ? Math.round((data.filter(l => l.kwaliteit).reduce((s, l) => s + (l.kwaliteit ?? 0), 0) / data.filter(l => l.kwaliteit).length) * 10) / 10
    : null

  return NextResponse.json({ logs: data ?? [], gemiddeld_uren: gemiddeldUren, gemiddeld_kwaliteit: gemiddeldKwaliteit }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { datum, uren_slaap, kwaliteit, bedtijd, wektijd, notitie }: {
    datum: string
    uren_slaap: number
    kwaliteit?: number
    bedtijd?: string
    wektijd?: string
    notitie?: string
  } = await req.json()

  if (!datum || typeof uren_slaap !== 'number' || uren_slaap < 0 || uren_slaap > 24) {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('slaap_logs')
    .upsert({
      user_id: user.id,
      datum,
      uren_slaap,
      kwaliteit: kwaliteit ?? null,
      bedtijd: bedtijd ?? null,
      wektijd: wektijd ?? null,
      notitie: notitie?.trim() ?? null,
    }, { onConflict: 'user_id,datum' })
    .select('id, datum, uren_slaap, kwaliteit, bedtijd, wektijd, notitie')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ log: data }, { status: 201 })
}
