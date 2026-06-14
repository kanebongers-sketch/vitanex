import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

function berekenWeekStart(datum: Date): string {
  const d = new Date(datum)
  const dag = d.getDay()
  const diff = dag === 0 ? -6 : 1 - dag
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('werkgeluk_metingen')
    .select('week_start, zingeving, plezier, verbinding, groei, werkgeluk_score')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(12)

  return NextResponse.json({ metingen: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { zingeving, plezier, verbinding, groei }: {
    zingeving: number; plezier: number; verbinding: number; groei: number
  } = await req.json()

  for (const [k, v] of Object.entries({ zingeving, plezier, verbinding, groei })) {
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      return NextResponse.json({ error: `${k} moet tussen 1 en 5 zijn.` }, { status: 400 })
    }
  }

  const werkgeluk_score = ((zingeving + plezier + verbinding + groei) / 4)
  const weekStart = berekenWeekStart(new Date())

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles').select('bedrijf_id').eq('id', user.id).single()

  const { data, error } = await admin
    .from('werkgeluk_metingen')
    .upsert(
      {
        user_id: user.id,
        bedrijf_id: profiel?.bedrijf_id ?? null,
        week_start: weekStart,
        zingeving, plezier, verbinding, groei,
        werkgeluk_score: Math.round(werkgeluk_score * 10) / 10,
      },
      { onConflict: 'user_id,week_start' },
    )
    .select('id, week_start, werkgeluk_score')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meting: data })
}
