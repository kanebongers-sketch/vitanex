// 3D-oefening: Schuine dumbbell fly. Naam exact zoals in de oefenbibliotheek.
// Op een bank van ongeveer 32 graden, rug en schouderbladen tegen de leuning,
// voeten plat. De dumbbells beginnen boven de bovenste borst met de
// handpalmen naar elkaar en de ellebogen licht gebogen. De armen zakken in een
// wijde boog opzij, op de lijn van de bovenste borst (niet naar de oren), tot
// de ellebogen op bankhoogte zijn, en komen langs dezelfde boog terug.
// 3 tellen open, kort stil in de rek, 2 tellen terug.

import { boogOefening } from '../bouw/boog'
import { NEUTRAAL_LIGGEND } from './gedeeld'
import type { Oefening3d } from '../typen'

export const SCHUINE_DUMBBELL_FLY: Oefening3d = boogOefening({
  naam: 'Schuine dumbbell fly',
  lichaam: { bekkenY: 0.56, bekkenZ: 0.12, kantel: -58, nek: 10, schouders: -0.025 },
  van: { x: 0.04, y: 1, z: 0.06 },
  naar: { x: 0.94, y: -0.3, z: 0.02 },
  elleboog: 24,
  buig: { x: -1, y: 0, z: 0 },
  enkel: { x: 0.22, y: 0.08, z: 0.68 },
  voet: { kanteling: 0, uitdraai: 15 },
  knieRichting: { x: 0.3, y: 0.8, z: 0.5 },
  elleboogRichting: { x: 1, y: -1, z: 0.1 },
  greepRichting: NEUTRAAL_LIGGEND,
  materiaal: [{ soort: 'bankSchuin', hoek: 32, plek: { x: 0, y: 0, z: 0 } }, { soort: 'halters' }],
  spieren: ['borst'],
  spierenSecundair: ['schouder'],
  camera: { hoek: 26, hoogte: 20, afstand: 4.4, doel: { x: 0, y: 0.86, z: 0.0 } },
  tempo: { begin: 0.5, heen: 3.0, eind: 0.4, terug: 2.0 },
})
