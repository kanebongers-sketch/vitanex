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
    .from('psych_veiligheid_metingen')
    .select('week_start, vrijheid_spreken, fouten_ok, idee_delen, score')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(8)

  return NextResponse.json({ metingen: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { vrijheid_spreken, fouten_ok, idee_delen }: {
    vrijheid_spreken: number; fouten_ok: number; idee_delen: number
  } = await req.json()

  for (const [k, v] of Object.entries({ vrijheid_spreken, fouten_ok, idee_delen })) {
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      return NextResponse.json({ error: `${k} moet tussen 1 en 5 zijn.` }, { status: 400 })
    }
  }

  const admin = createAdminClient()
  const { data: profiel } = await admin
    .from('profiles').select('bedrijf_id').eq('id', user.id).single()

  if (!profiel?.bedrijf_id) {
    return NextResponse.json({ error: 'Geen bedrijf gekoppeld.' }, { status: 400 })
  }

  const score = Math.round(((vrijheid_spreken + fouten_ok + idee_delen) / 3) * 10) / 10
  const weekStart = berekenWeekStart(new Date())

  const { data, error } = await admin
    .from('psych_veiligheid_metingen')
    .upsert(
      {
        user_id: user.id,
        bedrijf_id: profiel.bedrijf_id,
        week_start: weekStart,
        vrijheid_spreken, fouten_ok, idee_delen, score,
      },
      { onConflict: 'user_id,week_start' },
    )
    .select('id, week_start, score')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meting: data })
}
