// GET /api/cron/push — draait elke ~15-30 min (cron-job.org). Bepaalt per
// gebruiker of er nu een respectvolle notificatie past (stiltetijd + daglimiet
// + vandaag-al-actief-check via de pure planner) en verstuurt die via FCM.
// Fail-closed op CRON_SECRET, net als de andere cron-routes.

import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { vandaagNL, datumMinusDagenNL, toDateString } from '@/lib/utils/date-nl'
import { berekenStreak } from '@/lib/streak/streak'
import { slimVerzendMoment } from '@/lib/push/timing'
import { kiesMeldingen, type PushVoorkeuren, type MeldingType, type GeplandeMelding } from '@/lib/push/planning'
import { verzendPush } from '@/lib/push/verzend'

const HORIZON = 90
const TIJDZONE = 'Europe/Amsterdam'

interface NuNL {
  nuMinuten: number
  datum: string
  weekdag: number // 0 = zondag … 6 = zaterdag
}

function nuNL(): NuNL {
  const datum = vandaagNL()
  const klok = new Date().toLocaleString('nl-NL', { timeZone: TIJDZONE, hour: '2-digit', minute: '2-digit', hour12: false })
  const [u, m] = klok.split(':').map((x) => parseInt(x, 10))
  // Weekdag van de NL-kalenderdatum (noon-UTC voorkomt tz-rollover).
  const weekdag = new Date(`${datum}T12:00:00Z`).getUTCDay()
  return { nuMinuten: (u || 0) * 60 + (m || 0), datum, weekdag }
}

function tijdVanTimestampNL(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('nl-NL', { timeZone: TIJDZONE, hour: '2-digit', minute: '2-digit', hour12: false })
}

/** 42P01 = tabel bestaat niet → behandel als leeg (zelfde patroon als /api/streak). */
async function veiligSelect(q: PromiseLike<{ data: unknown; error: { code?: string } | null }>): Promise<{ datum?: string; aangemaakt_op?: string }[]> {
  const res = await q
  if (res.error) return []
  return (res.data as { datum?: string; aangemaakt_op?: string }[]) ?? []
}

interface Activiteit {
  activeDates: Set<string>
  tijden: string[] // HH:MM van recente activiteit (voor het slimme moment)
}

async function verzamelActiviteit(db: SupabaseClient, userId: string): Promise<Activiteit> {
  const sinds = datumMinusDagenNL(HORIZON - 1)
  const [stemming, slaap, snelcheck, gewoonte] = await Promise.all([
    veiligSelect(db.from('stemming_logs').select('aangemaakt_op').eq('user_id', userId).gte('aangemaakt_op', sinds)),
    veiligSelect(db.from('slaap_logs').select('datum').eq('user_id', userId).gte('datum', sinds)),
    veiligSelect(db.from('snelcheck_logs').select('datum').eq('user_id', userId).gte('datum', sinds)),
    veiligSelect(db.from('gewoonte_logs').select('datum').eq('user_id', userId).gte('datum', sinds)),
  ])

  const activeDates = new Set<string>()
  const tijden: string[] = []
  for (const r of stemming) {
    if (r.aangemaakt_op) {
      activeDates.add(toDateString(r.aangemaakt_op))
      const t = tijdVanTimestampNL(r.aangemaakt_op)
      if (t) tijden.push(t)
    }
  }
  for (const r of [...slaap, ...snelcheck, ...gewoonte]) {
    if (r.datum) activeDates.add(toDateString(r.datum))
  }
  return { activeDates, tijden }
}

const DEFAULT_VOORKEUREN: PushVoorkeuren = {
  checkinAan: true, streakAan: true, vitaWeekAan: true,
  stiltetijdStart: '22:00', stiltetijdEind: '08:00', maxPerDag: 2,
}

interface VoorkeurRij {
  user_id: string
  checkin_aan: boolean
  streak_aan: boolean
  vita_week_aan: boolean
  stiltetijd_start: string
  stiltetijd_eind: string
  max_per_dag: number
}

function naarVoorkeuren(rij: VoorkeurRij | undefined): PushVoorkeuren {
  if (!rij) return DEFAULT_VOORKEUREN
  return {
    checkinAan: rij.checkin_aan,
    streakAan: rij.streak_aan,
    vitaWeekAan: rij.vita_week_aan,
    stiltetijdStart: (rij.stiltetijd_start ?? '22:00').slice(0, 5),
    stiltetijdEind: (rij.stiltetijd_eind ?? '08:00').slice(0, 5),
    maxPerDag: rij.max_per_dag,
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET ?? ''
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const nu = nuNL()

  // Kandidaten: iedereen met minstens één apparaat-token.
  const { data: tokenRijen } = await db.from('push_tokens').select('user_id, token, platform')
  const tokensPerUser = new Map<string, { token: string; platform: string }[]>()
  for (const r of (tokenRijen ?? []) as { user_id: string; token: string; platform: string }[]) {
    const lijst = tokensPerUser.get(r.user_id) ?? []
    lijst.push({ token: r.token, platform: r.platform })
    tokensPerUser.set(r.user_id, lijst)
  }
  if (tokensPerUser.size === 0) return NextResponse.json({ ok: true, kandidaten: 0, verstuurd: 0 })

  const userIds = [...tokensPerUser.keys()]
  const { data: voorkeurRijen } = await db.from('push_voorkeuren').select('*').in('user_id', userIds)
  const voorkeurPerUser = new Map<string, VoorkeurRij>()
  for (const r of (voorkeurRijen ?? []) as VoorkeurRij[]) voorkeurPerUser.set(r.user_id, r)

  let totaalVerstuurd = 0
  let bereikt = 0

  for (const userId of userIds) {
    const geplande = await planVoorGebruiker(db, userId, nu, voorkeurPerUser.get(userId))
    if (geplande.length === 0) continue

    const doelen = tokensPerUser.get(userId) ?? []
    for (const melding of geplande) {
      const res = await verzendPush(doelen, { titel: melding.titel, tekst: melding.tekst })
      if (res.verstuurd > 0) {
        totaalVerstuurd += res.verstuurd
        bereikt++
        await db.from('push_log').insert({ user_id: userId, type: melding.type, datum: nu.datum })
      }
      if (res.ongeldigeTokens.length > 0) {
        await db.from('push_tokens').delete().eq('user_id', userId).in('token', res.ongeldigeTokens)
      }
    }
  }

  return NextResponse.json({ ok: true, kandidaten: userIds.length, bereikt, verstuurd: totaalVerstuurd })
}

async function planVoorGebruiker(db: SupabaseClient, userId: string, nu: NuNL, voorkeurRij: VoorkeurRij | undefined): Promise<GeplandeMelding[]> {
  const { activeDates, tijden } = await verzamelActiviteit(db, userId)
  const streak = berekenStreak(activeDates, datumMinusDagenNL, HORIZON)
  const reedsVandaagActief = activeDates.has(nu.datum)

  const { data: logVandaag } = await db
    .from('push_log').select('type').eq('user_id', userId).eq('datum', nu.datum)
  const laatstVerzonden: Partial<Record<MeldingType, string | null>> = {}
  for (const r of (logVandaag ?? []) as { type: MeldingType }[]) laatstVerzonden[r.type] = nu.datum

  return kiesMeldingen({
    nuMinuten: nu.nuMinuten,
    datum: nu.datum,
    weekdag: nu.weekdag,
    voorkeuren: naarVoorkeuren(voorkeurRij),
    reedsVandaagActief,
    streak,
    slimMomentCheckin: slimVerzendMoment(tijden, { standaard: '20:00' }),
    laatstVerzonden,
    reedsVerzondenVandaag: (logVandaag ?? []).length,
  })
}
