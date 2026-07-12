// ─── Coaching-voedingsrichtlijn — client-veilige types & helpers ────────────
// Gedeeld door pagina's en API-routes. GEEN server-imports hier — de
// server-only helpers (admin-client) staan in ./voeding-server.ts.
//
// Dit is de coach-laag bovenop de bestaande, per-gebruiker voeding-logging:
// een coach (rol 'coach') stelt een persoonlijke voedingsrichtlijn +
// dagdoelen op voor een gekoppelde klant. De klant ziet die read-only.
//
// EERLIJKHEID: de richtlijn is de eigen input van de coach. Macro-
// percentages hieronder zijn een pure rekensom (Atwater 4/4/9 kcal/g),
// geen verzonnen voedingsclaim.

// ─── Dieetvoorkeur — zelfde set als profiles.dieetvoorkeur (migratie 026) ───
export type Dieetvoorkeur =
  | 'geen'
  | 'vegetarisch'
  | 'veganistisch'
  | 'pescotarisch'
  | 'keto'
  | 'mediterraan'
  | 'glutenvrij'
  | 'lactosevrij'

export const DIEETVOORKEUREN: readonly Dieetvoorkeur[] = [
  'geen', 'vegetarisch', 'veganistisch', 'pescotarisch', 'keto', 'mediterraan', 'glutenvrij', 'lactosevrij',
]

export const DIEETVOORKEUR_LABELS: Record<Dieetvoorkeur, string> = {
  geen:         'Geen voorkeur',
  vegetarisch:  'Vegetarisch',
  veganistisch: 'Veganistisch',
  pescotarisch: 'Pescotarisch',
  keto:         'Keto',
  mediterraan:  'Mediterraan',
  glutenvrij:   'Glutenvrij',
  lactosevrij:  'Lactosevrij',
}

/** True als een willekeurige waarde een geldige dieetvoorkeur-sleutel is. */
export function isDieetvoorkeur(waarde: unknown): waarde is Dieetvoorkeur {
  return typeof waarde === 'string' && (DIEETVOORKEUREN as readonly string[]).includes(waarde)
}

// ─── Rij-type ───────────────────────────────────────────────────────────────
export interface VoedingRichtlijn {
  id: string
  coach_id: string
  klant_id: string
  calorie_doel: number | null
  eiwit_g: number | null
  koolhydraat_g: number | null
  vet_g: number | null
  richtlijn_tekst: string | null
  dieetvoorkeur: Dieetvoorkeur | null
  actief: boolean
  aangemaakt_op: string
  bijgewerkt_op: string
}

/** Payload voor het opstellen (POST) of bijwerken (PATCH) van een richtlijn. */
export interface VoedingRichtlijnInput {
  klant_id?: string
  id?: string
  calorie_doel?: number | null
  eiwit_g?: number | null
  koolhydraat_g?: number | null
  vet_g?: number | null
  richtlijn_tekst?: string | null
  dieetvoorkeur?: string | null
}

// ─── Macro-verdeling (pure rekensom) ─────────────────────────────────────────
/** Energie per gram — Atwater-factoren (kcal/g). Feitelijk, niet verzonnen. */
export const KCAL_PER_GRAM = { eiwit: 4, koolhydraat: 4, vet: 9 } as const

export interface MacroVerdeling {
  eiwit_kcal: number
  koolhydraat_kcal: number
  vet_kcal: number
  /** Som van de macro-energie (kan afwijken van het losse calorie_doel). */
  totaal_kcal: number
  eiwit_pct: number
  koolhydraat_pct: number
  vet_pct: number
}

/**
 * Berekent de energieverdeling over de drie macro's uit de opgegeven grammen.
 * Geeft `null` terug wanneer geen enkele macro is ingevuld (dan is er niets te
 * verdelen). Percentages zijn t.o.v. de totale macro-energie.
 */
export function macroVerdeling(
  richtlijn: Pick<VoedingRichtlijn, 'eiwit_g' | 'koolhydraat_g' | 'vet_g'>,
): MacroVerdeling | null {
  const eiwit = richtlijn.eiwit_g ?? 0
  const koolhydraat = richtlijn.koolhydraat_g ?? 0
  const vet = richtlijn.vet_g ?? 0
  if (eiwit <= 0 && koolhydraat <= 0 && vet <= 0) return null

  const eiwit_kcal = eiwit * KCAL_PER_GRAM.eiwit
  const koolhydraat_kcal = koolhydraat * KCAL_PER_GRAM.koolhydraat
  const vet_kcal = vet * KCAL_PER_GRAM.vet
  const totaal_kcal = eiwit_kcal + koolhydraat_kcal + vet_kcal

  const pct = (deel: number) => (totaal_kcal > 0 ? Math.round((deel / totaal_kcal) * 100) : 0)

  return {
    eiwit_kcal,
    koolhydraat_kcal,
    vet_kcal,
    totaal_kcal,
    eiwit_pct: pct(eiwit_kcal),
    koolhydraat_pct: pct(koolhydraat_kcal),
    vet_pct: pct(vet_kcal),
  }
}
