import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/supabase-admin'
import { datumMinusDagenNL, vandaagNL } from '@/lib/utils/date-nl'
import { getPlanVoorUser } from '@/lib/plan/plan-server'
import { heeftFeature } from '@/lib/plan/plan'

export const dynamic = 'force-dynamic'

const DAGEN_NL = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']

function gemiddelde(arr: number[]): number | null {
  if (!arr.length) return null
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

function formatDelta(nu: number | null, vorig: number | null): string | null {
  if (nu === null || vorig === null) return null
  const d = Math.round((nu - vorig) * 10) / 10
  if (d === 0) return null
  return d > 0 ? `+${d}` : `${d}`
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 })

    const admin = createAdminClient()

    const plan = await getPlanVoorUser(admin, user.id)
    if (!heeftFeature(plan, 'persoonlijke_patronen')) {
      return NextResponse.json(
        { error: 'Persoonlijke patronen zijn onderdeel van het Groei-plan.', code: 'premium' },
        { status: 403 },
      )
    }

    const vandaag = vandaagNL()
    const dertigDagenGeleden = datumMinusDagenNL(29)
    const zestigDagenGeleden = datumMinusDagenNL(59)

    // Haal alle relevante data op (laatste 60 dagen voor vergelijking)
    const [stemmingRes, slaapRes, sportRes, waterRes] = await Promise.all([
      admin
        .from('stemming_logs')
        .select('datum, stemming, energie, aangemaakt_op')
        .eq('user_id', user.id)
        .gte('datum', zestigDagenGeleden)
        .order('datum', { ascending: true }),

      admin
        .from('slaap_logs')
        .select('datum, uren_slaap, kwaliteit')
        .eq('user_id', user.id)
        .gte('datum', zestigDagenGeleden)
        .order('datum', { ascending: true }),

      admin
        .from('sport_logs')
        .select('aangemaakt_op')
        .eq('user_id', user.id)
        .gte('aangemaakt_op', `${zestigDagenGeleden}T00:00:00`),

      admin
        .from('water_logs')
        .select('datum, ml')
        .eq('user_id', user.id)
        .gte('datum', zestigDagenGeleden),
    ])

    const stemmingLogs = stemmingRes.data ?? []
    const slaapLogs = slaapRes.data ?? []
    const sportLogs = sportRes.data ?? []
    const waterLogs = waterRes.data ?? []

    // Bouw date-sets voor snelle lookups
    const sportDagen = new Set(sportLogs.map(s => s.aangemaakt_op.slice(0, 10)))

    // Water per dag aggregeren
    const waterPerDag: Record<string, number> = {}
    for (const w of waterLogs) {
      waterPerDag[w.datum] = (waterPerDag[w.datum] ?? 0) + (w.ml ?? 0)
    }

    // Splits in laatste 30 dagen vs vorige 30 dagen
    const recentStemming = stemmingLogs.filter(s => s.datum >= dertigDagenGeleden)
    const ouderStemming = stemmingLogs.filter(s => s.datum < dertigDagenGeleden)
    const recentSlaap = slaapLogs.filter(s => s.datum >= dertigDagenGeleden)
    const ouderSlaap = slaapLogs.filter(s => s.datum < dertigDagenGeleden)

    // ── PATROON 1: Sport vs. stemming ────────────────────────────
    const stemmingMetSport = recentStemming
      .filter(s => sportDagen.has(s.datum))
      .map(s => s.stemming)
      .filter((v): v is number => typeof v === 'number')

    const stemmingZonderSport = recentStemming
      .filter(s => !sportDagen.has(s.datum))
      .map(s => s.stemming)
      .filter((v): v is number => typeof v === 'number')

    const avgMetSport = gemiddelde(stemmingMetSport)
    const avgZonderSport = gemiddelde(stemmingZonderSport)

    // ── PATROON 2: Slaap > 7u vs. stemming ───────────────────────
    const goedGeslapenDagen = new Set(
      recentSlaap.filter(s => s.uren_slaap >= 7).map(s => s.datum)
    )
    const slaaapTekortDagen = new Set(
      recentSlaap.filter(s => s.uren_slaap < 6).map(s => s.datum)
    )

    const stemmingNaGoedeslaap = recentStemming
      .filter(s => goedGeslapenDagen.has(s.datum))
      .map(s => s.stemming)
      .filter((v): v is number => typeof v === 'number')

    const stemmingNaSlaaptekort = recentStemming
      .filter(s => slaaapTekortDagen.has(s.datum))
      .map(s => s.stemming)
      .filter((v): v is number => typeof v === 'number')

    const avgNaGoedeslaap = gemiddelde(stemmingNaGoedeslaap)
    const avgNaSlaaptekort = gemiddelde(stemmingNaSlaaptekort)

    // ── PATROON 3: Beste dag van de week ─────────────────────────
    const stemmingPerDag: Record<number, number[]> = {}
    for (const s of recentStemming) {
      if (typeof s.stemming !== 'number') continue
      const dag = new Date(s.datum + 'T12:00:00').getDay()
      if (!stemmingPerDag[dag]) stemmingPerDag[dag] = []
      stemmingPerDag[dag].push(s.stemming)
    }

    let besteDagIndex = -1
    let besteDagGem = -1
    for (const [dagStr, waarden] of Object.entries(stemmingPerDag)) {
      if (waarden.length >= 2) {
        const gem = waarden.reduce((a, b) => a + b, 0) / waarden.length
        if (gem > besteDagGem) {
          besteDagGem = gem
          besteDagIndex = parseInt(dagStr, 10)
        }
      }
    }

    // ── PATROON 4: Water & energie ────────────────────────────────
    const energieMetWater = recentStemming
      .filter(s => (waterPerDag[s.datum] ?? 0) >= 1500)
      .map(s => s.energie)
      .filter((v): v is number => typeof v === 'number')

    const energieZonderWater = recentStemming
      .filter(s => (waterPerDag[s.datum] ?? 0) < 1000)
      .map(s => s.energie)
      .filter((v): v is number => typeof v === 'number')

    const avgEnergieMetWater = gemiddelde(energieMetWater)
    const avgEnergieZonderWater = gemiddelde(energieZonderWater)

    // ── TREND: 30d vs vorige 30d ──────────────────────────────────
    const recentStemmingScores = recentStemming
      .map(s => s.stemming)
      .filter((v): v is number => typeof v === 'number')

    const ouderStemmingScores = ouderStemming
      .map(s => s.stemming)
      .filter((v): v is number => typeof v === 'number')

    const recentSlaapUren = recentSlaap
      .map(s => s.uren_slaap)
      .filter((v): v is number => typeof v === 'number')

    const ouderSlaapUren = ouderSlaap
      .map(s => s.uren_slaap)
      .filter((v): v is number => typeof v === 'number')

    const gemStemmingNu = gemiddelde(recentStemmingScores)
    const gemStemmingVorig = gemiddelde(ouderStemmingScores)
    const gemSlaapNu = gemiddelde(recentSlaapUren)
    const gemSlaapVorig = gemiddelde(ouderSlaapUren)

    // ── MIJLPALEN ─────────────────────────────────────────────────
    const totaalCheckins = stemmingLogs.length
    const mijlpalen = [
      { bereikt: totaalCheckins >= 1,  label: 'Eerste check-in', icon: 'milestone-1',  doel: 1 },
      { bereikt: totaalCheckins >= 7,  label: '7 check-ins',     icon: 'milestone-7',  doel: 7 },
      { bereikt: totaalCheckins >= 21, label: '21 check-ins',    icon: 'milestone-21', doel: 21 },
      { bereikt: totaalCheckins >= 50, label: '50 check-ins',    icon: 'milestone-50', doel: 50 },
    ]

    // ── BOUW PATRONEN LIJST ───────────────────────────────────────
    type Patroon = {
      id: string
      icon: string
      titel: string
      beschrijving: string
      waarde?: string
      vergelijking?: string
      kleur: string
      betrouwbaarheid: 'laag' | 'middel' | 'hoog'
      datapunten: number
    }

    const patronen: Patroon[] = []

    // Sport patroon
    if (avgMetSport !== null && avgZonderSport !== null && stemmingMetSport.length >= 2) {
      const verschil = Math.round((avgMetSport - avgZonderSport) * 10) / 10
      if (Math.abs(verschil) >= 0.2) {
        patronen.push({
          id: 'sport_stemming',
          icon: 'sport',
          titel: verschil > 0
            ? 'Sport maakt jou gelukkiger'
            : 'Sport en stemming bij jou ontkoppeld',
          beschrijving: verschil > 0
            ? `Op dagen dat je beweegt scoort jouw stemming gemiddeld ${verschil} punten hoger (${avgMetSport}/5 vs ${avgZonderSport}/5).`
            : `Je stemmingsscores verschillen weinig op sport- vs. rustdagen (${avgMetSport}/5 vs ${avgZonderSport}/5).`,
          waarde: verschil > 0 ? `+${verschil} stemming` : `${verschil} stemming`,
          kleur: verschil > 0 ? 'var(--mf-green)' : 'var(--mf-amber)',
          betrouwbaarheid: stemmingMetSport.length >= 5 ? 'hoog' : 'middel',
          datapunten: stemmingMetSport.length + stemmingZonderSport.length,
        })
      }
    }

    // Slaap patroon
    if (avgNaGoedeslaap !== null && avgNaSlaaptekort !== null && stemmingNaGoedeslaap.length >= 2) {
      const verschil = Math.round((avgNaGoedeslaap - avgNaSlaaptekort) * 10) / 10
      if (verschil > 0.2) {
        patronen.push({
          id: 'slaap_stemming',
          icon: 'slaap',
          titel: 'Goede slaap = betere dag',
          beschrijving: `Na 7+ uur slaap is jouw stemming gemiddeld ${verschil} punten hoger (${avgNaGoedeslaap}/5). Na minder dan 6 uur slaap zak je naar ${avgNaSlaaptekort}/5.`,
          waarde: `+${verschil} stemming`,
          vergelijking: `7u+ slaap → ${avgNaGoedeslaap}/5 · <6u slaap → ${avgNaSlaaptekort}/5`,
          kleur: 'var(--mf-blue)',
          betrouwbaarheid: stemmingNaGoedeslaap.length >= 4 ? 'hoog' : 'middel',
          datapunten: stemmingNaGoedeslaap.length + stemmingNaSlaaptekort.length,
        })
      }
    }

    // Beste dag patroon
    if (besteDagIndex !== -1 && besteDagGem > 0) {
      const dagNaam = DAGEN_NL[besteDagIndex]
      patronen.push({
        id: 'beste_dag',
        icon: 'kalender',
        titel: `${dagNaam.charAt(0).toUpperCase() + dagNaam.slice(1)} is jouw beste dag`,
        beschrijving: `Je gemiddelde stemming op ${dagNaam} is ${Math.round(besteDagGem * 10) / 10}/5 — consistent je hoogste van de week. Plan uitdagende taken en gesprekken op ${dagNaam}.`,
        waarde: `${Math.round(besteDagGem * 10) / 10}/5`,
        kleur: 'var(--mf-purple)',
        betrouwbaarheid: 'middel',
        datapunten: (stemmingPerDag[besteDagIndex] ?? []).length,
      })
    }

    // Water & energie patroon
    if (avgEnergieMetWater !== null && avgEnergieZonderWater !== null && energieMetWater.length >= 2) {
      const verschil = Math.round((avgEnergieMetWater - avgEnergieZonderWater) * 10) / 10
      if (verschil > 0.2) {
        patronen.push({
          id: 'water_energie',
          icon: 'water',
          titel: 'Gehydrateerd = meer energie',
          beschrijving: `Op dagen dat je 1,5L+ drinkt, is je energieniveau gemiddeld ${verschil} punten hoger (${avgEnergieMetWater}/5 vs ${avgEnergieZonderWater}/5).`,
          waarde: `+${verschil} energie`,
          kleur: 'var(--mf-blue)',
          betrouwbaarheid: energieMetWater.length >= 4 ? 'hoog' : 'middel',
          datapunten: energieMetWater.length + energieZonderWater.length,
        })
      }
    }

    // Trend patroon (30d vergelijking)
    if (gemStemmingNu !== null && gemStemmingVorig !== null) {
      const delta = formatDelta(gemStemmingNu, gemStemmingVorig)
      if (delta) {
        const stijgt = gemStemmingNu > gemStemmingVorig
        patronen.push({
          id: 'stemming_trend',
          icon: stijgt ? 'trend-up' : 'trend-down',
          titel: stijgt ? 'Je stemming verbetert' : 'Je stemming daalt',
          beschrijving: stijgt
            ? `De afgelopen 30 dagen scoorde je gemiddeld ${gemStemmingNu}/5 — dat is ${Math.abs(gemStemmingNu - (gemStemmingVorig ?? 0)).toFixed(1)} punt meer dan de 30 dagen daarvoor (${gemStemmingVorig}/5).`
            : `De afgelopen 30 dagen scoorde je gemiddeld ${gemStemmingNu}/5. De vorige periode was dit ${gemStemmingVorig}/5. Let op signalen van vermoeidheid of stress.`,
          waarde: `${delta} stemming`,
          kleur: stijgt ? 'var(--mf-green)' : 'var(--mf-red)',
          betrouwbaarheid: recentStemmingScores.length >= 7 ? 'hoog' : 'middel',
          datapunten: recentStemmingScores.length,
        })
      }
    }

    return NextResponse.json({
      patronen,
      samenvatting: {
        stemming_30d_gem: gemStemmingNu,
        stemming_30d_delta: formatDelta(gemStemmingNu, gemStemmingVorig),
        slaap_30d_gem: gemSlaapNu,
        slaap_30d_delta: formatDelta(gemSlaapNu, gemSlaapVorig),
        totaal_checkins: totaalCheckins,
        sport_dagen_30d: recentStemming.filter(s => sportDagen.has(s.datum)).length,
      },
      mijlpalen,
      vandaag,
    })
  } catch (err) {
    console.error('[patronen GET]', err)
    return NextResponse.json({ error: 'Er is een fout opgetreden.' }, { status: 500 })
  }
}
