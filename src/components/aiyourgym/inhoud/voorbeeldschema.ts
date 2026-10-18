// ─── AI Your Gym: een voorbeeldschema uit de echte bibliotheek (SERVER) ─────
// De coaching komt uit de oefenbibliotheek van Club (src/lib/club/training/
// coaching), de beelden uit de RepDB-koppeling en de sets en herhalingen uit
// de regels van het schemavoorstel. Niets is voor de website herschreven: wat
// hier staat, staat zo in Club. Alleen het lid en de dag zijn een voorbeeld.

import { COACHING_BOEKEN, coachingVoor } from '@/lib/club/training/coaching'
import type { Coaching } from '@/lib/club/training/coaching/typen'
import { REPDB_KOPPELING } from '@/lib/club/training/beelden-repdb'
import { dosering } from '@/lib/club/training/voorstel-regels'
import type { Patroon } from '@/lib/club/training/typen'

export interface VoorbeeldOefening {
  naam: string
  /** Kort voor de keuzeknoppen. */
  kort: string
  beeldStart: string
  beeldEind: string
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

function beeldId(naam: string): string | null {
  return REPDB_KOPPELING.find((k) => k.naam === naam)?.id ?? null
}

/** De oefeningen van het voorbeeldschema (doel spiermassa, gemiddeld niveau). */
export function voorbeeldOefeningen(): VoorbeeldOefening[] {
  return KEUZE.flatMap((k) => {
    const coaching = coachingVoor(k.naam)
    const id = beeldId(k.naam)
    if (!coaching || !id) return []
    const d = dosering('spiermassa', k.patroon, 2)
    return [
      {
        naam: k.naam,
        kort: k.kort,
        beeldStart: `/club/oefeningen-repdb/${id}-start.webp`,
        beeldEind: `/club/oefeningen-repdb/${id}-eind.webp`,
        voorschrift: `${d.sets} x ${toonBereik(d.herhalingen)}, ${d.rustSec} sec rust`,
        coaching,
      },
    ]
  })
}

/** Hoeveel oefeningen er uitgeschreven coaching hebben (geteld, niet geschat). */
export function aantalMetCoaching(): number {
  return COACHING_BOEKEN.reduce((som, boek) => som + Object.keys(boek).length, 0)
}

/** Hoeveel oefeningen een RepDB-illustratie hebben. */
export function aantalMetBeeld(): number {
  return REPDB_KOPPELING.length
}
