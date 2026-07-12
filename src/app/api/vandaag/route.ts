import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { vandaagNL, datumMinusDagenNL, dagstartUtcNL, huidigUurNL } from '@/lib/utils/date-nl'

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

  // Elke detectie-query apart afhandelen (allSettled): één falende query mag
  // NOOIT de hele checklist op 'open' zetten. Tabellen afgestemd op waar elke
  // activiteit écht naartoe schrijft.
  const settled = await Promise.allSettled([
    // 0 water vandaag (water_logs)
    admin.from('water_logs').select('ml').eq('user_id', user.id).eq('datum', vandaag),
    // 1 stemming vandaag (stemming_logs, aangemaakt_op = timestamp)
    admin.from('stemming_logs').select('stemming, energie, aangemaakt_op').eq('user_id', user.id).gte('aangemaakt_op', dagstartUtc).order('aangemaakt_op', { ascending: false }).limit(1),
    // 2 slaap vandaag (slaap_logs)
    admin.from('slaap_logs').select('uren_slaap, datum').eq('user_id', user.id).eq('datum', vandaag).limit(1),
    // 3 bewegen vandaag (training_logs)
    admin.from('training_logs').select('id, datum').eq('user_id', user.id).eq('datum', vandaag).limit(1),
    // 4 focus vandaag (focus_timer_logs, datum)
    admin.from('focus_timer_logs').select('duur_minuten, type').eq('user_id', user.id).eq('datum', vandaag),
    // 5 dankbaarheid vandaag (dankbaarheid_logs)
    admin.from('dankbaarheid_logs').select('id').eq('user_id', user.id).eq('datum', vandaag).limit(1),
    // 6 meditatie vandaag (focus_timer_logs, type 'adem' — de meditatie-pagina schrijft hier)
    admin.from('focus_timer_logs').select('duur_minuten').eq('user_id', user.id).eq('datum', vandaag).eq('type', 'adem'),
    // 7 ademhaling vandaag (focus_sessies — de ademhaling-pagina schrijft hier)
    admin.from('focus_sessies').select('id, duur_minuten, aangemaakt_op').eq('user_id', user.id).gte('aangemaakt_op', dagstartUtc),
  ])

  const rows = (i: number): Array<Record<string, unknown>> => {
    const r = settled[i]
    if (r.status !== 'fulfilled') {
      console.error('[api/vandaag] query', i, 'faalde:', r.reason)
      return []
    }
    const v = r.value as { data?: unknown[] | null }
    return (v?.data as Array<Record<string, unknown>> | null) ?? []
  }

  // Water
  const water_ml = rows(0).reduce((s, r) => s + (Number(r.ml) || 0), 0)
  const water_gedaan = water_ml >= DOEL_WATER_ML * 0.5

  // Stemming
  const stemmingLog = rows(1)[0] ?? null
  const stemming_gedaan = !!stemmingLog
  const stemming_tijdstip = stemmingLog
    ? new Date(String(stemmingLog.aangemaakt_op)).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    : null
  const stemming_waarde = (stemmingLog?.stemming as number | undefined) ?? null

  // Slaap
  const slaapLog = rows(2)[0] ?? null
  const slaap_gedaan = !!slaapLog
  const slaap_uren = (slaapLog?.uren_slaap as number | undefined) ?? null

  // Bewegen
  const sport_gedaan = rows(3).length > 0

  // Focus (minuten, ademhaling-type uitgezonderd)
  const focus_minuten = rows(4).filter(r => r.type !== 'adem').reduce((s, r) => s + (Number(r.duur_minuten) || 0), 0)

  // Dankbaarheid
  const dankbaarheid_gedaan = rows(5).length > 0

  // Meditatie / ademhaling — gedaan als óf een meditatie (focus_timer_logs type 'adem')
  // óf een ademhalingssessie (focus_sessies) vandaag is gelogd.
  const meditatie_minuten =
    rows(6).reduce((s, r) => s + (Number(r.duur_minuten) || 0), 0) +
    rows(7).reduce((s, r) => s + (Number(r.duur_minuten) || 0), 0)
  const meditatie_gedaan = rows(6).length > 0 || rows(7).length > 0

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
      // Per-gebruiker dagdata moet vers zijn: na het loggen van een activiteit
      // moet de checklist meteen bijwerken (net als de week-ringen). Geen cache.
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
