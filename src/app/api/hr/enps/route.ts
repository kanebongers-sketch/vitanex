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

  const { data: antwoorden } = await admin
    .from('enps_antwoorden')
    .select('score, categorie, aangemaakt_op, user_id')
    .eq('bedrijf_id', bedrijfId)
    .order('aangemaakt_op', { ascending: false })

  const scores = (antwoorden ?? []).map(a => a.score)
  const promoters = scores.filter(s => s >= 9).length
  const detractors = scores.filter(s => s <= 6).length
  const passives = scores.filter(s => s > 6 && s < 9).length
  const nps = scores.length > 0 ? Math.round(((promoters - detractors) / scores.length) * 100) : null

  const distributie: Record<number, number> = {}
  scores.forEach(s => { distributie[s] = (distributie[s] ?? 0) + 1 })

  const maandGroepen: Record<string, { scores: number[] }> = {}
  ;(antwoorden ?? []).forEach(a => {
    const maand = a.aangemaakt_op?.slice(0, 7) ?? 'onbekend'
    if (!maandGroepen[maand]) maandGroepen[maand] = { scores: [] }
    maandGroepen[maand].scores.push(a.score)
  })

  const trend = Object.entries(maandGroepen)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([maand, g]) => {
      const p = g.scores.filter(s => s >= 9).length
      const d = g.scores.filter(s => s <= 6).length
      return {
        maand,
        nps: g.scores.length > 0 ? Math.round(((p - d) / g.scores.length) * 100) : null,
        respondenten: g.scores.length,
      }
    })

  const { data: medewerkers } = await admin
    .from('profiles')
    .select('id')
    .eq('bedrijf_id', bedrijfId)
    .eq('rol', 'medewerker')

  const totaalMedewerkers = medewerkers?.length ?? 0
  const uniekRespondenten = new Set((antwoorden ?? []).map(a => a.user_id)).size

  return NextResponse.json({
    nps,
    totaal_respondenten: uniekRespondenten,
    promoters,
    passives,
    detractors,
    participatie_pct: totaalMedewerkers > 0 ? Math.round((uniekRespondenten / totaalMedewerkers) * 100) : 0,
    distributie,
    trend,
  })
}
