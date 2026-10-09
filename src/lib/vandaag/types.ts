// ─── MentaForce Vandaag-kaart — de Vandaag-kaart: types ────────────────────────────────
// De kernbelofte: "Elke ochtend weet je wat vandaag telt." De kaart komt uit een
// vaste keten (zie strategisch advies §11):
//
//   FEITEN ─► NORMAAL ─► SIGNALEN ─► REGELS (+ grenzen trainer) ─► KAART
//
// Code beslist wat waar is en wat mag; een taalmodel mag later alleen de toon
// verfijnen. De kaart werkt dus altijd, ook zonder AI, en zet nooit een getal
// neer waar geen meting achter zit.

/** Hoe zwaar een geplande training is. Bepaalt hoe ver hij kan meebuigen. */
export type Intensiteit = 'zwaar' | 'licht'

/** Wat er vandaag in je eigen (of je trainers) plan staat. */
export interface PlanDag {
  /** Vrije naam: "Benen", "Hardlopen", "Full body". */
  soort: string
  intensiteit: Intensiteit
  /** Geplande starttijd "HH:MM", of null als je dat niet vastlegde. */
  tijd: string | null
}

/** De ochtend-check-in: drie schuifjes, elk 1 (laag) t/m 5 (hoog). */
export interface CheckIn {
  stemming: number
  energie: number | null
  stress: number | null
}

/** Een afspraak uit je agenda (alleen begin, eind en titel zijn nodig). */
export interface Afspraak {
  titel: string
  /** ISO-moment. */
  start: string
  eind: string | null
}

/**
 * Grenzen die een trainer zet (optioneel): wat er met een zware training mag
 * gebeuren na een slechte nacht. Zonder trainer gelden de standaarden.
 */
export interface Grenzen {
  naSlechteNacht: 'licht' | 'rust'
}

/**
 * Herstel uit je horloge: rusthartslag en hartslagvariabiliteit (HRV) van
 * afgelopen nacht, plus eerdere dagen voor je normaal (nieuwste eerst).
 */
export interface Herstel {
  rustHartslag: number | null
  rustHartslagHistorie: readonly number[]
  hrv: number | null
  hrvHistorie: readonly number[]
}

/** Alles wat de engine weet over vandaag. Elk veld mag leeg zijn: dan zwijgt de kaart erover. */
export interface Feiten {
  /** Amsterdamse dagsleutel YYYY-MM-DD. */
  datum: string
  /** Slaap van afgelopen nacht in minuten, of null als die niet bekend is. */
  slaapMinuten: number | null
  /** Slaap van eerdere nachten (minuten, nieuwste eerst), voor je normaal. */
  slaapHistorie: readonly number[]
  /** Stappen van gisteren, of null. */
  stappenGisteren: number | null
  /** Stappen van eerdere dagen (nieuwste eerst), voor je normaal. */
  stappenHistorie: readonly number[]
  /** De check-in van vanochtend, of null als je nog niet incheckte. */
  checkin: CheckIn | null
  /** De training die vandaag gepland staat, of null (rustdag of geen plan). */
  training: PlanDag | null
  /** Heeft de gebruiker überhaupt een weekplan ingevuld? */
  heeftPlan: boolean
  /** Streefbedtijd "HH:MM" uit je profiel, of null. */
  bedtijdStreef: string | null
  /** Afspraken van vandaag, of null als de agenda niet gekoppeld is. */
  afspraken: readonly Afspraak[] | null
  /** Grenzen van je trainer, of null zonder trainer. */
  grenzen: Grenzen | null
  /** Herstel uit je horloge, of null zonder horloge-data. */
  herstel: Herstel | null
  /** Laatst gemeten VO2max (ml/kg/min) van de afgelopen weken, of null. */
  vo2max: number | null
}

/** Het soort actie op de kaart. Elk soort hoort bij één regel uit de bibliotheek. */
export type ActieSoort =
  | 'training'
  | 'rust'
  | 'bewegen'
  | 'ademhaling'
  | 'bedtijd'
  | 'pauze'
  | 'minder'
  | 'checkin'
  | 'plan'

/** Wat de één-tik-knop bij een actie doet. */
export type Knop = 'oke' | 'herinner' | 'agenda' | 'checkin' | 'plan'

export interface Actie {
  /** Stabiel per dag en soort: zo kan een gekozen actie teruggevonden worden. */
  id: ActieSoort
  titel: string
  /** De reden, in één zin, op basis van feiten. */
  waarom: string
  knop: Knop
}

/** De grondtoon van de dag. */
export type Toon = 'normaal' | 'aanpassen' | 'rustig' | 'onbekend'

export interface Kaart {
  datum: string
  toon: Toon
  /** De kop in een paar woorden: "Licht trainen, rustig aan." */
  kop: string
  /** De feiten waarop de kaart rust, als korte zinnen. Nooit een verzonnen getal. */
  feiten: string[]
  /** Hooguit drie acties, belangrijkste eerst. */
  acties: Actie[]
  /** De training van vandaag zoals de kaart hem adviseert, of null. */
  training: { soort: string; advies: 'zoals_gepland' | 'lichter' | 'rust'; tijd: string | null } | null
}
