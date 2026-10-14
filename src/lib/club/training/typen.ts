// ─── Fit Factory Club, training: de vaste lijsten (PUUR) ────────────────────
// Dezelfde waarden als de checks in 380_club_basis.sql en 382_club_oefeningen.sql.
// Eén bron voor de formulieren, de validatie en het schemavoorstel.

export const SPIERGROEPEN = [
  'borst', 'rug', 'schouders', 'biceps', 'triceps', 'benen', 'billen', 'buik', 'onderrug', 'kuiten', 'hele_lichaam', 'cardio',
] as const
export type Spiergroep = (typeof SPIERGROEPEN)[number]

export const SPIERGROEP_LABEL: Record<Spiergroep, string> = {
  borst: 'Borst',
  rug: 'Rug',
  schouders: 'Schouders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  benen: 'Benen',
  billen: 'Billen',
  buik: 'Buik',
  onderrug: 'Onderrug',
  kuiten: 'Kuiten',
  hele_lichaam: 'Hele lichaam',
  cardio: 'Cardio',
}

export const MATERIALEN = [
  'geen', 'dumbbell', 'barbell', 'kettlebell', 'machine', 'kabel', 'band', 'bank', 'cardio_apparaat', 'overig',
] as const
export type Materiaal = (typeof MATERIALEN)[number]

export const MATERIAAL_LABEL: Record<Materiaal, string> = {
  geen: 'Lichaamsgewicht',
  dumbbell: 'Dumbbell',
  barbell: 'Barbell',
  kettlebell: 'Kettlebell',
  machine: 'Machine',
  kabel: 'Kabel',
  band: 'Elastiek',
  bank: 'Bank',
  cardio_apparaat: 'Cardioapparaat',
  overig: 'Overig',
}

/** Het bewegingspatroon: daarmee bouwt het voorstel een gebalanceerde dag. */
export const PATRONEN = [
  'squat', 'heupscharnier', 'lunge', 'duwen_horizontaal', 'duwen_verticaal', 'trekken_horizontaal', 'trekken_verticaal',
  'isolatie', 'core', 'cardio', 'explosief',
] as const
export type Patroon = (typeof PATRONEN)[number]

export const PATROON_LABEL: Record<Patroon, string> = {
  squat: 'Squat',
  heupscharnier: 'Heupscharnier',
  lunge: 'Lunge',
  duwen_horizontaal: 'Duwen (vooruit)',
  duwen_verticaal: 'Duwen (omhoog)',
  trekken_horizontaal: 'Trekken (naar je toe)',
  trekken_verticaal: 'Trekken (omlaag)',
  isolatie: 'Isolatie',
  core: 'Romp',
  cardio: 'Cardio',
  explosief: 'Explosief',
}

/** Gewrichten en zones die een oefening belast; dezelfde lijst als de blessures in de intake. */
export const ZONES = ['knie', 'rug', 'schouder', 'pols', 'elleboog', 'heup', 'enkel', 'nek'] as const
export type Zone = (typeof ZONES)[number]

export const ZONE_LABEL: Record<Zone, string> = {
  knie: 'Knie',
  rug: 'Rug',
  schouder: 'Schouder',
  pols: 'Pols',
  elleboog: 'Elleboog',
  heup: 'Heup',
  enkel: 'Enkel',
  nek: 'Nek',
}

export const DOELEN = ['afvallen', 'spiermassa', 'kracht', 'conditie', 'gezondheid', 'revalidatie', 'sport'] as const
export type Doel = (typeof DOELEN)[number]

export const DOEL_LABEL: Record<Doel, string> = {
  afvallen: 'Afvallen',
  spiermassa: 'Spiermassa',
  kracht: 'Kracht',
  conditie: 'Conditie',
  gezondheid: 'Gezond en fit',
  revalidatie: 'Revalidatie',
  sport: 'Sportprestatie',
}

export const NIVEAUS = [1, 2, 3] as const
export type Niveau = (typeof NIVEAUS)[number]

export const NIVEAU_LABEL: Record<Niveau, string> = { 1: 'Beginner', 2: 'Gemiddeld', 3: 'Gevorderd' }

export const VOORKEUREN = ['sportschool', 'groepslessen', 'thuis'] as const
export type Voorkeur = (typeof VOORKEUREN)[number]

export const VOORKEUR_LABEL: Record<Voorkeur, string> = {
  sportschool: 'Vrij trainen in de club',
  groepslessen: 'Groepslessen',
  thuis: 'Ook thuis',
}

export const SCHEMA_STATUSSEN = ['concept', 'actief', 'afgerond'] as const
export type SchemaStatus = (typeof SCHEMA_STATUSSEN)[number]

export const SCHEMA_STATUS_LABEL: Record<SchemaStatus, string> = {
  concept: 'Concept',
  actief: 'Actief',
  afgerond: 'Afgerond',
}

/** Letters voor de trainingsdagen: dag 1 = A. */
export function dagLetter(dag: number): string {
  return String.fromCharCode(64 + Math.min(Math.max(Math.round(dag), 1), 26))
}

export const MAX_DAGEN = 7

function inLijst<T extends string | number>(lijst: readonly T[]) {
  return (v: unknown): v is T => (lijst as readonly unknown[]).includes(v)
}

export const isSpiergroep = inLijst(SPIERGROEPEN)
export const isMateriaal = inLijst(MATERIALEN)
export const isPatroon = inLijst(PATRONEN)
export const isZone = inLijst(ZONES)
export const isDoel = inLijst(DOELEN)
export const isNiveau = inLijst(NIVEAUS)
export const isVoorkeur = inLijst(VOORKEUREN)
export const isSchemaStatus = inLijst(SCHEMA_STATUSSEN)

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v)
