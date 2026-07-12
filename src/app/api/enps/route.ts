import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('enps_metingen')
    .select('maand, score, reden')
    .eq('user_id', user.id)
    .order('maand', { ascending: false })
    .limit(6)

  return NextResponse.json({ metingen: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { score, reden }: { score: number; reden?: string } = await req.json()

  if (!Number.isInteger(score) || score < 0 || score > 10) {
    return NextResponse.json({ error: 'Score moet tussen 0 en 10 zijn.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profiel } = await admin
    .from('profiles').select('bedrijf_id').eq('id', user.id).single()

  if (!profiel?.bedrijf_id) {
    return NextResponse.json({ error: 'Geen bedrijf gekoppeld.' }, { status: 400 })
  }

  const maand = new Date().toISOString().slice(0, 7) // YYYY-MM

  const { data, error } = await admin
    .from('enps_metingen')
    .upsert(
      {
        user_id: user.id,
        bedrijf_id: profiel.bedrijf_id,
        maand,
        score,
        reden: reden?.trim() ?? null,
      },
      { onConflict: 'user_id,maand' },
    )
    .select('id, maand, score')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ meting: data })
}
