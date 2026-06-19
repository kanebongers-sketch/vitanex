import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'

function toDateString(value: string): string {
  return value.slice(0, 10)
}

function vandaagStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function datumMinusDagen(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const negentigDagenGeleden = datumMinusDagen(89)

  const [stemming, slaap, snelcheck, gewoonte] = await Promise.all([
    admin
      .from('stemming_logs')
      .select('aangemaakt_op')
      .eq('user_id', user.id)
      .gte('aangemaakt_op', negentigDagenGeleden),

    admin
      .from('slaap_logs')
      .select('datum')
      .eq('user_id', user.id)
      .gte('datum', negentigDagenGeleden),

    admin
      .from('snelcheck_logs')
      .select('datum')
      .eq('user_id', user.id)
      .gte('datum', negentigDagenGeleden)
      .then(res => {
        if (res.error?.code === '42P01') return { data: [], error: null }
        return res
      }),

    admin
      .from('gewoonte_logs')
      .select('datum')
      .eq('user_id', user.id)
      .gte('datum', negentigDagenGeleden)
      .then(res => {
        if (res.error?.code === '42P01') return { data: [], error: null }
        return res
      }),
  ])

  const activeDates = new Set<string>()

  for (const row of stemming.data ?? []) {
    activeDates.add(toDateString(row.aangemaakt_op))
  }
  for (const row of slaap.data ?? []) {
    activeDates.add(toDateString(row.datum))
  }
  for (const row of snelcheck.data ?? []) {
    activeDates.add(toDateString(row.datum))
  }
  for (const row of gewoonte.data ?? []) {
    activeDates.add(toDateString(row.datum))
  }

  // Bereken huidige streak (consecutive days terug vanaf vandaag)
  let streak = 0
  const vandaag = vandaagStr()
  const actief_vandaag = activeDates.has(vandaag)

  let checkDatum = vandaag
  while (activeDates.has(checkDatum)) {
    streak++
    const d = new Date(checkDatum)
    d.setDate(d.getDate() - 1)
    checkDatum = d.toISOString().slice(0, 10)
  }

  // Kalender: laatste 90 dagen
  const kalender: { datum: string; actief: boolean }[] = []
  for (let i = 89; i >= 0; i--) {
    const datum = datumMinusDagen(i)
    kalender.push({ datum, actief: activeDates.has(datum) })
  }

  const totaal_actief = activeDates.size

  // Maand percentage: actieve dagen deze maand / dag van de maand * 100
  const nu = new Date()
  const dagVanDeMaand = nu.getDate()
  const eersteVanMaand = new Date(nu.getFullYear(), nu.getMonth(), 1).toISOString().slice(0, 10)
  let actiefDezeMaand = 0
  for (const datum of activeDates) {
    if (datum >= eersteVanMaand && datum <= vandaag) actiefDezeMaand++
  }
  const maand_pct = dagVanDeMaand > 0
    ? Math.round((actiefDezeMaand / dagVanDeMaand) * 100)
    : 0

  return NextResponse.json({
    streak,
    totaal_actief,
    maand_pct,
    kalender,
    actief_vandaag,
  }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' } })
}
