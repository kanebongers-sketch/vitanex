import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()

  const { data: profiel } = await admin
    .from('profiles').select('bedrijf_id, rol').eq('id', user.id).single()

  if (!profiel?.bedrijf_id || !['hr', 'admin'].includes(profiel.rol as string)) {
    return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 })
  }

  const bedrijfId = profiel.bedrijf_id as string

  // Haal alle medewerkers op
  const { data: medewerkers } = await admin
    .from('profiles')
    .select('id')
    .eq('bedrijf_id', bedrijfId)
    .eq('rol', 'medewerker')

  const mwIds = (medewerkers ?? []).map(m => m.id as string)
  if (!mwIds.length) {
    return NextResponse.json({ totaal_medewerkers: 0 })
  }

  const vierWekenTerug = new Date()
  vierWekenTerug.setDate(vierWekenTerug.getDate() - 28)
  const vierWekenStr = vierWekenTerug.toISOString().split('T')[0]

  const [
    { count: actieveCheckins },
    { data: burnoutScores },
    { data: enpsMetingen },
    { data: werkgelukMetingen },
    { data: psychMetingen },
  ] = await Promise.all([
    admin.from('checkin_sessies')
      .select('*', { count: 'exact', head: true })
      .in('user_id', mwIds)
      .gte('aangemaakt_op', vierWekenStr),

    admin.from('burnout_predictor_scores')
      .select('user_id, risico_score, trending, dominante_factor')
      .in('user_id', mwIds)
      .gte('week_start', vierWekenStr),

    admin.from('enps_metingen')
      .select('score')
      .eq('bedrijf_id', bedrijfId)
      .gte('aangemaakt_op', new Date(vierWekenTerug).toISOString()),

    admin.from('werkgeluk_metingen')
      .select('werkgeluk_score, zingeving, plezier, verbinding, groei')
      .eq('bedrijf_id', bedrijfId)
      .gte('week_start', vierWekenStr),

    admin.from('psych_veiligheid_metingen')
      .select('score, vrijheid_spreken, fouten_ok, idee_delen')
      .eq('bedrijf_id', bedrijfId)
      .gte('week_start', vierWekenStr),
  ])

  // Burnout risico distributie
  const burnoutDist = { laag: 0, matig: 0, hoog: 0 }
  const burnoutPerUser = new Map<string, number>()
  for (const s of (burnoutScores ?? [])) {
    if (!burnoutPerUser.has(s.user_id) || burnoutPerUser.get(s.user_id)! < s.risico_score) {
      burnoutPerUser.set(s.user_id, s.risico_score)
    }
  }
  for (const score of burnoutPerUser.values()) {
    if (score >= 70) burnoutDist.hoog++
    else if (score >= 45) burnoutDist.matig++
    else burnoutDist.laag++
  }

  // eNPS berekening
  let enpsScore: number | null = null
  if (enpsMetingen?.length) {
    const promotors = enpsMetingen.filter(e => e.score >= 9).length
    const detractors = enpsMetingen.filter(e => e.score <= 6).length
    enpsScore = Math.round(((promotors - detractors) / enpsMetingen.length) * 100)
  }

  // Werkgeluk gemiddelde
  const werkgelukGemiddeld = werkgelukMetingen?.length
    ? werkgelukMetingen.reduce((s, m) => s + m.werkgeluk_score, 0) / werkgelukMetingen.length
    : null

  // Psych veiligheid gemiddelde
  const psychGemiddeld = psychMetingen?.length
    ? psychMetingen.reduce((s, m) => s + m.score, 0) / psychMetingen.length
    : null

  // Dominante burnout factoren (team-level)
  const factorTelling: Record<string, number> = {}
  for (const s of (burnoutScores ?? [])) {
    if (s.dominante_factor) {
      factorTelling[s.dominante_factor] = (factorTelling[s.dominante_factor] ?? 0) + 1
    }
  }
  const topFactoren = Object.entries(factorTelling)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([factor, count]) => ({ factor, count }))

  return NextResponse.json({
    totaal_medewerkers: mwIds.length,
    actieve_checkins_4w: actieveCheckins ?? 0,
    participatie_pct: mwIds.length > 0
      ? Math.round(((actieveCheckins ?? 0) / mwIds.length) * 100)
      : 0,
    burnout_distributie: burnoutDist,
    enps_score: enpsScore,
    enps_responses: enpsMetingen?.length ?? 0,
    werkgeluk_gemiddeld: werkgelukGemiddeld !== null
      ? Math.round(werkgelukGemiddeld * 10) / 10
      : null,
    psych_veiligheid_gemiddeld: psychGemiddeld !== null
      ? Math.round(psychGemiddeld * 10) / 10
      : null,
    top_burnout_factoren: topFactoren,
  })
}
