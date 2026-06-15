import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id, rol')
    .eq('id', user.id)
    .single()

  if (!profiel?.bedrijf_id || !['hr', 'admin'].includes(profiel.rol)) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const bedrijfId = profiel.bedrijf_id

  const weekStart = (() => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().slice(0, 10)
  })()

  const [{ data: vragen }, { data: antwoorden }, { data: profielen }] = await Promise.all([
    admin.from('pulse_survey_vragen')
      .select('id, vraag, type, opties, actief, volgorde, aangemaakt_op')
      .eq('bedrijf_id', bedrijfId)
      .order('volgorde'),
    admin.from('pulse_survey_antwoorden')
      .select('vraag_id, antwoord, aangemaakt_op, user_id')
      .eq('bedrijf_id', bedrijfId)
      .gte('aangemaakt_op', `${weekStart}T00:00:00Z`),
    admin.from('profiles')
      .select('id')
      .eq('bedrijf_id', bedrijfId)
      .eq('rol', 'medewerker'),
  ])

  const totaalMedewerkers = profielen?.length ?? 0

  const respondentenDitWeek = new Set(
    (antwoorden ?? []).map(a => a.user_id)
  ).size

  const vraagStats = (vragen ?? []).map(vraag => {
    const antwoordenVoorVraag = (antwoorden ?? []).filter(a => a.vraag_id === vraag.id)
    const numeriek = antwoordenVoorVraag.map(a => parseFloat(a.antwoord)).filter(n => !isNaN(n))
    const gemiddelde = numeriek.length ? Math.round(numeriek.reduce((s, n) => s + n, 0) / numeriek.length * 10) / 10 : null

    const distributie: Record<string, number> = {}
    antwoordenVoorVraag.forEach(a => {
      distributie[a.antwoord] = (distributie[a.antwoord] ?? 0) + 1
    })

    let nps: number | null = null
    if (vraag.type === 'nps' && numeriek.length > 0) {
      const promoters = numeriek.filter(n => n >= 9).length
      const detractors = numeriek.filter(n => n <= 6).length
      nps = Math.round(((promoters - detractors) / numeriek.length) * 100)
    }

    return {
      id: vraag.id,
      vraag: vraag.vraag,
      type: vraag.type,
      actief: vraag.actief,
      volgorde: vraag.volgorde,
      aangemaakt_op: vraag.aangemaakt_op,
      aantal_antwoorden: antwoordenVoorVraag.length,
      gemiddelde,
      distributie,
      nps,
    }
  })

  return NextResponse.json({
    vragen: vraagStats,
    participatie: {
      respondenten: respondentenDitWeek,
      totaal: totaalMedewerkers,
      pct: totaalMedewerkers > 0 ? Math.round((respondentenDitWeek / totaalMedewerkers) * 100) : 0,
    },
    week_start: weekStart,
  })
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { vraag, type, opties, volgorde } = await req.json() as {
    vraag: string
    type: 'scale' | 'nps' | 'multiple_choice' | 'text'
    opties?: string[]
    volgorde?: number
  }

  if (!vraag?.trim() || !type) {
    return NextResponse.json({ error: 'Vraag en type zijn verplicht.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id, rol')
    .eq('id', user.id)
    .single()

  if (!profiel?.bedrijf_id || !['hr', 'admin'].includes(profiel.rol)) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const { data, error } = await admin
    .from('pulse_survey_vragen')
    .insert({
      bedrijf_id: profiel.bedrijf_id,
      vraag: vraag.trim(),
      type,
      opties: opties ?? null,
      volgorde: volgorde ?? 99,
      actief: true,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.id }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const { id, actief } = await req.json() as { id: string; actief: boolean }
  if (!id) return NextResponse.json({ error: 'ID verplicht.' }, { status: 400 })

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id, rol')
    .eq('id', user.id)
    .single()

  if (!profiel?.bedrijf_id || !['hr', 'admin'].includes(profiel.rol)) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const { error } = await admin
    .from('pulse_survey_vragen')
    .update({ actief })
    .eq('id', id)
    .eq('bedrijf_id', profiel.bedrijf_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
