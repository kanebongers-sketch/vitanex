import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

const STANDAARD_DOEL_ML = 2000

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const vandaag = new Date().toISOString().split('T')[0]

  const { data, error } = await admin
    .from('water_logs')
    .select('id, ml, aangemaakt_op')
    .eq('user_id', user.id)
    .eq('datum', vandaag)
    .order('aangemaakt_op', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const logs = (data ?? []).map(l => ({
    id: l.id,
    ml: l.ml,
    tijdstip: l.aangemaakt_op,
  }))

  const vandaag_ml = logs.reduce((sum, l) => sum + l.ml, 0)

  return NextResponse.json({
    vandaag_ml,
    doel_ml: STANDAARD_DOEL_ML,
    logs,
  }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const body: { ml: number } = await req.json()
  const { ml } = body

  if (!Number.isInteger(ml) || ml <= 0 || ml > 2000) {
    return NextResponse.json({ error: 'ml moet een geheel getal zijn tussen 1 en 2000.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const vandaag = new Date().toISOString().split('T')[0]

  const { error: insertError } = await admin
    .from('water_logs')
    .insert({ user_id: user.id, ml, datum: vandaag })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  const { data: totaalData, error: totaalError } = await admin
    .from('water_logs')
    .select('ml')
    .eq('user_id', user.id)
    .eq('datum', vandaag)

  if (totaalError) return NextResponse.json({ error: totaalError.message }, { status: 500 })

  const nieuw_totaal = (totaalData ?? []).reduce((sum, l) => sum + l.ml, 0)

  return NextResponse.json({ nieuw_totaal, doel_ml: STANDAARD_DOEL_ML }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'id query parameter vereist.' }, { status: 400 })

  const admin = createAdminClient()

  const { error } = await admin
    .from('water_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ verwijderd: true })
}
