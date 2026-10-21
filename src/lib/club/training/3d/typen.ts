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
  'voetY', // beide enkels omhoog ten opzichte van de vaste plek (m), voor machines en calf raise
  'voetZ', // beide enkels naar voren ten opzichte van de vaste plek (m)
  'voetKantel', // extra kanteling van beide voeten (graden, positief = tenen omlaag)
  'stapY', // alleen de rechtervoet: extra omhoog (m), voor een stap
  'stapZ', // alleen de rechtervoet: extra naar voren (m)
  'stapKantel', // alleen de rechtervoet: extra kanteling (graden)
  // Asymmetrie en polsen. Alles 0 = beide kanten gespiegeld, zoals altijd.
  'handRechtsX', // alleen de rechterhand: verschuiving ten opzichte van de gespiegelde linkerhand (m, wereld)
  'handRechtsY',
  'handRechtsZ',
  'draai', // polsdraai van beide handen om de onderarm (graden, positief = richting supinatie), zie `greepAnatomisch`
  'draaiRechts', // alleen de rechterhand: extra polsdraai bovenop `draai` (graden)
  'elleboog', // draait de elleboog om de lijn schouder-hand (graden, rechts gespiegeld), bijvoorbeeld naar buiten bij een Arnold press
  'rol', // romp gedraaid om de lengteas (graden): met kantel 90 en rol -90 ligt het figuur op de linkerzij
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

export interface Voetstand {
  readonly kanteling: number
  readonly uitdraai: number
  readonly rol?: number
}

export interface Vec3 {
  readonly x: number
  readonly y: number
  readonly z: number
}

/**
 * Waar de last zit: vast in de wereld (lastY en lastZ), op de rug (squat, lastY en
 * lastZ in de borst) of hangend aan gestrekte armen (deadlift: lastZ telt, de
 * hoogte volgt uit de schouders) of op de heupen (hip thrust, lastY en lastZ in
 * het bekken).
 */
export type LastBevestiging = 'wereld' | 'romp' | 'hangend' | 'bekken'

/**
 * Greep: hand om een stang of halter, of plat op een vlak (vloer, bank, knie,
 * heup). Plat ligt de handpalm naar beneden met de vingers naar +z; het kanaal
 * `draai` draait de vingers dan om de verticale as (positief = naar buiten).
 */
export type HandModus = 'greep' | 'plat'

export type MateriaalSoort =
  | 'stang' // barbell aan de last
  | 'curlStang' // korte stang zonder schijven aan de last (curl, kabel)
  | 'halters' // een dumbbell in elke hand
  | 'halterStaand' // een dumbbell verticaal in beide handen (goblet)
  | 'kettlebell' // een kettlebell aan beide handen
  | 'trapBar' // zeskantige trap bar, handvatten aan de zijkant (greep 0,28)
  | 'halterDwars' // een dumbbell dwars aan de last (hip thrust), handen naast elkaar op de greep
  | 'bank' // vlakke bank met steunen voor de stang
  | 'bankKaal' // vlakke bank zonder steunen, te draaien (hip thrust: dwars)
  | 'bankSchuin' // verstelbare bank, rugleuning op `hoek` graden
  | 'bankRug' // bank met rechte rugleuning
  | 'kabelstation' // lat pulldown met stang
  | 'kabel' // kabeltoren met katrol op `plek`, greep volgens `greep`
  | 'kabelAchter' // kabelkolom achter de sporter (rug naar het toestel), katrol op `plek`, greep volgens `greep`
  | 'legPress' // leg press met plateau aan de voeten
  | 'beenMachine' // leg extension of leg curl zittend, kussen aan de enkels
  | 'chestPress' // chest press machine, grepen aan de handen
  | 'reverseFly' // reverse fly machine: borstkussen, hefbomen draaien boven de schouders
  | 'kuitMachine' // staande kuitmachine met verhoging en schouderkussens
  | 'kabelLaag' // kabelkolom met de katrol laag op `plek` (curl), greep volgens `greep`
  | 'ezStang' // EZ-curlstang met schuine handgrepen en kleine schijven, aan de last
  | 'curlMachine' // biceps curl machine: zitting, schuin armkussen, hefboom om de ellebogen
  | 'schouderPress' // shoulder press machine, hefbomen met grepen aan de handen (zie bouw/schouderpress)
  | 'pecDeck' // pec deck (butterfly), armen draaien om een as boven de schouders
  | 'kabelCrossover' // crossover-station met twee hoge katrollen, torens op z = `plek.z`
  | 'smith' // smith machine: frame en geleidestangen, de stang op z = `plek.z`
  | 'verhoging' // lage plank onder de voorvoeten
  | 'mat'
  | 'roeiMachine' // seated row machine met borstkussen, hefbomen en grepen aan de handen
  | 'buikBank' // schuine roeibank om met de borst op te liggen (row met borststeun), ligt tegen de romp
  | 'tBar' // T-bar row: stang vanuit een scharnier op de vloer, schijven voorop, greep aan de handen

export type KabelGreep = 'stang' | 'touw' | 'vgreep' | 'handvat' | 'lat'

export interface Materiaal {
  readonly soort: MateriaalSoort
  /** Plek van vast materiaal in de wereld (bank, station, mat, katrol van de kabel). */
  readonly plek?: Vec3
  /** Halters: alleen de halter in deze hand (eenarmige oefening). Zonder: in beide handen. */
  readonly zijde?: 'links' | 'rechts'
  /** Gewicht als aantal schijven per kant (stang) of grootte (halters). */
  readonly schijven?: number
  /** Draaiing om de verticale as in graden (dwarse bank). */
  readonly draai?: number
  /** Hoek van een rugleuning in graden boven horizontaal (schuine bank, machine). */
  readonly hoek?: number
  /** Welke greep aan een kabel hangt. */
  readonly greep?: KabelGreep
  /** Beenmachine: kussen voor (extension) of achter (curl) de enkels. */
  readonly variant?: 'extension' | 'curl'
}

export type Lichaamsdeel =
  | 'dij'
  | 'hamstring' // achterkant van de dij
  | 'kuit'
  | 'bil'
  | 'romp'
  | 'borst'
  | 'rug'
  | 'onderrug' // rugstrekkers laag in de rug
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

/**
 * Blik: het hoofd houdt een hoek ten opzichte van de wereld (borst omhoog, blik
 * vooruit) in plaats van mee te kantelen met de romp. De nek vangt het verschil
 * op, binnen GRENZEN.nek.
 */
export interface Blik {
  /** Richting van de blik in graden onder horizontaal: 0 = recht vooruit, 40 = naar de vloer een paar meter verderop. */
  readonly hoek: number
  /** Hoeveel de blik het wint van het kanaal nek (0 tot 1, standaard 1): 0,5 = halverwege meekantelen en de wereldhoek. */
  readonly sterkte?: number
}

export interface Oefening3d {
  readonly naam: string
  readonly sleutels: readonly Sleutel[]
  readonly last: LastBevestiging
  readonly handen: HandModus
  /** Enkel van de linkervoet (rechts gespiegeld in x). */
  readonly enkel: Vec3
  /**
   * Voet: kanteling (90 = op de tenen, tenen naar beneden), tenen naar buiten en
   * rol om de lengte van de voet (graden, op de zij liggen). Uitdraai en rol worden
   * voor rechts gespiegeld, ook bij `voetRechts`.
   */
  readonly voet: Voetstand
  /** Richting waar knie en elleboog heen buigen, voor de linkerkant (x wordt gespiegeld). */
  readonly knieRichting: Vec3
  readonly elleboogRichting: Vec3
  /** Rechtervoet op een eigen plek (lunge, split squat). Zonder: gespiegeld van links. */
  readonly enkelRechts?: Vec3
  readonly voetRechts?: Voetstand
  /**
   * Eigen buigrichting voor de rechterknie of -elleboog, als wereldrichting (niet
   * gespiegeld). Nodig als het figuur op de zij ligt of de armen iets anders doen.
   */
  readonly knieRichtingRechts?: Vec3
  readonly elleboogRichtingRechts?: Vec3
  /** Rechterhand anders dan links: plat (steunt op knie of bank) of om een greep. */
  readonly handenRechts?: HandModus
  /**
   * De greep draait mee met de onderarm in plaats van een vaste richting in de
   * wereld aan te houden. `draai` is dan de polsstand: 0 = bovenhands (pronatie),
   * 90 = neutraal (duim boven, hammer), 180 = onderhands (supinatie). Zo blijft
   * de hand bij een curl of press vloeiend en anatomisch, voor beide handen.
   */
  readonly greepAnatomisch?: boolean
  /**
   * Richting van het handvat in de wereld voor de linkerhand (neutrale greep,
   * touw), van de duim naar de pink. Rechts wordt gespiegeld. Zonder: langs de
   * last (dwars, x). Bij `greepAnatomisch` niet gebruikt.
   */
  readonly greepRichting?: Vec3
  readonly materiaal: readonly Materiaal[]
  /** Werkende spieren (primair): krijgen de volle accentkleur. */
  readonly spieren: readonly Lichaamsdeel[]
  /** Meewerkende spieren (secundair): krijgen de accentkleur zachter, zie spieren.ts. */
  readonly spierenSecundair?: readonly Lichaamsdeel[]
  readonly camera: Camera
  /** Blik vooruit in de wereld; zonder volgt het hoofd de romp plus het kanaal nek. */
  readonly blik?: Blik
  /**
   * Waar in de lus het afspelen begint (fractie 0 tot 1 van de lusduur). Zo valt het
   * belangrijkste moment op een logische plek, zie `startVoorSleutel()`.
   */
  readonly start?: number
  /**
   * Heup en knie samen: tussen twee sleutels buigt de knie in hetzelfde tempo als de
   * andere kanalen en volgt de hoogte van het bekken daaruit. Zonder zakt het bekken
   * lineair en buigt de knie bovenin eerst (knie-eerst).
   */
  readonly kniePad?: boolean
}
