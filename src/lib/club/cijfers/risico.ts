// ─── Fit Factory Club: leden met risico op Vandaag (PUUR) ───────────────────
// Een definitie voor de hele clubsoftware: "risico" is het label van de
// behoudsscore (src/lib/club/leden/behoud.ts, score onder 45), gerekend met
// bezoeken op alle vestigingen, net als op de ledenkaart. Hier alleen de
// selectie, de volgorde en de tekst "23 dagen weg".

import type { Lid } from '@/lib/club/kern/lid'
import type { Behoud } from '@/lib/club/leden/behoud'
import type { LedenRij } from '@/lib/club/leden/lijst'
import { dagenTussen, dagKort, dagSleutel } from './tijd'

export interface RisicoLid {
  lid: Lid
  behoud: Behoud
}

const NL = new Intl.Collator('nl', { sensitivity: 'base' })

/** Wie nooit (in 12 weken) kwam, is het langst weg. */
function wegSleutel(b: Behoud): number {
  return b.dagenSinds ?? Number.POSITIVE_INFINITY
}

/**
 * De leden met label risico, meest urgent eerst: laagste behoudsscore, dan
 * langst niet geweest, dan op achternaam.
 */
export function risicoLijst(rijen: readonly LedenRij[]): RisicoLid[] {
  const uit: RisicoLid[] = []
  for (const r of rijen) if (r.behoud?.label === 'risico') uit.push({ lid: r.lid, behoud: r.behoud })
  return uit.sort(
    (a, b) =>
      a.behoud.score - b.behoud.score ||
      wegSleutel(b.behoud) - wegSleutel(a.behoud) ||
      NL.compare(`${a.lid.achternaam} ${a.lid.voornaam}`, `${b.lid.achternaam} ${b.lid.voornaam}`),
  )
}

export interface WegTekst {
  /** Het getal dat groot staat ("23"), of null als er geen getal is. */
  getal: number | null
  tekst: string
}

/** "3 mei", met het jaartal erbij als het een ander jaar is dan vandaag. */
export function datumTekst(dag: string, vandaag: string): string {
  return dag.slice(0, 4) === vandaag.slice(0, 4) ? dagKort(dag) : `${dagKort(dag)} ${dag.slice(0, 4)}`
}

function dagenWeg(dagen: number): WegTekst {
  if (dagen <= 0) return { getal: null, tekst: 'Vandaag geweest' }
  return { getal: dagen, tekst: dagen === 1 ? 'dag weg' : 'dagen weg' }
}

/**
 * Hoe lang een lid weg is. `dagenSinds` komt uit de behoudsscore (12 weken);
 * `laatsteOoit` is het laatste bezoek ooit, voor wie langer weg is: null =
 * nooit geweest, undefined = niet opgezocht of niet te lezen.
 */
export function wegTekst(dagenSinds: number | null, laatsteOoit: Date | null | undefined, lidSinds: string | null, vandaag: string): WegTekst {
  if (dagenSinds !== null) return dagenWeg(dagenSinds)
  if (laatsteOoit === undefined) return { getal: null, tekst: 'Langer dan 12 weken niet geweest' }
  if (laatsteOoit) return dagenWeg(dagenTussen(dagSleutel(laatsteOoit), vandaag))
  if (lidSinds) return { getal: null, tekst: `Nog nooit geweest sinds inschrijving ${datumTekst(lidSinds, vandaag)}` }
  return { getal: null, tekst: 'Nog nooit geweest' }
}
