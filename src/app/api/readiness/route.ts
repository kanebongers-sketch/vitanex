import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

interface Factor {
  naam: string
  bijdrage: number
  beschrijving: string
}

function getGisteren(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function getVandaag(): string {
  return new Date().toISOString().slice(0, 10)
}

function getDatumNDagenGeleden(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function berekenStreak(datums: string[]): number {
  const uniek = [...new Set(datums)].sort().reverse()
  let streak = 0
  let huidig = getVandaag()

  for (const datum of uniek) {
    if (datum === huidig) {
      streak++
      const d = new Date(huidig)
      d.setDate(d.getDate() - 1)
      huidig = d.toISOString().slice(0, 10)
    } else {
      break
    }
  }

  return streak
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const gisteren = getGisteren()
  const dertigVijfDagenGeleden = getDatumNDagenGeleden(35)

  const [slaapRes, stressRes, stemmingRes, gewoonteRes] = await Promise.all([
    admin
      .from('slaap_logs')
      .select('uren_slaap, kwaliteit')
      .eq('user_id', user.id)
      .eq('datum', gisteren)
      .maybeSingle(),

    admin
      .from('stress_logs')
      .select('stress_niveau')
      .eq('user_id', user.id)
      .gte('aangemaakt_op', gisteren)
      .order('aangemaakt_op', { ascending: false })
      .limit(1)
      .maybeSingle(),

    admin
      .from('stemming_logs')
      .select('stemming')
      .eq('user_id', user.id)
      .gte('aangemaakt_op', gisteren)
      .order('aangemaakt_op', { ascending: false })
      .limit(1)
      .maybeSingle(),

    admin
      .from('gewoonte_logs')
      .select('datum')
      .eq('user_id', user.id)
      .gte('datum', dertigVijfDagenGeleden),
  ])

  const slaap = slaapRes.data
  const stress = stressRes.data
  const stemming = stemmingRes.data
  const gewoonteLogDatums: string[] = (gewoonteRes.data ?? []).map((r: { datum: string }) => r.datum)

  const streak = berekenStreak(gewoonteLogDatums)
  const heeftData = !!(slaap ?? stress ?? stemming)

  const factoren: Factor[] = []
  let score = 50

  // Slaap bijdrage
  const urenSlaap = slaap?.uren_slaap ?? null
  const slaapKwaliteit = slaap?.kwaliteit ?? null

  if (urenSlaap !== null) {
    let slaapBijdrage = 0
    let slaapBeschrijving = ''

    if (urenSlaap >= 8) {
      slaapBijdrage = 25
      slaapBeschrijving = `${urenSlaap}u slaap — uitstekend`
    } else if (urenSlaap >= 7) {
      slaapBijdrage = 15
      slaapBeschrijving = `${urenSlaap}u slaap — goed`
    } else if (urenSlaap >= 6) {
      slaapBijdrage = 5
      slaapBeschrijving = `${urenSlaap}u slaap — voldoende`
    } else {
      slaapBijdrage = -15
      slaapBeschrijving = `${urenSlaap}u slaap — te weinig`
    }

    if (slaapKwaliteit !== null) {
      if (slaapKwaliteit >= 4) {
        slaapBijdrage += 5
        slaapBeschrijving += ', hoge kwaliteit'
      } else if (slaapKwaliteit <= 2) {
        slaapBijdrage -= 5
        slaapBeschrijving += ', lage kwaliteit'
      }
    }

    score += slaapBijdrage
    factoren.push({ naam: 'Slaap', bijdrage: slaapBijdrage, beschrijving: slaapBeschrijving })
  }

  // Stress bijdrage
  const stressNiveau = stress?.stress_niveau ?? null

  if (stressNiveau !== null) {
    let stressBijdrage = 0
    let stressBeschrijving = ''

    if (stressNiveau <= 3) {
      stressBijdrage = 15
      stressBeschrijving = `Stressniveau ${stressNiveau}/10 — laag`
    } else if (stressNiveau <= 5) {
      stressBijdrage = 5
      stressBeschrijving = `Stressniveau ${stressNiveau}/10 — matig`
    } else if (stressNiveau <= 7) {
      stressBijdrage = -5
      stressBeschrijving = `Stressniveau ${stressNiveau}/10 — verhoogd`
    } else {
      stressBijdrage = -15
      stressBeschrijving = `Stressniveau ${stressNiveau}/10 — hoog`
    }

    score += stressBijdrage
    factoren.push({ naam: 'Stress', bijdrage: stressBijdrage, beschrijving: stressBeschrijving })
  }

  // Stemming bijdrage
  const stemmingWaarde = stemming?.stemming ?? null

  if (stemmingWaarde !== null) {
    let stemmingBijdrage = 0
    let stemmingBeschrijving = ''

    if (stemmingWaarde >= 4) {
      stemmingBijdrage = 10
      stemmingBeschrijving = `Stemming ${stemmingWaarde}/5 — positief`
    } else if (stemmingWaarde >= 3) {
      stemmingBijdrage = 3
      stemmingBeschrijving = `Stemming ${stemmingWaarde}/5 — neutraal`
    } else {
      stemmingBijdrage = -10
      stemmingBeschrijving = `Stemming ${stemmingWaarde}/5 — negatief`
    }

    score += stemmingBijdrage
    factoren.push({ naam: 'Stemming', bijdrage: stemmingBijdrage, beschrijving: stemmingBeschrijving })
  }

  // Streak bonus
  if (streak >= 30) {
    score += 10
    factoren.push({ naam: 'Gewoontestreak', bijdrage: 10, beschrijving: `${streak} dagen streak — indrukwekkend` })
  } else if (streak >= 7) {
    score += 5
    factoren.push({ naam: 'Gewoontestreak', bijdrage: 5, beschrijving: `${streak} dagen streak — goed bezig` })
  }

  // Clamp 0-100
  const eindScore = Math.max(0, Math.min(100, score))

  // Label en kleur
  let label: string
  let kleur: string

  if (eindScore >= 80) {
    label = 'Hersteld'
    kleur = 'groen'
  } else if (eindScore >= 60) {
    label = 'Goed'
    kleur = 'indigo'
  } else if (eindScore >= 40) {
    label = 'Matig'
    kleur = 'amber'
  } else {
    label = 'Rust nodig'
    kleur = 'rood'
  }

  return NextResponse.json({
    score: eindScore,
    label,
    kleur,
    factoren,
    slaap_uren: urenSlaap,
    stress_niveau: stressNiveau,
    stemming_waarde: stemmingWaarde,
    streak,
    heeft_data: heeftData,
    datum: gisteren,
  })
}
