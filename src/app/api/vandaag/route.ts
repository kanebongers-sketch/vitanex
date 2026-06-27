import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase-admin'
import { vandaagNL, datumMinusDagenNL, dagstartUtcNL, huidigUurNL } from '@/lib/date-nl'

const DOEL_WATER_ML = 2000

function bepaalSuggestie(uur: number): string {
  if (uur < 10) return 'Begin je dag rustig: log je slaap, drink wat water en noteer je stemming.'
  if (uur < 13) return 'Goed moment voor een korte meditatie of focussessie voor de lunch.'
  if (uur < 17) return 'Beweeg even tussendoor en check je dankbaarheidsmoment.'
  if (uur < 20) return 'Bijna klaar met je dag — vul nog je dankbaarheid en weekcheck-in in.'
  return 'Nog wat te doen? Log je dag en reflecteer op je welzijn.'
}

function defaultChecklist() {
  return [
    {
      id: 'water',
      icoon: '💧',
      titel: 'Water drinken',
      status: 'open',
      detail: 'Nog niet gestart',
      url: '/water',
    },
    {
      id: 'stemming',
      icoon: '😊',
      titel: 'Hoe voel je je?',
      status: 'open',
      detail: 'Nog niet gelogd',
      url: '/stemming',
    },
    {
      id: 'slaap',
      icoon: '😴',
      titel: 'Gisteravond geslapen',
      status: 'open',
      detail: 'Log je slaap',
      url: '/slaap',
    },
    {
      id: 'sport',
      icoon: '🏃',
      titel: 'Bewegen',
      status: 'open',
      detail: 'Nog niet gelogd',
      url: '/sport',
    },
    {
      id: 'meditatie',
      icoon: '🧘',
      titel: 'Meditatie / ademhaling',
      status: 'open',
      detail: '5 min mediteren',
      url: '/meditatie',
    },
    {
      id: 'dankbaarheid',
      icoon: '✍️',
      titel: 'Dankbaarheid',
      status: 'open',
      detail: 'Schrijf 3 dingen',
      url: '/dankbaarheid',
    },
  ]
}

export async function GET(req: NextRequest) {
  // Auth check
  const user = await getAuthenticatedUser(req)
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

  const admin = createAdminClient()
  const vandaag = vandaagNL()
  const gisteren = datumMinusDagenNL(1)
  const dagstartUtc = dagstartUtcNL()

  const uur = huidigUurNL()
  const suggestie = bepaalSuggestie(uur)

  let waterResult, stemmingResult, slaapResult, sportResult, focusResult, dankbaarheidResult, meditatieMorgenResult

  try {
    ;[
      waterResult,
      stemmingResult,
      slaapResult,
      sportResult,
      focusResult,
      dankbaarheidResult,
      meditatieMorgenResult,
    ] = await Promise.all([
      // water vandaag
      admin
        .from('water_logs')
        .select('ml')
        .eq('user_id', user.id)
        .eq('datum', vandaag),

      // stemming vandaag (aangemaakt_op is timestamp)
      admin
        .from('stemming_logs')
        .select('stemming, energie, aangemaakt_op')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', dagstartUtc)
        .order('aangemaakt_op', { ascending: false })
        .limit(1),

      // slaap gisteravond
      admin
        .from('slaap_logs')
        .select('uren_slaap, datum')
        .eq('user_id', user.id)
        .eq('datum', gisteren)
        .limit(1),

      // sport vandaag — training_logs is de schrijftabel
      admin
        .from('training_logs')
        .select('id, datum')
        .eq('user_id', user.id)
        .eq('datum', vandaag)
        .limit(1),

      // focus vandaag (minuten)
      admin
        .from('focus_timer_logs')
        .select('duur_minuten')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', dagstartUtc),

      // dankbaarheid vandaag
      admin
        .from('dankbaarheid_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('datum', vandaag)
        .limit(1),

      // meditatie/ademhaling vandaag (ademhaling_sessies als indicator)
      admin
        .from('ademhaling_sessies')
        .select('id, duur_seconden')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', dagstartUtc)
        .limit(10),
    ])
  } catch (err) {
    console.error('[api/vandaag] DB fout:', err)
    const checklist = defaultChecklist()
    return NextResponse.json(
      {
        checklist,
        scores: {
          gedaan: 0,
          totaal: checklist.length,
          score_pct: 0,
          water_ml: 0,
          water_doel_ml: DOEL_WATER_ML,
          slaap_uren: null,
          stemming_waarde: null,
          focus_minuten: 0,
          meditatie_minuten: 0,
        },
        suggestie,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' },
      }
    )
  }

  // Water
  const water_ml = (waterResult.data ?? []).reduce((s, r) => s + (r.ml ?? 0), 0)
  const water_gedaan = water_ml >= DOEL_WATER_ML * 0.5

  // Stemming
  const stemmingLog = stemmingResult.data?.[0] ?? null
  const stemming_gedaan = !!stemmingLog
  const stemming_tijdstip = stemmingLog
    ? new Date(stemmingLog.aangemaakt_op).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null
  const stemming_waarde = stemmingLog?.stemming ?? null

  // Slaap
  const slaapLog = slaapResult.data?.[0] ?? null
  const slaap_gedaan = !!slaapLog
  const slaap_uren = slaapLog?.uren_slaap ?? null

  // Sport
  const sport_gedaan = (sportResult.data?.length ?? 0) > 0

  // Focus
  const focus_minuten = (focusResult.data ?? []).reduce((s, r) => s + (r.duur_minuten ?? 0), 0)
  const focus_gedaan = focus_minuten >= 5

  // Dankbaarheid
  const dankbaarheid_gedaan = (dankbaarheidResult.data?.length ?? 0) > 0

  // Meditatie/ademhaling
  const meditatie_seconden = (meditatieMorgenResult.data ?? []).reduce(
    (s, r) => s + (r.duur_seconden ?? 0),
    0
  )
  const meditatie_minuten = Math.round(meditatie_seconden / 60)
  const meditatie_gedaan = meditatie_seconden >= 60

  // Checklist samenstellen — 6 items, gelijk aan de 6 taart-segmenten in ACTIVITEITEN
  const checklist = [
    {
      id: 'water',
      icoon: '💧',
      titel: 'Water drinken',
      status: water_gedaan ? 'gedaan' : 'open',
      detail: water_ml > 0
        ? `${water_ml} ml gedronken van ${DOEL_WATER_ML} ml doel`
        : 'Nog niet gestart',
      url: '/water',
    },
    {
      id: 'stemming',
      icoon: '😊',
      titel: 'Hoe voel je je?',
      status: stemming_gedaan ? 'gedaan' : 'open',
      detail: stemming_gedaan
        ? `Gelogd om ${stemming_tijdstip ?? '??:??'}${stemming_waarde != null ? ` — stemming ${stemming_waarde}/10` : ''}`
        : 'Nog niet gelogd',
      url: '/stemming',
    },
    {
      id: 'slaap',
      icoon: '😴',
      titel: 'Gisteravond geslapen',
      status: slaap_gedaan ? 'gedaan' : 'open',
      detail: slaap_gedaan && slaap_uren != null ? `${slaap_uren} uur geslapen` : 'Log je slaap',
      url: '/slaap',
    },
    {
      id: 'sport',
      icoon: '🏃',
      titel: 'Bewegen',
      status: sport_gedaan ? 'gedaan' : 'open',
      detail: sport_gedaan ? 'Gedaan! Goed bezig.' : 'Nog niet gelogd',
      url: '/sport',
    },
    {
      id: 'meditatie',
      icoon: '🧘',
      titel: 'Meditatie / ademhaling',
      status: meditatie_gedaan ? 'gedaan' : 'open',
      detail: meditatie_gedaan
        ? `${meditatie_minuten} min gedaan`
        : '5 min mediteren',
      url: '/meditatie',
    },
    {
      id: 'dankbaarheid',
      icoon: '✍️',
      titel: 'Dankbaarheid',
      status: dankbaarheid_gedaan ? 'gedaan' : 'open',
      detail: dankbaarheid_gedaan ? 'Geschreven' : 'Schrijf 3 dingen',
      url: '/dankbaarheid',
    },
  ]

  const gedaan = checklist.filter(t => t.status === 'gedaan').length
  const totaal = checklist.length
  // Bescherm tegen NaN bij deling door nul
  const score_pct = totaal > 0 ? Math.round((gedaan / totaal) * 100) : 0

  return NextResponse.json(
    {
      checklist,
      scores: {
        gedaan,
        totaal,
        score_pct,
        water_ml,
        water_doel_ml: DOEL_WATER_ML,
        slaap_uren,
        stemming_waarde,
        focus_minuten,
        meditatie_minuten,
      },
      suggestie,
    },
    {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=30' },
    }
  )
}
