import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { getPlanVoorBedrijf } from '@/lib/plan/plan-server'
import { heeftFeature } from '@/lib/plan/plan'

// k-anonimiteit: scores pas tonen bij ≥ 5 unieke respondenten,
// anders zijn individuele antwoorden herleidbaar.
const MIN_RESPONDENTEN = 5

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

  const plan = await getPlanVoorBedrijf(admin, bedrijfId)
  if (!heeftFeature(plan, 'hr_analytics')) {
    return NextResponse.json(
      { error: 'eNPS-resultaten zijn onderdeel van het Groei-plan.', code: 'premium' },
      { status: 403 },
    )
  }

  const { data: antwoorden } = await admin
    .from('enps_antwoorden')
    .select('score, categorie, aangemaakt_op, user_id')
    .eq('bedrijf_id', bedrijfId)
    .order('aangemaakt_op', { ascending: false })

  const uniekRespondenten = new Set((antwoorden ?? []).map(a => a.user_id)).size
  const voldoendeRespondenten = uniekRespondenten >= MIN_RESPONDENTEN

  const scores = (antwoorden ?? []).map(a => a.score)
  const promoters = scores.filter(s => s >= 9).length
  const detractors = scores.filter(s => s <= 6).length
  const passives = scores.filter(s => s > 6 && s < 9).length
  const nps = voldoendeRespondenten && scores.length > 0
    ? Math.round(((promoters - detractors) / scores.length) * 100)
    : null

  const distributie: Record<number, number> = {}
  if (voldoendeRespondenten) {
    scores.forEach(s => { distributie[s] = (distributie[s] ?? 0) + 1 })
  }

  const maandGroepen: Record<string, { scores: number[]; users: Set<string> }> = {}
  ;(antwoorden ?? []).forEach(a => {
    const maand = a.aangemaakt_op?.slice(0, 7) ?? 'onbekend'
    if (!maandGroepen[maand]) maandGroepen[maand] = { scores: [], users: new Set<string>() }
    maandGroepen[maand].scores.push(a.score)
    maandGroepen[maand].users.add(a.user_id)
  })

  const trend = Object.entries(maandGroepen)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([maand, g]) => {
      const p = g.scores.filter(s => s >= 9).length
      const d = g.scores.filter(s => s <= 6).length
      return {
        maand,
        // Maanden onder de anonimiteitsdrempel krijgen geen score.
        nps: g.users.size >= MIN_RESPONDENTEN && g.scores.length > 0
          ? Math.round(((p - d) / g.scores.length) * 100)
          : null,
        respondenten: g.scores.length,
      }
    })

  const { data: medewerkers } = await admin
    .from('profiles')
    .select('id')
    .eq('bedrijf_id', bedrijfId)
    .eq('rol', 'medewerker')

  const totaalMedewerkers = medewerkers?.length ?? 0

  return NextResponse.json({
    nps,
    totaal_respondenten: uniekRespondenten,
    promoters: voldoendeRespondenten ? promoters : 0,
    passives: voldoendeRespondenten ? passives : 0,
    detractors: voldoendeRespondenten ? detractors : 0,
    participatie_pct: totaalMedewerkers > 0 ? Math.round((uniekRespondenten / totaalMedewerkers) * 100) : 0,
    distributie,
    trend,
  })
}
