// ─── Fit Factory Club, 3D-oefenbeelden: typen (PUUR) ─────────────────────────
// Een oefening is een lus van sleutelhoudingen. Elke houding zet ALLE kanalen
// (bekken, wervelkolom, nek, schouders, last en greep). Armen en benen worden
// niet als hoeken opgeslagen maar met inverse kinematica naar hun vaste punt
// gerekend: voeten blijven zo op de vloer en handen aan de stang.
//
// Assen (meter): y omhoog, het figuur kijkt standaard naar +z, x is de linkerkant
// van het figuur. Positieve buiging (kantel, lende, borst, nek) = naar voren (+z).

/** De kanalen die elke sleutelhouding volledig moet invullen. */
export const KANALEN = [
  'bekkenY', // hoogte van het heupgewricht (m)
  'bekkenZ', // voor/achter van het heupgewricht (m)
  'kantel', // bekken naar voren gekanteld (graden), -90 = op de rug, 90 = op de buik
  'lende', // buiging onderrug (graden)
  'borst', // buiging bovenrug (graden)
  'nek', // buiging nek (graden)
  'schouders', // schouderbladen omhoog (+) of omlaag (-) (m)
  'lastY', // hoogte van de last of van de handen (m)
  'lastZ', // voor/achter van de last (m)
  'greep', // halve afstand tussen de handen (m)
] as const

export type Kanaal = (typeof KANALEN)[number]

export type Houding = Readonly<Record<Kanaal, number>>

export interface Sleutel {
  readonly houding: Houding
  /** Seconden stil op deze houding (pauze boven of onder). */
  readonly vast: number
  /** Seconden van deze houding naar de volgende. */
  readonly naarVolgende: number
}

export interface Vec3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

/**
 * Waar de last zit: vast in de wereld (lastY en lastZ), op de rug (squat, lastY en
 * lastZ in de borst) of hangend aan gestrekte armen (deadlift: lastZ telt, de
 * hoogte volgt uit de schouders).
 */
export type LastBevestiging = 'wereld' | 'romp' | 'hangend'

/** Greep: hand om een stang of halter, of plat op de vloer (push-up). */
export type HandModus = 'greep' | 'plat'

export type MateriaalSoort = 'stang' | 'halters' | 'bank' | 'bankRug' | 'kabelstation' | 'mat'

export interface Materiaal {
  readonly soort: MateriaalSoort
  /** Plek van vast materiaal in de wereld (bank, station, mat). */
  readonly plek?: Vec3
  /** Gewicht als aantal schijven per kant (stang) of grootte (halters). */
  readonly schijven?: number
}

export type Lichaamsdeel =
  | 'dij'
  | 'kuit'
  | 'bil'
  | 'romp'
  | 'borst'
  | 'rug'
  | 'schouder'
  | 'bovenarm'
  | 'onderarm'

export interface Camera {
  /** Draaiing om het figuur, 0 = recht van voren, positief = vanaf links van het figuur. */
  readonly hoek: number
  /** Hoogte van de blik in graden boven horizontaal. */
  readonly hoogte: number
  readonly afstand: number
  readonly doel: Vec3
}

export interface Oefening3d {
  readonly naam: string
  readonly sleutels: readonly Sleutel[]
  readonly last: LastBevestiging
  readonly handen: HandModus
  /** Enkel van de linkervoet (rechts gespiegeld in x). */
  readonly enkel: Vec3
  /** Voet: kanteling (90 = op de tenen, tenen naar beneden) en tenen naar buiten (graden). */
  readonly voet: { readonly kanteling: number; readonly uitdraai: number }
  /** Richting waar knie en elleboog heen buigen, voor de linkerkant (x wordt gespiegeld). */
  readonly knieRichting: Vec3
  readonly elleboogRichting: Vec3
  readonly materiaal: readonly Materiaal[]
  /** Werkende spieren: krijgen de accentkleur. */
  readonly spieren: readonly Lichaamsdeel[]
  readonly camera: Camera
}
