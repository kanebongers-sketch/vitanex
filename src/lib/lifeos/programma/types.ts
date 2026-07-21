// Types voor Kane's persoonlijke trainings- en voedingsprogramma.
//
// Dit is VASTE data — één keer geparsed uit de bron-Excel en als constanten
// vastgelegd (zie `voeding-data.ts` / `training-data.ts`). Geen runtime-parser
// in de app. De types staan hier los zodat de data-bestanden en de barrel
// (`programma-data.ts`) ze kunnen delen zonder circulaire import.

/** Eén set macro's. Overal dezelfde vorm: doel, maaltijd-totaal, dag-streef. */
export interface Macros {
  kcal: number
  eiwit: number
  kh: number
  vet: number
}

/** Eén regel in een maaltijd. `aantal`/`eenheid` mag leeg zijn in de bron. */
export interface VoedingItem {
  voedingsmiddel: string
  aantal: number | null
  eenheid: string | null
  kcal: number
  eiwit: number
  kh: number
  vet: number
}

/**
 * Eén maaltijd (Ontbijt / Lunch / Avondeten / Tussendoortjes). Het `totaal`
 * komt letterlijk uit de "Totaal"-rij van de bron — niet uit de items berekend.
 * In Kane's sheet sommeren de item-macro's binnen een maaltijd niet altijd
 * exact op het totaal (eiwit/vet wijken soms af); de kcal en het dag-streef
 * kloppen wél. We bewaren de bronwaarden en verzinnen niks.
 */
export interface Maaltijd {
  naam: string
  items: VoedingItem[]
  totaal: Macros
}

/** Eén voedingsdag (1–7) met zijn maaltijden en het streef-dagtotaal. */
export interface VoedingDag {
  dag: string
  maaltijden: Maaltijd[]
  streefTotaal: Macros
}

/** Eén regel op de weekboodschappenlijst. */
export interface BoodschapItem {
  voedingsmiddel: string
  hoeveelheid: string | null
  eenheid: string | null
}

/** Eén oefening. `gewicht` is de startbelasting (week 1); leeg = onbekend. */
export interface Oefening {
  naam: string
  sets: number | null
  reps: string | null
  rpe: number | null
  gewicht: number | null
}

/** Eén trainingssessie (Push/Pull/Legs) met optionele cardio-afsluiter. */
export interface Sessie {
  naam: string
  oefeningen: Oefening[]
  cardio?: string
}

/** Het volledige trainingsschema: doel, fase, welke week de cijfers zijn. */
export interface Trainingsschema {
  doel: string
  fase: string
  /** De week waaruit sets/reps/gewicht komen (bron heeft 22 weken). */
  week: number
  sessies: Sessie[]
}
