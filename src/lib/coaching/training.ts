// ─── Coaching-training — client-veilige types & labels ──────────────────────
// Gedeeld door de coach-pagina en de API-routes. GEEN server-imports hier — de
// server-only helpers (admin-client) staan in ./training-server.ts. Spiegelt de
// opzet van ./taken.ts (client-veilig) + ./taken-server.ts (server-only).
//
// STAP 4 van de coaching-laag: een coach stelt een trainingsschema samen voor
// een gekoppelde klant. Het schema wordt ADDITIEF opgeslagen in de BESTAANDE
// `fitness_schemas`-tabel (migratie 010/011) met `user_id = klant` en
// `toegewezen_door = coach` (migratie 041). De klant volgt het in de bestaande
// /sport-UI, die het actieve schema van de ingelogde gebruiker laadt.
//
// BELANGRIJK — schema_json-vorm: exact de vorm die src/app/(app)/sport/page.tsx
// én src/app/(app)/sport/training/page.tsx consumeren (Trainingsdag[] met
// oefeningen). Wijk hier niet van af, anders rendert het schema niet in /sport.

export type TrainingNiveau = 'beginner' | 'gemiddeld' | 'gevorderd'

/** Eén oefening binnen een trainingsdag — zoals de sport-UI hem leest. */
export interface TrainingOefening {
  naam: string
  naam_en?: string
  sets: number
  herhalingen: string
  rusttijd_sec: number
  heeft_gewicht: boolean
  gewicht_tip: string
  uitvoering_tip: string
}

/** Eén trainingsdag — top-level item van schema_json. */
export interface TrainingDag {
  dag: number
  naam: string
  spiergroepen: string[]
  coaching_tekst: string
  geschatte_duur: number
  oefeningen: TrainingOefening[]
}

/** Een rij uit fitness_schemas zoals de coach-pagina hem toont. */
export interface FitnessSchemaRij {
  id: string
  naam: string
  doel: string | null
  niveau: string | null
  sessies_per_week: number | null
  actief: boolean
  ai_gegenereerd: boolean
  toegewezen_door: string | null
  aangemaakt_op: string
  schema_json: TrainingDag[]
}

/** Recente training uit training_logs (coach-inzicht in klantactiviteit). */
export interface TrainingLogRij {
  id: string
  datum: string
  naam: string | null
  duur_minuten: number | null
}

// ─── Coach-invoer (POST-body) ───────────────────────────────────────────────
export interface NieuweOefeningInput {
  naam: string
  sets: number
  herhalingen: string
  heeft_gewicht?: boolean
  rusttijd_sec?: number
  uitvoering_tip?: string
  gewicht_tip?: string
  naam_en?: string
}

export interface NieuweDagInput {
  naam: string
  spiergroepen?: string[]
  coaching_tekst?: string
  geschatte_duur?: number
  oefeningen: NieuweOefeningInput[]
}

export interface NieuwSchemaInput {
  klant_id: string
  titel: string
  doel?: string
  niveau?: string
  dagen: NieuweDagInput[]
}

// ─── Labels ─────────────────────────────────────────────────────────────────
export const NIVEAUS: readonly TrainingNiveau[] = ['beginner', 'gemiddeld', 'gevorderd']

export const NIVEAU_LABELS: Record<TrainingNiveau, string> = {
  beginner: 'Beginner',
  gemiddeld: 'Gemiddeld',
  gevorderd: 'Gevorderd',
}

export interface DoelOptie {
  value: string
  label: string
}

// Vrije-tekstkolom (geen DB-CHECK), maar we bieden een curated set aan zodat de
// waarde consistent blijft met de AI-generator (genereer-schema route).
export const DOEL_OPTIES: readonly DoelOptie[] = [
  { value: 'spiermassa', label: 'Spiermassa' },
  { value: 'afvallen', label: 'Afvallen' },
  { value: 'conditie', label: 'Conditie' },
  { value: 'kracht', label: 'Kracht' },
  { value: 'flexibiliteit', label: 'Flexibiliteit' },
]

// ─── Validatie-helpers (gedeeld client + server) ────────────────────────────
export function isNiveau(waarde: unknown): waarde is TrainingNiveau {
  return waarde === 'beginner' || waarde === 'gemiddeld' || waarde === 'gevorderd'
}

/** Korte samenvatting van een schema voor de coach-lijst, bv. "3 dagen · 15 oefeningen". */
export function schemaSamenvatting(
  schema: Pick<FitnessSchemaRij, 'sessies_per_week' | 'schema_json'>,
): string {
  const dagen = schema.sessies_per_week ?? schema.schema_json.length
  const oefeningen = schema.schema_json.reduce((n, d) => n + d.oefeningen.length, 0)
  return `${dagen} ${dagen === 1 ? 'dag' : 'dagen'} · ${oefeningen} ${oefeningen === 1 ? 'oefening' : 'oefeningen'}`
}
