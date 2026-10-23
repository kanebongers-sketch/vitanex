// ─── Club, health: de vaste typen van koppelingen en metingen (PUUR) ────────
// Een koppeling haalt gezondheidsgegevens van een lid op bij een app of
// apparaat (weegschaal, horloge, sportapp). Alles wat binnenkomt wordt eerst
// omgezet naar een van de vaste soorten hieronder; de rest van Club kent alleen
// dit model, nooit het formaat van een leverancier.
//
// Gezondheidsgegevens zijn bijzondere persoonsgegevens (art. 9 AVG): niets komt
// binnen zonder uitdrukkelijke toestemming van het lid per soort (toestemming.ts).

/** De soorten gegevens die Club kan bewaren. Volgorde = volgorde in de app. */
export const DATA_SOORTEN = [
  'gewicht_kg',
  'vetpercentage',
  'spiermassa_kg',
  'stappen',
  'slaap_minuten',
  'rusthartslag',
  'hrv_ms',
  'training',
  'vo2max',
] as const

export type DataSoort = (typeof DATA_SOORTEN)[number]

export function isDataSoort(v: unknown): v is DataSoort {
  return typeof v === 'string' && (DATA_SOORTEN as readonly string[]).includes(v)
}

/** Hoe een lid een bron koppelt. */
export type AuthSoort = 'oauth2_pkce' | 'oauth2' | 'native_healthkit' | 'native_health_connect'

/** Alle bronnen die Club kent (ook die nog niet te koppelen zijn). */
export const BRONNEN = [
  'withings', 'strava', 'polar', 'oura', 'whoop', 'apple_health', 'health_connect',
  'garmin', 'google_health', 'suunto', 'wahoo', 'samsung', 'huawei',
] as const

export type BronId = (typeof BRONNEN)[number]

export function isBronId(v: unknown): v is BronId {
  return typeof v === 'string' && (BRONNEN as readonly string[]).includes(v)
}

/** Een training (alleen bij soort 'training'). */
export interface TrainingDetails {
  /** Vrije soortnaam van de bron, kort gemaakt (bijv. "Hardlopen" of "Run"). */
  soort: string
  duurSec: number
  kcal: number | null
  gemHartslag: number | null
}

/**
 * Een meting in het genormaliseerde model. Een rij per soort per moment.
 * `externId` is uniek binnen de bron en het lid (dedupe in de database:
 * unique (lid_id, bron, extern_id)).
 */
export interface Meting {
  soort: DataSoort
  /** De waarde in de eenheid van de soort (kg, %, stappen, minuten, slagen, ms, ml/kg/min). Bij een training de duur in minuten. */
  waarde: number
  training: TrainingDetails | null
  bron: BronId
  externId: string
  /** ISO-moment van de meting. */
  gemetenOp: string
}

/** Eenheid en label per soort, voor de app en de ledenkaart. */
export const SOORT_INFO: Readonly<Record<DataSoort, { label: string; eenheid: string; uitleg: string }>> = {
  gewicht_kg: { label: 'Gewicht', eenheid: 'kg', uitleg: 'Van je weegschaal' },
  vetpercentage: { label: 'Vetpercentage', eenheid: '%', uitleg: 'Van een weegschaal die dit meet' },
  spiermassa_kg: { label: 'Spiermassa', eenheid: 'kg', uitleg: 'Van een weegschaal die dit meet' },
  stappen: { label: 'Stappen', eenheid: 'stappen', uitleg: 'Per dag' },
  slaap_minuten: { label: 'Slaap', eenheid: 'min', uitleg: 'Per nacht' },
  rusthartslag: { label: 'Rusthartslag', eenheid: 'bpm', uitleg: 'Slagen per minuut in rust' },
  hrv_ms: { label: 'Hartslagvariabiliteit', eenheid: 'ms', uitleg: 'HRV, een maat voor herstel' },
  training: { label: 'Trainingen', eenheid: 'min', uitleg: 'Soort, duur, kcal en hartslag' },
  vo2max: { label: 'VO2max', eenheid: 'ml/kg/min', uitleg: 'Schatting van je conditie' },
}
