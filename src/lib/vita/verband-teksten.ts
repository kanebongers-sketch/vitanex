// ─── Verband-teksten (puur) ──────────────────────────────────────────────────
// Bouwt de concrete pijler-paren + eerlijke Nederlandse zinnen voor Vita. Taal is
// bewust associatief ("gaat samen met", "lijkt"), nooit causaal, en noemt altijd
// het aantal dagen waarop het gebaseerd is.

import type { DagWaarde, VerbandDef, SplitResultaat } from './verbanden'

export interface VerbandBronnen {
  slaapUren: DagWaarde[]
  stemming: DagWaarde[]
  stappen: DagWaarde[]
}

function rond1(n: number): string {
  return (Math.round(Math.abs(n) * 10) / 10).toLocaleString('nl-NL')
}

/** Bouwt de kandidaat-verbanden uit de beschikbare bronnen. */
export function verbandDefinities(b: VerbandBronnen): VerbandDef[] {
  return [
    {
      // Slaap-nacht → stemming de dag erna.
      driver: b.slaapUren,
      uitkomst: b.stemming,
      lag: 1,
      minVerschil: 0.4,
      formatteer: (r: SplitResultaat) =>
        r.verschil >= 0
          ? `Na een langere nacht is je stemming de dag erna gemiddeld ${rond1(r.verschil)} punt hoger — over ${r.nLaag + r.nHoog} dagen. Slaap lijkt je goed te doen.`
          : `Je stemming is de dag na een langere nacht juist wat lager — een grillig patroon over ${r.nLaag + r.nHoog} dagen. Hou het los in de gaten.`,
    },
    {
      // Beweging → stemming dezelfde dag.
      driver: b.stappen,
      uitkomst: b.stemming,
      lag: 0,
      minVerschil: 0.4,
      formatteer: (r: SplitResultaat) =>
        r.verschil >= 0
          ? `Op dagen dat je meer stappen zet, ligt je stemming gemiddeld ${rond1(r.verschil)} punt hoger — over ${r.nLaag + r.nHoog} dagen. Bewegen lijkt je te helpen.`
          : `Meer stappen gaat bij jou samen met een iets lagere stemming — over ${r.nLaag + r.nHoog} dagen. Misschien drukke dagen; let op je rust.`,
    },
  ]
}
