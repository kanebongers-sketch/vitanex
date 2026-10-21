// ─── Fit Factory Club, 3D-oefenbeelden: lichaamsmaten (PUUR) ─────────────────
// Een man van ongeveer 1,80 m. Alle maten in meter, gemeten tussen de
// draaipunten van de gewrichten. Verhoudingen volgen gangbare antropometrie
// (dij ongeveer 0,245 en scheen 0,24 van de lengte).

export const MATEN = {
  dij: 0.44,
  scheen: 0.43,
  /** Bovenarm: schouder tot elleboog. */
  bovenarm: 0.3,
  /** Onderarm: elleboog tot pols. */
  onderarm: 0.265,
  /** Pols tot het midden van de greep. */
  hand: 0.085,
  /** Halve afstand tussen de heupgewrichten. */
  heupBreedte: 0.092,
  /** Bekken tot begin van de onderrug, onderrug tot borst. */
  bekkenNaarLende: { y: 0.09, z: -0.015 },
  lende: 0.14,
  /** Borst: onderkant tot de nekbasis. */
  borst: 0.29,
  /** Schoudergewricht in de borst (links; rechts gespiegeld). */
  schouder: { x: 0.178, y: 0.25, z: -0.02 },
  nek: 0.1,
} as const

/** Lengte van arm (tot de greep) of been (tot de enkel), voor de inverse kinematica. */
export const ARM_GREEP = MATEN.onderarm + MATEN.hand
export const BEEN = MATEN.dij + MATEN.scheen

/** Anatomische grenzen voor gezonde uitvoering (graden). */
export const GRENZEN = {
  kniebuiging: { min: 0, max: 150 },
  elleboogbuiging: { min: 0, max: 150 },
  heupbuiging: { min: -20, max: 140 },
  lende: { min: -15, max: 25 },
  borst: { min: -15, max: 35 },
  /**
   * Nek: strekken tot -45 (de halswervels strekken tot ongeveer 60 graden), zodat
   * de blik vooruit kan blijven als de romp ver voorover kantelt (back squat).
   * Buigen tot 35 (kin naar de borst gaat tot ongeveer 50).
   */
  nek: { min: -45, max: 35 },
  schouders: { min: -0.04, max: 0.05 },
} as const
