// ─── AI Your Gym: een voorbeeldschema uit de echte bibliotheek (SERVER) ─────
// De coaching komt uit de oefenbibliotheek van Club (src/lib/club/training/
// coaching), het beeld is ons eigen 3D-figuur (src/lib/club/training/3d) en de
// sets en herhalingen komen uit de regels van het schemavoorstel. Niets is
// voor de website herschreven: wat hier staat, staat zo in Club. Alleen het
// lid en de dag zijn een voorbeeld.

import { oefening3dOpNaam } from '@/lib/club/training/3d'
import { COACHING_BOEKEN, coachingSleutel, coachingVoor } from '@/lib/club/training/coaching'
import type { Coaching } from '@/lib/club/training/coaching/typen'
import { dosering } from '@/lib/club/training/voorstel-regels'
import type { Patroon } from '@/lib/club/training/typen'

export interface VoorbeeldOefening {
  naam: string
  /** Kort voor de keuzeknoppen. */
  kort: string
  /** "3 x 8 tot 12, 90 sec rust" */
  voorschrift: string
  coaching: Coaching
}

const KEUZE: readonly { naam: string; kort: string; patroon: Patroon }[] = [
  { naam: 'Goblet squat', kort: 'Goblet squat', patroon: 'squat' },
  { naam: 'Roemeense deadlift met dumbbells', kort: 'Roemeense deadlift', patroon: 'heupscharnier' },
  { naam: 'Dumbbell bankdrukken', kort: 'Bankdrukken', patroon: 'duwen_horizontaal' },
  { naam: 'Lat pulldown', kort: 'Lat pulldown', patroon: 'trekken_verticaal' },
]

/** "8-12" wordt "8 tot 12" (schrijfregel: bereiken met "tot"). */
export function toonBereik(herhalingen: string): string {
  return herhalingen.replace(/(\d+)\s*-\s*(\d+)/g, '$1 tot $2')
}

/** De oefeningen van het voorbeeldschema (doel spiermassa, gemiddeld niveau). */
export function voorbeeldOefeningen(): VoorbeeldOefening[] {
  return KEUZE.flatMap((k) => {
    const coaching = coachingVoor(k.naam)
    if (!coaching || !oefening3dOpNaam(k.naam)) return []
    const d = dosering('spiermassa', k.patroon, 2)
    return [
      {
        naam: k.naam,
        kort: k.kort,
        voorschrift: `${d.sets} x ${toonBereik(d.herhalingen)}, ${d.rustSec} sec rust`,
        coaching,
      },
    ]
  })
}

/** Hoeveel oefeningen uitgeschreven coaching hebben (geteld, niet geschat). */
export function aantalMetCoaching(): number {
  return new Set(COACHING_BOEKEN.flatMap((boek) => Object.keys(boek).map(coachingSleutel))).size
}
