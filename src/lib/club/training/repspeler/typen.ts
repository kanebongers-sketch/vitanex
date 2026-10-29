// ─── Club, rep-speler: gedeelde typen (PUUR) ────────────────────────────────
// De rep-speler speelt een Blender-render van een oefening altijd op 1 seconde
// heen en 1 seconde terug (besluit Kane 29-10-2026) en telt elke herhaling mee. Een render is een reeks losse beelden met
// vaste fases (frame-bereiken): rust aan het begin, de heenweg, vasthouden op
// het verste punt, de terugweg en rust aan het eind.

/** Een frame-bereik [eerste, laatste], beide inclusief. */
export type FrameBereik = readonly [number, number]

export interface FrameFases {
  rust_begin: FrameBereik
  heen: FrameBereik
  houden_ver: FrameBereik
  terug: FrameBereik
  rust_eind: FrameBereik
}

/** Is de heenweg in de render het remmende (excentrische) of het duwende/trekkende (concentrische) deel? */
export type HeenIs = 'excentrisch' | 'concentrisch'

/** Een herhalingsoefening (squat, curl) of een houdoefening op tijd (plank). */
export type RenderSoort = 'herhaling' | 'vasthouden'

/** Tempo in seconden, in de volgorde van de gangbare notatie (3110 = 3 omlaag, 1 vast, 1 omhoog, 0 vast). */
export interface Tempo {
  excentrisch: number
  /** Stilstand op het gerekte punt (onderin bij een squat). */
  pauzeGerekt: number
  concentrisch: number
  /** Stilstand op het samengetrokken punt (bovenin bij een squat). */
  pauzeSamen: number
}

/** De woorden die de speler bij een fase toont, passend bij de richting van de oefening. */
export interface FaseWoorden {
  heen: string
  terug: string
  vast: string
}

export type SegmentSoort = 'heen' | 'houden' | 'terug' | 'rust'

export interface Segment {
  soort: SegmentSoort
  /** Woord voor in beeld: "omlaag", "vast", "omhoog". */
  label: string
  /** Duur in seconden (groter dan 0). */
  duur: number
  /** Frames die dit segment afspeelt, van eerste naar laatste. */
  frames: FrameBereik
}

export interface HerhalingPlan {
  soort: 'herhaling'
  /** Aantal herhalingen (minstens 1). */
  reps: number
  /** Segmenten van een herhaling, in afspeelvolgorde. */
  segmenten: readonly Segment[]
  /** Duur van een herhaling in seconden. */
  repDuur: number
  /** Duur van de hele set: reps maal repDuur. */
  totaal: number
  frames: number
}

export interface VasthoudPlan {
  soort: 'vasthouden'
  /** Doeltijd in seconden. */
  doelSec: number
  totaal: number
  frames: number
  fps: number
  /** Het bereik dat tijdens het vasthouden in een lus speelt. */
  lus: FrameBereik
  label: string
}

export type RepPlan = HerhalingPlan | VasthoudPlan

/** Wat er op tijdstip t in beeld staat. */
export interface Stand {
  /** Frame-index, altijd tussen 0 en frames - 1. */
  frame: number
  /** De herhaling die nu loopt, 1 tot en met reps (bij vasthouden 1). */
  rep: number
  /** Afgeronde herhalingen. */
  gedaan: number
  /** Fasewoord: "omlaag", "vast", "omhoog". */
  label: string
  segment: SegmentSoort
  /** Index van het segment binnen de herhaling (voor het tikje bij een nieuwe fase). */
  segmentIndex: number
  /** 0 tot 1: hoe ver in het huidige segment. */
  deel: number
  /** 0 tot 1: hoe ver in de huidige herhaling (bij vasthouden: van de doeltijd). */
  voortgang: number
  /** Seconden over in de set. */
  over: number
  klaar: boolean
}
