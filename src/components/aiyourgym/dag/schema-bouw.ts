// ─── AI Your Gym: de schemabouw, de piek van de voorpagina (PUUR) ───────────
// Een vastgezet podium waarop een trainingsschema zich opbouwt terwijl je scrolt:
// intake, oefeningen, kernpunten, en dan landt het op de telefoon van het lid.
// Hier de voortgang van het podium en wat er bij een voortgang te zien is.

export const FASEN = ['intake', 'oefeningen', 'coaching', 'app'] as const
export type Fase = (typeof FASEN)[number]

/** Waar elke fase begint en eindigt (deel van de vastgezette scroll). */
export const GRENZEN: Readonly<Record<Fase, readonly [number, number]>> = {
  intake: [0, 0.2],
  oefeningen: [0.2, 0.5],
  coaching: [0.5, 0.74],
  app: [0.74, 1],
}

/** Binnen een fase komen de onderdelen in dit deel op; daarna staat alles even stil. */
const OPKOMST = 0.85

/**
 * Hoe ver het vastgezette podium is: 0 als het net vastzit, 1 als het loslaat.
 * top = afstand van de bovenkant van het spoor tot de bovenkant van het scherm,
 * kop = hoogte van de vaste sitekop (daar plakt het podium onder).
 */
export function pinVoortgang(top: number, hoogte: number, schermHoogte: number, kop = 0): number {
  const reis = hoogte - (schermHoogte - kop)
  if (reis <= 1) return top < kop ? 1 : 0
  return Math.min(1, Math.max(0, (kop - top) / reis))
}

/** De fase bij een voortgang. */
export function faseVan(p: number): Fase {
  return FASEN.find((f) => p < GRENZEN[f][1]) ?? 'app'
}

/** Hoe ver een fase is (0 tot 1). */
export function binnenFase(p: number, fase: Fase): number {
  const [van, tot] = GRENZEN[fase]
  return Math.min(1, Math.max(0, (p - van) / (tot - van)))
}

/** Hoeveel van n onderdelen er in een fase al te zien zijn. */
export function zichtbaar(p: number, fase: Fase, n: number): number {
  const k = Math.min(1, binnenFase(p, fase) / OPKOMST)
  return Math.min(n, Math.max(0, Math.ceil(k * n - 1e-9)))
}

export interface Stand {
  fase: Fase
  /** Aantal intakegegevens, oefeningen en kernpunten in beeld. */
  intake: number
  rijen: number
  kern: number
  /** Hoe ver de telefoon is binnengekomen (0 tot 1, afgerond op twee decimalen). */
  app: number
}

export interface Aantallen {
  intake: number
  rijen: number
  kern: number
}

/** Rustig binnenkomen en zacht landen. */
function zacht(x: number): number {
  return 1 - Math.pow(1 - x, 3)
}

/** Wat er op het podium staat bij een voortgang. */
export function standVan(p: number, n: Aantallen): Stand {
  return {
    fase: faseVan(p),
    intake: zichtbaar(p, 'intake', n.intake),
    rijen: zichtbaar(p, 'oefeningen', n.rijen),
    kern: zichtbaar(p, 'coaching', n.kern),
    app: Math.round(zacht(Math.min(1, binnenFase(p, 'app') / OPKOMST)) * 100) / 100,
  }
}

/** De eindstand: alles in beeld (zonder scrollbeweging, op de telefoon en bij minder beweging). */
export function eindStand(n: Aantallen): Stand {
  return { fase: 'app', intake: n.intake, rijen: n.rijen, kern: n.kern, app: 1 }
}

/** Gelijk als alles wat je ziet gelijk is (om React alleen bij een echte wissel te laten tekenen). */
export function zelfdeStand(a: Stand, b: Stand): boolean {
  return a.fase === b.fase && a.intake === b.intake && a.rijen === b.rijen && a.kern === b.kern && a.app === b.app
}
