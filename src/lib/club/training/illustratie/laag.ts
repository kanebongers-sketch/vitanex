// ─── Fit Factory Club, illustraties: lagen (PUUR) ───────────────────────────
// Een beeld is een vaste reeks lagen: elk een pad met een kleurrol. De rollen
// worden in CSS kleuren (illustratie.css), zodat licht, donker en de
// accentkleur van de sportschool zonder nieuwe tekening werken.
// De volgorde van de vakken is de diepte: van achter naar voor.

// Het nabije been ligt onder de romp: zo vallen de bilspieren over de bovenkant van het bovenbeen.
export const VAKKEN = ['achter', 'ver', 'verVoor', 'verHand', 'midden', 'beenNabij', 'romp', 'tussen', 'armNabij', 'voor', 'hand', 'top'] as const
export type Vak = (typeof VAKKEN)[number]

export const KLEUREN = [
  'vloer',
  'huid', 'huidVer', 'huidNabij', 'schaduw', 'glans',
  'spier', 'spierZacht', 'spierVer', 'spierVerZacht',
  'haar', 'schoen', 'schoenVer', 'zool',
  'metaal', 'metaalDonker', 'schijf', 'schijfVer', 'schijfRand', 'schijfGlas',
  'kussen', 'kussenVer', 'frame', 'frameVer', 'kabel',
] as const
export type Kleur = (typeof KLEUREN)[number]

export interface Laag {
  /** Vast per onderdeel, ook tussen standen: zo weet de animatie welk pad bij welk hoort. */
  readonly sleutel: string
  readonly d: string
  readonly kleur: Kleur
  /** Een lijn in plaats van een vlak (dikte in cm). */
  readonly lijn?: number
  /** Gaten in de vorm (handvat van een kettlebell). */
  readonly evenodd?: boolean
}

export type Lagen = Record<Vak, Laag[]>

export function legeLagen(): Lagen {
  return { achter: [], ver: [], verVoor: [], verHand: [], midden: [], romp: [], beenNabij: [], tussen: [], armNabij: [], voor: [], hand: [], top: [] }
}

/** Alle lagen achter elkaar, van achter naar voor. */
export function opVolgorde(l: Lagen): Laag[] {
  return VAKKEN.flatMap((v) => l[v])
}

/** Voeg lagen samen per vak (nieuwe objecten, niets wordt aangepast). */
export function voegSamen(...delen: Partial<Lagen>[]): Lagen {
  const uit = legeLagen()
  for (const vak of VAKKEN) uit[vak] = delen.flatMap((d) => d[vak] ?? [])
  return uit
}
