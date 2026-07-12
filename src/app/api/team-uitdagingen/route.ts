import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles').select('bedrijf_id').eq('id', user.id).single()

  if (!profiel?.bedrijf_id) {
    return NextResponse.json({ uitdagingen: [] })
  }

  const { data } = await admin
    .from('team_uitdagingen')
    .select(`
      id, naam, beschrijving, type, doel_waarde, eenheid,
      start_datum, eind_datum, actief,
      team_uitdaging_logs(user_id, datum, waarde)
    `)
    .eq('bedrijf_id', profiel.bedrijf_id)
    .eq('actief', true)
    .gte('eind_datum', new Date().toISOString().split('T')[0])
    .order('start_datum', { ascending: false })

  return NextResponse.json({ uitdagingen: data ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profiel } = await admin
    .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()

  if (!profiel?.bedrijf_id) {
    return NextResponse.json({ error: 'Geen bedrijf gekoppeld.' }, { status: 400 })
  }
  if (!['hr', 'admin'].includes(profiel.rol as string)) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const body = await req.json() as {
    naam: string
    beschrijving?: string
    type: string
    doel_waarde?: number
    eenheid?: string
    start_datum: string
    eind_datum: string
  }

  if (!body.naam?.trim() || !body.start_datum || !body.eind_datum) {
    return NextResponse.json({ error: 'Naam, startdatum en einddatum zijn verplicht.' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('team_uitdagingen')
    .insert({
      bedrijf_id: profiel.bedrijf_id,
      aangemaakt_door: user.id,
      naam: body.naam.trim(),
      beschrijving: body.beschrijving?.trim() ?? null,
      type: body.type ?? 'custom',
      doel_waarde: body.doel_waarde ?? null,
      eenheid: body.eenheid ?? null,
      start_datum: body.start_datum,
      eind_datum: body.eind_datum,
    })
    .select('id, naam, start_datum, eind_datum')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ uitdaging: data })
}
