// ─── MentaForce — pijler-aggregatie (server) ────────────────────────────────
// Bouwt uit de échte databronnen de 6 canonieke pijler-scores + wellbeing + trend.
// Leunt volledig op het pure scoremodel (./score) — hier zit alleen de mapping
// van tabellen naar genormaliseerde bronnen. Eén bron van waarheid voor Home,
// de pijler-detailpagina's, Progress en Vita.
//
// Ontwerpprincipes:
//  • Eerlijk: een pijler zonder data blijft `null` (nooit een verzonnen getal).
//  • Robuust: elke bron is optioneel; ontbrekende bronnen worden overgeslagen.
//  • Check-in is het weekanker; dagelijkse logs verfijnen. De check-in-domeinen
//    focus/balans/motivatie horen NIET bij de 6 pijlers (dat is werkbeleving) en
//    worden hier bewust genegeerd.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PijlerKey } from './pijlers'
import { PIJLER_KEYS } from './pijlers'
import {
  vanSchaal1tot5,
  vanStress1tot10,
  vanCheckin4tot20,
  vanSlaapUren,
  vanDoelRatio,
  pijlerScore,
  wellbeingScore,
  berekenTrend,
  type Bron,
  type Trend,
  type Wellbeing,
} from './score'

// Standaard dagdoelen als de gebruiker (nog) geen eigen doel heeft ingesteld.
const DEFAULT_STAPPEN_DOEL = 7000
const DEFAULT_WATER_DOEL_ML = 2000
const TRAINING_MIN_PER_WEEK_DOEL = 150 // WHO-richtlijn matige inspanning

export interface PijlerResultaat {
  key: PijlerKey
  /** Score over de huidige 7 dagen (0–100) of null bij geen data. */
  score: number | null
  /** Score over de vorige 7 dagen, voor de trend. */
  vorigeScore: number | null
  trend: Trend
  /** Welke bronnen daadwerkelijk bijdroegen (transparantie/eerlijkheid). */
  bronnen: string[]
}

export interface PijlerOverzicht {
  pijlers: PijlerResultaat[]
  wellbeing: Wellbeing
}

// ── Interne rij-types (alleen wat we selecteren) ────────────────────────────
interface DatumRow { datum: string }
interface SlaapRow extends DatumRow { uren_slaap: number | string | null; kwaliteit: number | null }
interface StressRow { stress_niveau: number | null; aangemaakt_op: string }
interface StemmingRow extends DatumRow { stemming: number | null; energie: number | null }
interface StappenRow extends DatumRow { stappen: number | null }
interface NativeRow extends DatumRow { stappen: number | null; slaap_minuten: number | null }
interface TrainingRow extends DatumRow { duur_minuten: number | null }
interface WaterRow extends DatumRow { ml: number | null }
interface CheckinRow { scores: Record<string, number> | null; aangemaakt_op: string }
interface DoelRow { stappen_doel: number | null; water_doel_ml: number | null }

// ── Datumhelpers ────────────────────────────────────────────────────────────
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}
function dagenGeleden(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return ymd(d)
}

/** Splitst een datum in de huidige (laatste 7d) of vorige (7–13d) week, of null. */
function venster(datum: string, grensHuidig: string, grensVorig: string): 'huidig' | 'vorig' | null {
  if (datum >= grensHuidig) return 'huidig'
  if (datum >= grensVorig) return 'vorig'
  return null
}

function num(v: number | string | null | undefined): number {
  const n = typeof v === 'string' ? parseFloat(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : Number.NaN
}

function gemiddelde(waarden: number[]): number {
  const geldig = waarden.filter((v) => Number.isFinite(v))
  if (geldig.length === 0) return Number.NaN
  return geldig.reduce((a, b) => a + b, 0) / geldig.length
}

// ── Pijler-berekening per venster ───────────────────────────────────────────

interface Vensterdata {
  slaap: SlaapRow[]
  stress: StressRow[]
  stemming: StemmingRow[]
  stappen: number[] // reeds gecombineerd (dagmetingen + native), per dag
  training: TrainingRow[]
  water: WaterRow[]
  voedingDagen: Set<string>
  checkin: CheckinRow | null
}

/** Bouwt de bron-lijst per pijler en levert score + welke bronnen bijdroegen. */
function leesCheckin(scores: Record<string, number> | null, key: string): number | null {
  const v = scores?.[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function scorePijlers(
  data: Vensterdata,
  stappenDoel: number,
  waterDoel: number,
): Record<PijlerKey, { score: number | null; bronnen: string[] }> {
  const ciEnergie = leesCheckin(data.checkin?.scores ?? null, 'energie')
  const ciSlaap = leesCheckin(data.checkin?.scores ?? null, 'slaap')

  // Normaliseer UITSLUITEND bij echte data. Ontbrekende data → null, nooit een
  // verzonnen 0/50 (eerlijkheids-merkregel; lost de readiness-basisbug op).
  const norm = (ruw: number, normFn: (v: number) => number, gewicht = 1): Bron | null =>
    Number.isFinite(ruw) ? { waarde: normFn(ruw), gewicht } : null

  const bouw = (bronnen: Array<{ naam: string; bron: Bron | null }>) => {
    const gebruikt = bronnen.filter((b): b is { naam: string; bron: Bron } => b.bron !== null)
    const score = pijlerScore(gebruikt.map((b) => b.bron))
    return { score, bronnen: score === null ? [] : gebruikt.map((b) => b.naam) }
  }

  // Ruwe (nog niet genormaliseerde) gemiddelden per bron.
  const gemEnergie = gemiddelde(data.stemming.map((r) => num(r.energie)))
  const gemSlaapUren = gemiddelde(data.slaap.map((r) => num(r.uren_slaap)))
  const gemSlaapKwal = gemiddelde(data.slaap.map((r) => num(r.kwaliteit)))
  const gemStress = gemiddelde(data.stress.map((r) => num(r.stress_niveau)))
  const gemStemming = gemiddelde(data.stemming.map((r) => num(r.stemming)))
  const gemStappen = gemiddelde(data.stappen)
  const trainingMin = data.training.reduce((s, r) => s + (num(r.duur_minuten) || 0), 0)
  const gemWater = gemiddelde(mapDagGemiddelde(data.water.map((r) => ({ datum: r.datum, waarde: num(r.ml) }))))

  // Energie — dagelijkse energie (1–5) + check-in energie (4–20)
  const energie = bouw([
    { naam: 'Dagelijkse energie', bron: norm(gemEnergie, vanSchaal1tot5) },
    { naam: 'Weekcheck-in', bron: ciEnergie != null ? norm(ciEnergie, vanCheckin4tot20) : null },
  ])

  // Slaap — uren (doelcurve, zwaarst) + kwaliteit (1–5) + check-in
  const slaap = bouw([
    { naam: 'Slaapduur', bron: norm(gemSlaapUren, vanSlaapUren, 2) },
    { naam: 'Slaapkwaliteit', bron: norm(gemSlaapKwal, vanSchaal1tot5) },
    { naam: 'Weekcheck-in', bron: ciSlaap != null ? norm(ciSlaap, vanCheckin4tot20) : null },
  ])

  // Stress — stress_logs (1–10, geïnverteerd). Check-in bewust weggelaten
  // (oriëntatie van de vlak-score is dubbelzinnig; daglog is eenduidig).
  const stress = bouw([
    { naam: 'Stresslogs', bron: norm(gemStress, vanStress1tot10) },
  ])

  // Stemming — stemming_logs.stemming (1–5)
  const stemming = bouw([
    { naam: 'Stemming-logs', bron: norm(gemStemming, vanSchaal1tot5) },
  ])

  // Beweging — stappen (t.o.v. doel) + trainingsminuten (t.o.v. weekdoel)
  const beweging = bouw([
    { naam: 'Stappen', bron: norm(gemStappen, (v) => vanDoelRatio(v, stappenDoel), 1.5) },
    { naam: 'Training', bron: data.training.length > 0 ? norm(trainingMin, (v) => vanDoelRatio(v, TRAINING_MIN_PER_WEEK_DOEL)) : null },
  ])

  // Voeding — water (t.o.v. doel) + logging-consistentie (dagen gelogd / 7)
  const voeding = bouw([
    { naam: 'Hydratatie', bron: norm(gemWater, (v) => vanDoelRatio(v, waterDoel)) },
    { naam: 'Voeding gelogd', bron: data.voedingDagen.size > 0 ? { waarde: Math.min(100, (data.voedingDagen.size / 7) * 100), gewicht: 1 } : null },
  ])

  return { energie, slaap, stress, stemming, beweging, voeding }
}

/** Telt meerdere logs op tot één waarde per dag, geeft de dag-totalen terug. */
function mapDagGemiddelde(rows: Array<{ datum: string; waarde: number }>): number[] {
  const perDag = new Map<string, number>()
  for (const r of rows) {
    if (!Number.isFinite(r.waarde)) continue
    perDag.set(r.datum, (perDag.get(r.datum) ?? 0) + r.waarde)
  }
  return [...perDag.values()]
}

// ── Publieke aggregatie ─────────────────────────────────────────────────────

/**
 * Haalt alle bronnen op en berekent de 6 pijler-scores (huidig + vorig venster),
 * trends en de overall wellbeing-score voor één gebruiker.
 */
export async function berekenPijlerOverzicht(
  admin: SupabaseClient,
  userId: string,
): Promise<PijlerOverzicht> {
  const grensHuidig = dagenGeleden(6) // laatste 7 dagen incl. vandaag
  const grensVorig = dagenGeleden(13)
  const vanaf14 = dagenGeleden(13)
  const vanaf14Ts = new Date(`${vanaf14}T00:00:00.000Z`).toISOString()

  const [
    slaapRes, stressRes, stemmingRes, dagmetingenRes, nativeRes,
    trainingRes, waterRes, voedingRes, checkinRes, profielRes,
  ] = await Promise.all([
    admin.from('slaap_logs').select('datum, uren_slaap, kwaliteit').eq('user_id', userId).gte('datum', vanaf14),
    admin.from('stress_logs').select('stress_niveau, aangemaakt_op').eq('user_id', userId).gte('aangemaakt_op', vanaf14Ts),
    // Filteren op `aangemaakt_op` (daar ligt de index, migratie 015), maar
    // bucketen op `datum` — de dag die de gebruiker zelf bedoelde. Filteren op
    // `datum` miste de index; `datum` bestaat wél live, maar is nooit in een
    // migratie gedeclareerd (schema-drift — zie 044 follow-ups).
    admin.from('stemming_logs').select('datum, stemming, energie').eq('user_id', userId).gte('aangemaakt_op', vanaf14Ts),
    admin.from('dagmetingen').select('datum, stappen').eq('user_id', userId).gte('datum', vanaf14),
    admin.from('health_native_logs').select('datum, stappen, slaap_minuten').eq('user_id', userId).gte('datum', vanaf14),
    admin.from('training_logs').select('datum, duur_minuten').eq('user_id', userId).gte('datum', vanaf14),
    admin.from('water_logs').select('datum, ml').eq('user_id', userId).gte('datum', vanaf14),
    admin.from('voeding_logs').select('datum').eq('user_id', userId).gte('datum', vanaf14),
    admin.from('checkin_analyses').select('scores, aangemaakt_op').eq('user_id', userId).order('aangemaakt_op', { ascending: false }).limit(2),
    admin.from('profiles').select('stappen_doel, water_doel_ml').eq('id', userId).maybeSingle(),
  ])

  const slaap = (slaapRes.data ?? []) as SlaapRow[]
  const stress = (stressRes.data ?? []) as StressRow[]
  const stemming = (stemmingRes.data ?? []) as StemmingRow[]
  const dagmetingen = (dagmetingenRes.data ?? []) as StappenRow[]
  const native = (nativeRes.data ?? []) as NativeRow[]
  const training = (trainingRes.data ?? []) as TrainingRow[]
  const water = (waterRes.data ?? []) as WaterRow[]
  const voeding = (voedingRes.data ?? []) as DatumRow[]
  const checkins = (checkinRes.data ?? []) as CheckinRow[]
  const profiel = (profielRes.data ?? null) as DoelRow | null

  const stappenDoel = profiel?.stappen_doel && profiel.stappen_doel > 0 ? profiel.stappen_doel : DEFAULT_STAPPEN_DOEL
  const waterDoel = profiel?.water_doel_ml && profiel.water_doel_ml > 0 ? profiel.water_doel_ml : DEFAULT_WATER_DOEL_ML

  // Combineer stappen uit dagmetingen + wearable, hoogste per dag telt.
  const stappenPerDag = new Map<string, number>()
  for (const r of [...dagmetingen, ...native]) {
    const s = num(r.stappen)
    if (!Number.isFinite(s)) continue
    stappenPerDag.set(r.datum, Math.max(stappenPerDag.get(r.datum) ?? 0, s))
  }

  // Slaap aanvullen met wearable-slaap (minuten → uren) waar geen slaap_log is.
  const slaapDatums = new Set(slaap.map((r) => r.datum))
  const slaapAangevuld: SlaapRow[] = [...slaap]
  for (const r of native) {
    if (r.slaap_minuten != null && !slaapDatums.has(r.datum)) {
      slaapAangevuld.push({ datum: r.datum, uren_slaap: num(r.slaap_minuten) / 60, kwaliteit: null })
    }
  }

  const bouwVenster = (soort: 'huidig' | 'vorig'): Vensterdata => {
    const inWindow = (datum: string) => venster(datum, grensHuidig, grensVorig) === soort
    return {
      slaap: slaapAangevuld.filter((r) => inWindow(r.datum)),
      stress: stress.filter((r) => inWindow(r.aangemaakt_op.slice(0, 10))),
      stemming: stemming.filter((r) => inWindow(r.datum)),
      stappen: [...stappenPerDag.entries()].filter(([d]) => inWindow(d)).map(([, v]) => v),
      training: training.filter((r) => inWindow(r.datum)),
      water: water.filter((r) => inWindow(r.datum)),
      voedingDagen: new Set(voeding.filter((r) => inWindow(r.datum)).map((r) => r.datum)),
      checkin: soort === 'huidig' ? (checkins[0] ?? null) : (checkins[1] ?? null),
    }
  }

  const huidig = scorePijlers(bouwVenster('huidig'), stappenDoel, waterDoel)
  const vorig = scorePijlers(bouwVenster('vorig'), stappenDoel, waterDoel)

  const pijlers: PijlerResultaat[] = PIJLER_KEYS.map((key) => {
    const score = huidig[key].score
    const vorigeScore = vorig[key].score
    return {
      key,
      score,
      vorigeScore,
      trend: berekenTrend(score, vorigeScore),
      bronnen: huidig[key].bronnen,
    }
  })

  return {
    pijlers,
    wellbeing: wellbeingScore(pijlers.map((p) => ({ key: p.key, score: p.score }))),
  }
}
