// ─── Fit Factory Club, illustraties: typen (PUUR) ───────────────────────────
// Een oefening is een begin- en een eindhouding als data (gewrichtshoeken),
// plus het materiaal. Tussen de twee houdingen rekenen we elke stand uit door
// alle getallen te mengen (interpolatie.ts) en daarna de kinematica opnieuw te
// draaien: handen en voeten blijven zo vast op het materiaal en de vloer.

import type { Spier } from '../spieren'
import type { Vec } from './vec'

/** Een punt op het lichaam waar materiaal aan vast kan zitten, of dat een anker is. */
export type Lichaamspunt =
  | 'heup'
  | 'enkelNabij' | 'enkelVer'
  | 'balNabij' | 'balVer'
  | 'hielNabij' | 'hielVer'
  | 'knieNabij' | 'knieVer'
  | 'elleboogNabij' | 'elleboogVer'
  | 'handNabij' | 'handVer'
  | 'schouder'

/** Waar een hand of voet heen moet: een vast punt, of een ankerpunt van een stuk materiaal. */
export type Doel =
  | { readonly wereld: Vec }
  | { readonly materiaal: string; readonly punt: string; readonly verschuif?: Vec }

export interface ArmHoeken {
  /** Absolute hoek van de bovenarm (180 = hangt omlaag). */
  readonly schouder: number
  /** Buiging in de elleboog in graden (0 = gestrekt); de onderarm draait naar voren. */
  readonly elleboog: number
}

export interface BeenHoeken {
  /** Absolute hoek van het bovenbeen (180 = recht omlaag, 90 = horizontaal naar voren). */
  readonly heup: number
  /** Buiging in de knie in graden (0 = gestrekt); het onderbeen draait naar achteren. */
  readonly knie: number
  /** Absolute hoek van de voet van hiel naar teen (90 = plat, naar voren). */
  readonly voet: number
}

export type ArmHouding =
  | { readonly hoeken: ArmHoeken; readonly pols?: number }
  /**
   * Naar een doel. `lengte` = zichtbare fractie van bovenarm en onderarm: bij een brede
   * greep wijst de arm deels van de kijker af en lijkt hij in zijaanzicht korter.
   */
  | { readonly doel: Doel; readonly buig: 1 | -1; readonly lengte?: readonly [boven: number, onder: number] }

export type BeenHouding =
  | { readonly hoeken: BeenHoeken }
  /** Het doel is de enkel, of met `bal` de bal van de voet (de voet draait daar om). */
  | { readonly doel: Doel; readonly buig: 1 | -1; readonly voet: number; readonly bal?: boolean }

/** Een plek voor materiaal: vast in de ruimte, of vast aan een deel van het lichaam. */
export type Plek =
  | { readonly wereld: Vec }
  | { readonly aan: 'bekken' | 'lumbaal' | 'thoracaal'; readonly langs: number; readonly dwars: number }
  | { readonly aan: 'handNabij' | 'handVer'; readonly langs?: number; readonly dwars?: number }

export type MateriaalSoort =
  | 'barbell' | 'dumbbell' | 'dumbbellStaand' | 'kettlebell'
  | 'bank' | 'schuineBank' | 'rek'
  | 'kabelkolom' | 'handvat' | 'latstang'
  | 'legPress' | 'latPulldown' | 'seatedRow'

export interface MateriaalHouding {
  readonly id: string
  readonly soort: MateriaalSoort
  readonly plek: Plek
  /** Draaiing in graden (voor een schuine bank, een gekantelde dumbbell). */
  readonly hoek?: number
  /** Getallen per soort, bijvoorbeeld de grootte van de schijven of de stand van een slede. */
  readonly maat?: Readonly<Record<string, number>>
  /** Vanaf welk punt een kabel naar dit stuk loopt (handvat, latstang). */
  readonly kabelVan?: Vec
}

export interface ZijHouding {
  readonly aanzicht: 'zij'
  /** Absolute hoek van het bekken (0 = rechtop). */
  readonly bekken: number
  /** Ten opzichte van het bekken: lage rug. Neutraal ongeveer 0. */
  readonly lumbaal: number
  /** Ten opzichte van de lage rug: borstwervels. */
  readonly thoracaal: number
  /** Ten opzichte van de borstwervels: nek en hoofd. */
  readonly hoofd: number
  /** Schouderbladen in cm: positief naar voren (gespreid), negatief naar achteren (samen). */
  readonly schouderblad: number
  readonly armNabij: ArmHouding
  readonly armVer: ArmHouding
  readonly beenNabij: BeenHouding
  readonly beenVer: BeenHouding
  /** Dit punt van het lichaam staat vast op deze plek; de rest hangt eraan. */
  readonly anker: { readonly punt: Lichaamspunt; readonly op: Vec }
  readonly materiaal: readonly MateriaalHouding[]
}

export interface VoorHouding {
  readonly aanzicht: 'voor'
  /** Midden tussen de heupen, in de ruimte. */
  readonly heup: Vec
  /** Spreiding van de armen: hoek van de bovenarm vanaf de romp (0 = langs het lichaam). */
  readonly armSpreiding: number
  /** Buiging in de elleboog (0 = gestrekt). */
  readonly elleboog: number
  /** Spreiding van de benen in graden. */
  readonly beenSpreiding: number
  /** Buiging in de knieen (alleen zichtbaar als iets korter bovenbeen). */
  readonly knie: number
  readonly materiaal: readonly MateriaalHouding[]
}

export type Houding = ZijHouding | VoorHouding

/** Welke kant van de herhaling de spier zwaar laat werken (bepaalt het tempo). */
export type Richting = 'concentrisch' | 'excentrisch'

export interface Oefening {
  /** De exacte naam in de bibliotheek (club_oefeningen.naam). */
  readonly naam: string
  /** Bestandsnaam van het huidige RepDB-beeld, ter vergelijking. */
  readonly repdb: string
  readonly begin: Houding
  readonly eind: Houding
  /** Van begin naar eind: is dat de zware (concentrische) of de zakkende (excentrische) fase? */
  readonly heen: Richting
  readonly spieren: { readonly primair: readonly Spier[]; readonly secundair: readonly Spier[] }
  /**
   * Waar de nabije schijf van een barbell staat ten opzichte van de stang, als in een
   * lichte draaiing van de camera (de verre schijf staat er gespiegeld achter).
   * Standaard 24 cm naar voren.
   */
  readonly plaatSchuif?: Vec
  /** Wat het beeld moet laten zien, afgeleid van de kernpunten van de coaching. */
  readonly toont: readonly string[]
}
