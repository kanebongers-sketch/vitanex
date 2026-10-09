/**
 * Gedeelde types, kolom-definities en merge-logica voor gezondheidsdata.
 * Eén bron van waarheid voor de dagrij in health_native_logs (migratie 053):
 * de client (native sync) en de server (validatie + upsert) gebruiken allebei
 * de tabel KOLOMMEN hieronder.
 */

/** Bronnen zoals de database ze toestaat (check-constraint op `bron`). */
export type HealthBron = 'health_connect' | 'healthkit' | 'google_health'

export const HEALTH_BRONNEN: HealthBron[] = ['health_connect', 'healthkit', 'google_health']

/** Labels per bron; de oude namen staan erbij voor eerder bewaarde sync-info. */
export const BRON_LABELS: Record<HealthBron | 'apple_health' | 'google_fit', string> = {
  health_connect: 'Health Connect',
  healthkit: 'Apple Health',
  google_health: 'Google Fit',
  apple_health: 'Apple Health',
  google_fit: 'Google Fit',
}

/** Oude bronnamen (vóór 053) → de namen die de database accepteert. */
const OUDE_BRONNEN: Record<string, HealthBron> = {
  apple_health: 'healthkit',
  google_fit: 'google_health',
}

/** Zet een (mogelijk oude) bronnaam om naar een geldige bron, of null. */
export function normaliseerBron(bron: unknown): HealthBron | null {
  if (typeof bron !== 'string') return null
  if ((HEALTH_BRONNEN as string[]).includes(bron)) return bron as HealthBron
  return OUDE_BRONNEN[bron] ?? null
}

/** Eén dag aan metingen van één bron. Alles optioneel: een bron meet niet alles. */
export interface DagMeting {
  datum: string
  stappen?: number | null
  slaapMinuten?: number | null
  hartslag?: number | null
  calorieen?: number | null
  rusthartslag?: number | null
  hrvMs?: number | null
  vo2max?: number | null
  gewichtKg?: number | null
  actieveKcal?: number | null
  beweegminuten?: number | null
  afstandM?: number | null
  verdiepingen?: number | null
  slaapDiepMin?: number | null
  slaapLichtMin?: number | null
  slaapRemMin?: number | null
  slaapWakkerMin?: number | null
  ademhalingPm?: number | null
  zuurstofPct?: number | null
  /** ISO-tijdstip waarop de (hoofd)slaap begon. */
  bedtijd?: string | null
  /** ISO-tijdstip waarop de (hoofd)slaap eindigde. */
  wektijd?: string | null
}

/** Eén training zoals de native bron hem levert. */
export interface WorkoutMeting {
  externId: string
  soort: string
  start: string
  eind: string
  kcal?: number | null
  afstandM?: number | null
  gemHartslag?: number | null
}

export type NumeriekVeld = Exclude<keyof DagMeting, 'datum' | 'bedtijd' | 'wektijd'>

export interface KolomDef {
  veld: NumeriekVeld
  kolom: string
  min: number
  max: number
  /** Aantal decimalen dat de kolom bewaart (0 = integer). */
  decimalen: number
}

/** Bereiken volgen de check-constraints van migratie 053 (stappen: eigen grens). */
export const KOLOMMEN: readonly KolomDef[] = [
  { veld: 'stappen', kolom: 'stappen', min: 0, max: 200_000, decimalen: 0 },
  { veld: 'slaapMinuten', kolom: 'slaap_minuten', min: 0, max: 1440, decimalen: 0 },
  { veld: 'hartslag', kolom: 'hartslag_gemiddeld', min: 25, max: 250, decimalen: 0 },
  { veld: 'calorieen', kolom: 'calorieen', min: 0, max: 20_000, decimalen: 0 },
  { veld: 'rusthartslag', kolom: 'rusthartslag', min: 25, max: 220, decimalen: 1 },
  { veld: 'hrvMs', kolom: 'hrv_ms', min: 1, max: 500, decimalen: 1 },
  { veld: 'vo2max', kolom: 'vo2max', min: 10, max: 100, decimalen: 1 },
  { veld: 'gewichtKg', kolom: 'gewicht_kg', min: 20, max: 400, decimalen: 2 },
  { veld: 'actieveKcal', kolom: 'actieve_kcal', min: 0, max: 20_000, decimalen: 0 },
  { veld: 'beweegminuten', kolom: 'beweegminuten', min: 0, max: 1440, decimalen: 0 },
  { veld: 'afstandM', kolom: 'afstand_m', min: 0, max: 500_000, decimalen: 0 },
  { veld: 'verdiepingen', kolom: 'verdiepingen', min: 0, max: 1000, decimalen: 0 },
  { veld: 'slaapDiepMin', kolom: 'slaap_diep_min', min: 0, max: 1440, decimalen: 0 },
  { veld: 'slaapLichtMin', kolom: 'slaap_licht_min', min: 0, max: 1440, decimalen: 0 },
  { veld: 'slaapRemMin', kolom: 'slaap_rem_min', min: 0, max: 1440, decimalen: 0 },
  { veld: 'slaapWakkerMin', kolom: 'slaap_wakker_min', min: 0, max: 1440, decimalen: 0 },
  { veld: 'ademhalingPm', kolom: 'ademhaling_pm', min: 3, max: 60, decimalen: 1 },
  { veld: 'zuurstofPct', kolom: 'zuurstof_pct', min: 50, max: 100, decimalen: 1 },
]

const TIJD_KOLOMMEN = [
  { veld: 'bedtijd', kolom: 'bedtijd' },
  { veld: 'wektijd', kolom: 'wektijd' },
] as const

/** Kolommen om bestaande rijen mee te lezen (voor de merge). */
export const DAGRIJ_SELECT = ['datum', ...KOLOMMEN.map(k => k.kolom), 'bedtijd', 'wektijd'].join(', ')

/** Een dagrij zoals hij in health_native_logs staat (zonder user_id). */
export type DagRij = { datum: string } & Record<string, string | number | null>

/** Houdt alleen metingen over die ten minste één waarde bevatten. */
export function heeftMeetwaarde(m: DagMeting): boolean {
  const numeriek = KOLOMMEN.some(k => m[k.veld] !== null && m[k.veld] !== undefined)
  return numeriek || Boolean(m.bedtijd) || Boolean(m.wektijd)
}

/** Rondt af op het aantal decimalen dat de kolom bewaart. */
export function rondAf(waarde: number, decimalen: number): number {
  const factor = 10 ** decimalen
  return Math.round(waarde * factor) / factor
}

/**
 * Voegt nieuwe metingen samen met bestaande rijen van dezelfde bron:
 * nieuwe niet-lege waarden winnen, bestaande waarden blijven staan waar de
 * nieuwe sync niets levert (bv. omdat een toestemming is ingetrokken).
 */
export function mergeDagMetingen(bestaand: DagRij[], nieuw: DagMeting[], bron: HealthBron): DagRij[] {
  const perDatum = new Map(bestaand.map(r => [r.datum, r]))

  return nieuw.filter(heeftMeetwaarde).map(m => {
    const oud = perDatum.get(m.datum)
    const rij: DagRij = { datum: m.datum, bron }
    for (const k of KOLOMMEN) {
      const waarde = m[k.veld]
      rij[k.kolom] = waarde === null || waarde === undefined
        ? (oud?.[k.kolom] ?? null)
        : rondAf(waarde, k.decimalen)
    }
    for (const t of TIJD_KOLOMMEN) {
      rij[t.kolom] = m[t.veld] ?? oud?.[t.kolom] ?? null
    }
    return rij
  })
}

/** Datum (YYYY-MM-DD) van een tijdstip in Nederlandse tijd. */
export function datumInNL(tijdstip: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(tijdstip)
}

/** Het tijdstip van middernacht (Europe/Amsterdam) aan het begin van `datum`. */
export function middernachtNL(datum: string): Date {
  const utcMiddernacht = new Date(`${datum}T00:00:00Z`).getTime()
  for (const offsetUur of [2, 1]) { // eerst zomertijd, dan wintertijd
    const kandidaat = utcMiddernacht - offsetUur * 3_600_000
    if (datumInNL(new Date(kandidaat)) === datum && datumInNL(new Date(kandidaat - 1)) !== datum) {
      return new Date(kandidaat)
    }
  }
  return new Date(utcMiddernacht)
}

/** Datum (NL) van N dagen vóór `nu`. */
export function datumDagenTerug(dagen: number, nu: Date = new Date()): string {
  return datumInNL(new Date(nu.getTime() - dagen * 86_400_000))
}
