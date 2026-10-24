// ─── AI Your Gym: een voorbeeldschema uit de echte bibliotheek (SERVER) ─────
// De coaching komt uit de oefenbibliotheek van Club (src/lib/club/training/
// coaching), het beeld is onze eigen render of het 3D-figuur en de
// sets en herhalingen komen uit de regels van het schemavoorstel. Niets is
// voor de website herschreven: wat hier staat, staat zo in Club. Alleen het
// lid en de dag zijn een voorbeeld. De coaching in het Engels staat in
// woorden/website/coaching.ts (dezelfde tekst, vertaald).

import { oefening3dOpNaam } from '@/lib/club/training/3d'
import { COACHING_BOEKEN, coachingSleutel } from '@/lib/club/training/coaching'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { siteCoaching, type SiteCoachingTekst } from '@/lib/aiyourgym/taal/woorden/website/coaching'
import { dosering } from '@/lib/club/training/voorstel-regels'
import type { Patroon } from '@/lib/club/training/typen'

export interface VoorbeeldOefening {
  naam: string
  /** Kort voor de keuzeknoppen. */
  kort: string
  /** "3 x 8 tot 12, 90 sec rust" */
  voorschrift: string
  /** De losse waarden achter het voorschrift, om het in een andere taal te schrijven. */
  dosering: { sets: number; herhalingen: string; rustSec: number }
  coaching: SiteCoachingTekst
}

const KEUZE: readonly { naam: string; kort: string; patroon: Patroon }[] = [
  { naam: 'Back squat', kort: 'Back squat', patroon: 'squat' },
  { naam: 'Deadlift', kort: 'Deadlift', patroon: 'heupscharnier' },
  { naam: 'Push-up', kort: 'Push-up', patroon: 'duwen_horizontaal' },
  { naam: 'Barbell row', kort: 'Barbell row', patroon: 'trekken_horizontaal' },
]

/** "8-12" wordt "8 tot 12" (schrijfregel: bereiken met "tot"). */
export function toonBereik(herhalingen: string): string {
  return herhalingen.replace(/(\d+)\s*-\s*(\d+)/g, '$1 tot $2')
}

/** De oefeningen van het voorbeeldschema (doel spiermassa, gemiddeld niveau), met de coaching in een taal. */
export function voorbeeldOefeningen(taal: Taal = 'nl'): VoorbeeldOefening[] {
  return KEUZE.flatMap((k) => {
    const coaching = siteCoaching(k.naam, taal)
    if (!coaching || !oefening3dOpNaam(k.naam)) return []
    const d = dosering('spiermassa', k.patroon, 2)
    return [
      {
        naam: k.naam,
        kort: k.kort,
        voorschrift: `${d.sets} x ${toonBereik(d.herhalingen)}, ${d.rustSec} sec rust`,
        dosering: { sets: d.sets, herhalingen: d.herhalingen, rustSec: d.rustSec },
        coaching,
      },
    ]
  })
}

/** Hoeveel oefeningen uitgeschreven coaching hebben (geteld, niet geschat). */
export function aantalMetCoaching(): number {
  return new Set(COACHING_BOEKEN.flatMap((boek) => Object.keys(boek).map(coachingSleutel))).size
}
