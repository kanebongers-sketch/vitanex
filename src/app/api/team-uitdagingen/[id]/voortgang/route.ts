import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const { data: uitdaging } = await admin
    .from('team_uitdagingen')
    .select('id, naam, type, doel_waarde, eenheid, start_datum, eind_datum, bedrijf_id')
    .eq('id', id)
    .single()

  if (!uitdaging) return NextResponse.json({ error: 'Niet gevonden.' }, { status: 404 })

  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id, rol')
    .eq('id', user.id)
    .maybeSingle()

  if (!profiel || profiel.bedrijf_id !== uitdaging.bedrijf_id) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const { data: logs } = await admin
    .from('team_uitdaging_logs')
    .select('user_id, waarde, aangemaakt_op')
    .eq('uitdaging_id', id)
    .order('aangemaakt_op', { ascending: false })

  const logsLijst = logs ?? []
  const mijnLogs = logsLijst.filter(l => l.user_id === user.id)
  const mijnTotaal = mijnLogs.reduce((s, l) => s + (l.waarde ?? 0), 0)
  const teamTotaal = logsLijst.reduce((s, l) => s + (l.waarde ?? 0), 0)
  const aantalDeelnemers = new Set(logsLijst.map(l => l.user_id)).size

  const dagenResterend = Math.max(
    0,
    Math.ceil((new Date(uitdaging.eind_datum).getTime() - Date.now()) / 86400000)
  )

  return NextResponse.json({
    uitdaging,
    mijn_bijdrage: mijnTotaal,
    team_totaal: teamTotaal,
    doel_bereikt_pct: uitdaging.doel_waarde > 0
      ? Math.min(100, Math.round((teamTotaal / uitdaging.doel_waarde) * 100))
      : 0,
    aantal_deelnemers: aantalDeelnemers,
    dagen_resterend: dagenResterend,
    mijn_logs: mijnLogs.slice(0, 7),
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { waarde, notitie } = await req.json() as { waarde: number; notitie?: string }

  if (!waarde || waarde <= 0) {
    return NextResponse.json({ error: 'Ongeldige waarde.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from('team_uitdaging_logs')
    .insert({
      uitdaging_id: id,
      user_id: user.id,
      waarde: Math.round(waarde * 10) / 10,
      notitie: notitie?.trim() || null,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true }, { status: 201 })
}
