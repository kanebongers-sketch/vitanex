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

const DEFAULT_RESPONSE = {
  score: 50,
  label: 'Geen data',
  kleur: 'grijs',
  factoren: [],
  slaap_uren: null,
  stress_niveau: null,
  stemming_waarde: null,
  streak: 0,
  heeft_data: false,
}

export async function GET(req: NextRequest) {
  // Auth check
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const gisteren = getGisteren()
  const dertigVijfDagenGeleden = getDatumNDagenGeleden(35)

  const vandaag = getVandaag()
  // 36-uur venster: Nederlandse gebruikers (UTC+2) kunnen een log van
  // "gisteren" opslaan die in UTC al de dag daarvoor valt.
  const zesendertigUurGeleden = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()

  let slaapRes, stressRes, stemmingRes, gewoonteRes

  try {
    ;[slaapRes, stressRes, stemmingRes, gewoonteRes] = await Promise.all([
      admin
        .from('slaap_logs')
        .select('uren_slaap, kwaliteit')
        .eq('user_id', user.id)
        .in('datum', [gisteren, vandaag])
        .order('datum', { ascending: false })
        .limit(1)
        .maybeSingle(),

      admin
        .from('stress_logs')
        .select('stress_niveau')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', zesendertigUurGeleden)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle(),

      admin
        .from('stemming_logs')
        .select('stemming')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', zesendertigUurGeleden)
        .order('aangemaakt_op', { ascending: false })
        .limit(1)
        .maybeSingle(),

      admin
        .from('gewoonte_logs')
        .select('datum')
        .eq('user_id', user.id)
        .gte('datum', dertigVijfDagenGeleden),
    ])
  } catch (err) {
    console.error('[readiness] DB query failed:', err)
    return NextResponse.json(
      { ...DEFAULT_RESPONSE, datum: gisteren },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=60' },
      }
    )
  }

  const slaap = slaapRes.data ?? null
  const stress = stressRes.data ?? null
  const stemming = stemmingRes.data ?? null
  const gewoonteLogDatums: string[] = (gewoonteRes.data ?? []).map(
    (r: { datum: string }) => r.datum
  )

  // Als er geen data is, geef een duidelijk default antwoord terug
  if (!slaap && !stress && !stemming && gewoonteLogDatums.length === 0) {
    return NextResponse.json(
      { ...DEFAULT_RESPONSE, datum: gisteren },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=60' },
      }
    )
  }

  const streak = berekenStreak(gewoonteLogDatums)
  const heeftData = !!(slaap ?? stress ?? stemming)

  const factoren: Factor[] = []
  let score = 50

  // Slaap bijdrage
  const urenSlaap = slaap?.uren_slaap ?? null
  const slaapKwaliteit = slaap?.kwaliteit ?? null

  if (urenSlaap !== null && !isNaN(Number(urenSlaap))) {
    let slaapBijdrage = 0
    let slaapBeschrijving = ''
    const uren = Number(urenSlaap)

    if (uren >= 8) {
      slaapBijdrage = 25
      slaapBeschrijving = `${uren}u slaap — uitstekend`
    } else if (uren >= 7) {
      slaapBijdrage = 15
      slaapBeschrijving = `${uren}u slaap — goed`
    } else if (uren >= 6) {
      slaapBijdrage = 5
      slaapBeschrijving = `${uren}u slaap — voldoende`
    } else {
      slaapBijdrage = -15
      slaapBeschrijving = `${uren}u slaap — te weinig`
    }

    if (slaapKwaliteit !== null && !isNaN(Number(slaapKwaliteit))) {
      const kwaliteit = Number(slaapKwaliteit)
      if (kwaliteit >= 4) {
        slaapBijdrage += 5
        slaapBeschrijving += ', hoge kwaliteit'
      } else if (kwaliteit <= 2) {
        slaapBijdrage -= 5
        slaapBeschrijving += ', lage kwaliteit'
      }
    }

    score += slaapBijdrage ?? 0
    factoren.push({ naam: 'Slaap', bijdrage: slaapBijdrage, beschrijving: slaapBeschrijving })
  }

  // Stress bijdrage
  const stressNiveau = stress?.stress_niveau ?? null

  if (stressNiveau !== null && !isNaN(Number(stressNiveau))) {
    let stressBijdrage = 0
    let stressBeschrijving = ''
    const niveau = Number(stressNiveau)

    if (niveau <= 3) {
      stressBijdrage = 15
      stressBeschrijving = `Stressniveau ${niveau}/10 — laag`
    } else if (niveau <= 5) {
      stressBijdrage = 5
      stressBeschrijving = `Stressniveau ${niveau}/10 — matig`
    } else if (niveau <= 7) {
      stressBijdrage = -5
      stressBeschrijving = `Stressniveau ${niveau}/10 — verhoogd`
    } else {
      stressBijdrage = -15
      stressBeschrijving = `Stressniveau ${niveau}/10 — hoog`
    }

    score += stressBijdrage ?? 0
    factoren.push({ naam: 'Stress', bijdrage: stressBijdrage, beschrijving: stressBeschrijving })
  }

  // Stemming bijdrage
  const stemmingWaarde = stemming?.stemming ?? null

  if (stemmingWaarde !== null && !isNaN(Number(stemmingWaarde))) {
    let stemmingBijdrage = 0
    let stemmingBeschrijving = ''
    const waarde = Number(stemmingWaarde)

    if (waarde >= 4) {
      stemmingBijdrage = 10
      stemmingBeschrijving = `Stemming ${waarde}/5 — positief`
    } else if (waarde >= 3) {
      stemmingBijdrage = 3
      stemmingBeschrijving = `Stemming ${waarde}/5 — neutraal`
    } else {
      stemmingBijdrage = -10
      stemmingBeschrijving = `Stemming ${waarde}/5 — negatief`
    }

    score += stemmingBijdrage ?? 0
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

  // Clamp 0-100 en bescherm tegen NaN
  const rawScore = isNaN(score) ? 50 : score
  const eindScore = Math.max(0, Math.min(100, rawScore))

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

  return NextResponse.json(
    {
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
    },
    {
      headers: { 'Cache-Control': 'private, max-age=120, stale-while-revalidate=60' },
    }
  )
}
