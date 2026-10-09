// ─── Bronnen samenvoegen tot één dag per datum ────────────────────────────────
// Native bronnen (Apple Health, Health Connect, Google Fit) winnen; handmatige
// invoer (slaap_logs, dagmetingen, lichaamsmetingen) vult alleen gaten. Binnen
// de native bronnen telt een vaste voorkeur per veld. Alles wat binnenkomt is
// `unknown`-achtig (Supabase): elke waarde wordt hier gevalideerd.

import type { GezondheidsDag, MetriekSleutel, SlaapFases, Workout } from './types'

export const TIJDZONE = 'Europe/Amsterdam'

type Ruw = Record<string, unknown>

export interface RuweBronnen {
  native: readonly Ruw[]
  slaapLogs: readonly Ruw[]
  dagmetingen: readonly Ruw[]
  lichaamsmetingen: readonly Ruw[]
  workouts: readonly Ruw[]
}

const BRON_VOORKEUR: Record<string, number> = {
  apple_health: 0, healthkit: 0,
  health_connect: 1,
  google_fit: 2, google_health: 2,
}

export const BRON_LABELS: Record<string, string> = {
  apple_health: 'Apple Health', healthkit: 'Apple Health',
  health_connect: 'Health Connect',
  google_fit: 'Google Fit', google_health: 'Google Fit',
  handmatig: 'Eigen invoer',
}

function voorkeur(bron: string): number {
  return BRON_VOORKEUR[bron] ?? 3
}

/** Eindig getal (ook uit een numeric-string van Postgres) of null. */
export function getal(waarde: unknown): number | null {
  if (typeof waarde === 'number') return Number.isFinite(waarde) ? waarde : null
  if (typeof waarde === 'string' && waarde.trim() !== '') {
    const n = Number(waarde)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function tekst(waarde: unknown): string | null {
  return typeof waarde === 'string' && waarde.length > 0 ? waarde : null
}

function isDatum(waarde: unknown): waarde is string {
  return typeof waarde === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(waarde)
}

/** Lokale datum (YYYY-MM-DD) van een tijdstip. */
export function lokaleDatum(iso: string, tijdzone: string = TIJDZONE): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('sv-SE', { timeZone: tijdzone }).format(d)
}

/** Minuten na middernacht (lokale tijd) van een tijdstip. */
export function lokaleKlokMinuten(iso: string, tijdzone: string = TIJDZONE): number | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const delen = new Intl.DateTimeFormat('en-GB', {
    timeZone: tijdzone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d)
  const uur = Number(delen.find((p) => p.type === 'hour')?.value)
  const minuut = Number(delen.find((p) => p.type === 'minute')?.value)
  return Number.isFinite(uur) && Number.isFinite(minuut) ? uur * 60 + minuut : null
}

/** "23:30" of "23:30:00" → minuten na middernacht. */
export function klokTekstNaarMinuten(waarde: unknown): number | null {
  const t = tekst(waarde)
  const match = t ? /^(\d{1,2}):(\d{2})/.exec(t) : null
  if (!match) return null
  const uur = Number(match[1])
  const minuut = Number(match[2])
  if (uur > 23 || minuut > 59) return null
  return uur * 60 + minuut
}

/** Bedtijd telt vanaf 12:00, zodat 23:30 (690) en 00:30 (750) naast elkaar liggen. */
export function bedtijdSchaal(minutenNaMiddernacht: number): number {
  return (minutenNaMiddernacht + 720) % 1440
}

/** Native kolom → metriek. Oudere kolommen staan als terugval achteraan. */
const NATIVE_VELDEN: readonly (readonly [MetriekSleutel, readonly string[]])[] = [
  ['stappen', ['stappen']],
  ['afstand', ['afstand_m']],
  ['actieve-kcal', ['actieve_kcal', 'calorieen']],
  ['beweegminuten', ['beweegminuten']],
  ['verdiepingen', ['verdiepingen']],
  ['slaap', ['slaap_minuten']],
  ['rusthartslag', ['rusthartslag']],
  ['hrv', ['hrv_ms']],
  ['vo2max', ['vo2max']],
  ['gewicht', ['gewicht_kg']],
  ['ademhaling', ['ademhaling_pm']],
  ['zuurstof', ['zuurstof_pct']],
]

function eersteGetal(rij: Ruw, kolommen: readonly string[]): number | null {
  for (const k of kolommen) {
    const n = getal(rij[k])
    if (n !== null) return n
  }
  return null
}

function fasesUit(rij: Ruw): SlaapFases | null {
  const fases: SlaapFases = {
    diep: getal(rij.slaap_diep_min),
    licht: getal(rij.slaap_licht_min),
    rem: getal(rij.slaap_rem_min),
    wakker: getal(rij.slaap_wakker_min),
  }
  return Object.values(fases).some((v) => v !== null) ? fases : null
}

interface Werkdag {
  waarden: Partial<Record<MetriekSleutel, number>>
  fases: SlaapFases | null
  herkomst: Partial<Record<MetriekSleutel, string>>
}

function werkdag(dagen: Map<string, Werkdag>, datum: string): Werkdag {
  const bestaand = dagen.get(datum)
  if (bestaand) return bestaand
  const nieuw: Werkdag = { waarden: {}, fases: null, herkomst: {} }
  dagen.set(datum, nieuw)
  return nieuw
}

/** Vult een veld alleen als het nog leeg is (eerdere bron wint). */
function vul(dag: Werkdag, sleutel: MetriekSleutel, waarde: number | null, bron: string): void {
  if (waarde === null || dag.waarden[sleutel] !== undefined) return
  dag.waarden = { ...dag.waarden, [sleutel]: waarde }
  dag.herkomst = { ...dag.herkomst, [sleutel]: bron }
}

function verwerkNative(dagen: Map<string, Werkdag>, rijen: readonly Ruw[], tijdzone: string): void {
  const gesorteerd = [...rijen].sort(
    (a, b) => voorkeur(tekst(a.bron) ?? '') - voorkeur(tekst(b.bron) ?? ''),
  )
  for (const rij of gesorteerd) {
    if (!isDatum(rij.datum)) continue
    const bron = tekst(rij.bron) ?? 'onbekend'
    const dag = werkdag(dagen, rij.datum)
    for (const [sleutel, kolommen] of NATIVE_VELDEN) vul(dag, sleutel, eersteGetal(rij, kolommen), bron)

    const bed = tekst(rij.bedtijd)
    const bedMin = bed ? lokaleKlokMinuten(bed, tijdzone) : null
    vul(dag, 'bedtijd', bedMin === null ? null : bedtijdSchaal(bedMin), bron)
    const wek = tekst(rij.wektijd)
    vul(dag, 'wektijd', wek ? lokaleKlokMinuten(wek, tijdzone) : null, bron)

    if (!dag.fases) dag.fases = fasesUit(rij)
  }
}

function verwerkSlaapLogs(dagen: Map<string, Werkdag>, rijen: readonly Ruw[]): void {
  for (const rij of rijen) {
    if (!isDatum(rij.datum)) continue
    const dag = werkdag(dagen, rij.datum)
    const uren = getal(rij.uren_slaap)
    vul(dag, 'slaap', uren === null ? null : Math.round(uren * 60), 'handmatig')
    const bed = klokTekstNaarMinuten(rij.bedtijd)
    vul(dag, 'bedtijd', bed === null ? null : bedtijdSchaal(bed), 'handmatig')
    vul(dag, 'wektijd', klokTekstNaarMinuten(rij.wektijd), 'handmatig')
    vul(dag, 'hrv', getal(rij.hrv_ms), 'handmatig')
    if (!dag.fases) dag.fases = fasesUit(rij)
  }
}

function verwerkEnkelVeld(
  dagen: Map<string, Werkdag>, rijen: readonly Ruw[], kolom: string, sleutel: MetriekSleutel,
): void {
  for (const rij of rijen) {
    if (!isDatum(rij.datum)) continue
    const waarde = getal(rij[kolom])
    if (waarde === null) continue
    vul(werkdag(dagen, rij.datum), sleutel, waarde, 'handmatig')
  }
}

/** Valideert ruwe workout-rijen; ongeldige of onmogelijke trainingen vallen weg. */
export function leesWorkouts(rijen: readonly Ruw[], tijdzone: string = TIJDZONE): Workout[] {
  const uit: Workout[] = []
  for (const rij of rijen) {
    const start = tekst(rij.start)
    const eind = tekst(rij.eind)
    const id = tekst(rij.id)
    if (!start || !eind || !id) continue
    const minuten = Math.round((new Date(eind).getTime() - new Date(start).getTime()) / 60_000)
    const datum = lokaleDatum(start, tijdzone)
    if (!datum || !Number.isFinite(minuten) || minuten <= 0 || minuten > 1440) continue
    uit.push({
      id, datum, start, eind, minuten,
      bron: tekst(rij.bron) ?? 'onbekend',
      soort: tekst(rij.soort) ?? 'training',
      kcal: getal(rij.kcal),
      afstandM: getal(rij.afstand_m),
      gemHartslag: getal(rij.gem_hartslag),
    })
  }
  return uit.sort((a, b) => b.start.localeCompare(a.start))
}

function verwerkWorkouts(dagen: Map<string, Werkdag>, workouts: readonly Workout[]): void {
  const perDag = new Map<string, { minuten: number; bron: string }>()
  for (const w of workouts) {
    const huidig = perDag.get(w.datum)
    perDag.set(w.datum, { minuten: (huidig?.minuten ?? 0) + w.minuten, bron: huidig?.bron ?? w.bron })
  }
  for (const [datum, { minuten, bron }] of perDag) {
    const dag = werkdag(dagen, datum)
    dag.waarden = { ...dag.waarden, workouts: minuten }
    dag.herkomst = { ...dag.herkomst, workouts: bron }
  }
}

/**
 * Voegt alle bronnen samen tot één dag per datum, oplopend gesorteerd.
 * Dagen zonder enige meting komen niet in de uitvoer.
 */
export function voegBronnenSamen(
  bronnen: RuweBronnen, tijdzone: string = TIJDZONE,
): { dagen: GezondheidsDag[]; workouts: Workout[] } {
  const dagen = new Map<string, Werkdag>()
  verwerkNative(dagen, bronnen.native, tijdzone)
  verwerkSlaapLogs(dagen, bronnen.slaapLogs)
  verwerkEnkelVeld(dagen, bronnen.dagmetingen, 'stappen', 'stappen')
  verwerkEnkelVeld(dagen, bronnen.lichaamsmetingen, 'gewicht_kg', 'gewicht')
  const workouts = leesWorkouts(bronnen.workouts, tijdzone)
  verwerkWorkouts(dagen, workouts)

  const uit = [...dagen.entries()]
    .filter(([, d]) => Object.keys(d.waarden).length > 0 || d.fases !== null)
    .map(([datum, d]): GezondheidsDag => ({
      datum, waarden: d.waarden, fases: d.fases, herkomst: d.herkomst,
    }))
    .sort((a, b) => a.datum.localeCompare(b.datum))
  return { dagen: uit, workouts }
}
