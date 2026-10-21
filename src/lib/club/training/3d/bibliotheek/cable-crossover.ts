// 3D-oefening: Cable crossover. Naam exact zoals in de oefenbibliotheek.
// Beide kabels in de hoogste stand, in elke hand een handvat. Een korte
// spreidstand (rechtervoet voor), buik vast en de romp licht voorover; de
// romp beweegt niet mee. De armen beginnen wijd en hoog met een lichte rek in
// de borst en komen met een vaste, lichte buiging in de ellebogen in een boog
// omlaag en naar elkaar toe tot voor de heupen. Kort knijpen, in 2,5 tellen
// rustig terug. Schouders laag.

import { boogOefening } from '../bouw/boog'
import { NEUTRAAL } from './gedeeld'
import type { Oefening3d } from '../typen'

export const CABLE_CROSSOVER: Oefening3d = boogOefening({
  naam: 'Cable crossover',
  lichaam: { bekkenY: 0.93, kantel: 16, lende: 0, borst: 2, nek: -8, schouders: -0.02 },
  van: { x: 0.84, y: 0.55, z: -0.1 },
  naar: { x: -0.03, y: -0.74, z: 0.67 },
  elleboog: 20,
  buig: { x: 0, y: 0, z: 1 },
  balans: 0.1,
  enkel: { x: 0.13, y: 0.08, z: -0.12 },
  enkelRechts: { x: -0.13, y: 0.08, z: 0.24 },
  voet: { kanteling: 0, uitdraai: 10 },
  voetRechts: { kanteling: 0, uitdraai: 6 },
  elleboogRichting: { x: 0.5, y: 0.3, z: -1 },
  greepRichting: NEUTRAAL,
  materiaal: [{ soort: 'kabelCrossover', plek: { x: 0, y: 0, z: -0.2 } }],
  spieren: ['borst'],
  spierenSecundair: ['schouder', 'romp'],
  camera: { hoek: 20, hoogte: 9, afstand: 5.6, doel: { x: 0, y: 1.2, z: 0.0 } },
  tempo: { begin: 0.4, heen: 1.2, eind: 0.5, terug: 2.5 },
})
