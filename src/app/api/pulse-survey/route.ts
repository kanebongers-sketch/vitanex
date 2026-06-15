import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id')
    .eq('id', user.id)
    .single()

  if (!profiel?.bedrijf_id) return NextResponse.json({ vragen: [], al_ingevuld: false })

  const vandaag = new Date().toISOString().split('T')[0]
  const eersteDagVanWeek = new Date()
  eersteDagVanWeek.setDate(eersteDagVanWeek.getDate() - eersteDagVanWeek.getDay() + 1)
  const weekStart = eersteDagVanWeek.toISOString().split('T')[0]

  const { data: bestaand } = await admin
    .from('pulse_survey_antwoorden')
    .select('id')
    .eq('user_id', user.id)
    .gte('aangemaakt_op', `${weekStart}T00:00:00Z`)
    .maybeSingle()

  const { data: vragen } = await admin
    .from('pulse_survey_vragen')
    .select('id, vraag, type, opties')
    .eq('bedrijf_id', profiel.bedrijf_id)
    .eq('actief', true)
    .order('volgorde')
    .limit(5)

  return NextResponse.json({
    vragen: vragen ?? [],
    al_ingevuld: !!bestaand,
  })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { antwoorden }: { antwoorden: { vraag_id: string; antwoord: string | number }[] } = await req.json()

  if (!Array.isArray(antwoorden) || !antwoorden.length) {
    return NextResponse.json({ error: 'Geen antwoorden.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id')
    .eq('id', user.id)
    .single()

  if (!profiel?.bedrijf_id) return NextResponse.json({ error: 'Geen bedrijf.' }, { status: 400 })

  const { error } = await admin
    .from('pulse_survey_antwoorden')
    .insert(
      antwoorden.map(a => ({
        user_id: user.id,
        bedrijf_id: profiel.bedrijf_id,
        vraag_id: a.vraag_id,
        antwoord: String(a.antwoord),
      }))
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true }, { status: 201 })
}
