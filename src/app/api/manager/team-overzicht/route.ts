import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles')
    .select('rol, bedrijf_id, naam')
    .eq('id', user.id)
    .single()

  if (!profiel?.bedrijf_id || !['hr', 'admin', 'manager'].includes(profiel.rol ?? '')) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const dertigDagenGeleden = new Date()
  dertigDagenGeleden.setDate(dertigDagenGeleden.getDate() - 30)
  const cutoff = dertigDagenGeleden.toISOString()

  const [
    { data: medewerkers },
    { data: checkIns },
    { data: burnoutScores },
  ] = await Promise.all([
    admin.from('profiles')
      .select('id, naam, email, rol')
      .eq('bedrijf_id', profiel.bedrijf_id)
      .eq('rol', 'medewerker'),
    admin.from('checkin_sessies')
      .select('user_id, aangemaakt_op, domein_scores')
      .eq('bedrijf_id', profiel.bedrijf_id)
      .gte('aangemaakt_op', cutoff)
      .order('aangemaakt_op', { ascending: false }),
    admin.from('burnout_predictor_scores')
      .select('user_id, risico_score, trending, week_start')
      .eq('bedrijf_id', profiel.bedrijf_id)
      .gte('week_start', cutoff.slice(0, 10))
      .order('week_start', { ascending: false }),
  ])

  const medewerkersLijst = medewerkers ?? []

  const teamData = medewerkersLijst.map(m => {
    const mCheckIns = (checkIns ?? []).filter(c => c.user_id === m.id)
    const laatste = mCheckIns[0]
    const burnout = (burnoutScores ?? []).find(b => b.user_id === m.id)

    const gemiddelden: Record<string, number> = {}
    if (mCheckIns.length > 0) {
      const domeinen = Object.keys(mCheckIns[0]?.domein_scores ?? {})
      for (const d of domeinen) {
        const scores = mCheckIns
          .map(c => (c.domein_scores as Record<string, number>)?.[d])
          .filter((s): s is number => typeof s === 'number')
        if (scores.length > 0) {
          gemiddelden[d] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
        }
      }
    }

    const dagenSindsCi = laatste
      ? Math.floor((Date.now() - new Date(laatste.aangemaakt_op).getTime()) / 86400000)
      : null

    return {
      id: m.id,
      naam: m.naam,
      email: m.email,
      checkins_30d: mCheckIns.length,
      dagen_sinds_checkin: dagenSindsCi,
      burnout_risico: burnout?.risico_score ?? null,
      burnout_trending: burnout?.trending ?? null,
      gemiddelde_scores: gemiddelden,
    }
  })

  // Anoniem aggregaat voor team
  const totaalCi = (checkIns ?? []).length
  const gemBurnout = burnoutScores?.length
    ? Math.round(burnoutScores.reduce((s, b) => s + (b.risico_score ?? 0), 0) / burnoutScores.length)
    : null
  const actief30d = new Set((checkIns ?? []).map(c => c.user_id)).size

  return NextResponse.json({
    team: teamData,
    aggregaat: {
      totaal_medewerkers: medewerkersLijst.length,
      actief_30d: actief30d,
      participatie_pct: medewerkersLijst.length > 0
        ? Math.round((actief30d / medewerkersLijst.length) * 100)
        : 0,
      totaal_checkins: totaalCi,
      gem_burnout_risico: gemBurnout,
    },
  })
}
