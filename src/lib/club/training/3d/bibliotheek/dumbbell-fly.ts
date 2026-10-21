// 3D-oefening: Dumbbell fly. Naam exact zoals in de oefenbibliotheek.
// Op de rug op een vlakke bank, voeten plat op de vloer, schouderbladen samen.
// De dumbbells beginnen boven de borst met de handpalmen naar elkaar en de
// ellebogen licht gebogen. De armen zakken als een vaste boog wijd opzij
// ("omarm een groot vat") tot de ellebogen ongeveer op bankhoogte zijn en er
// een lichte rek over de borst staat, en komen langs dezelfde boog terug
// zonder dat de dumbbells bovenin tegen elkaar tikken. 3 tellen open, kort
// stil in de rek, 2 tellen terug.

import { boogOefening } from '../bouw/boog'
import { LICHAAM } from '../bouw/boven'
import { NEUTRAAL_LIGGEND } from './gedeeld'
import type { Oefening3d } from '../typen'

export const DUMBBELL_FLY: Oefening3d = boogOefening({
  naam: 'Dumbbell fly',
  lichaam: { ...LICHAAM.bankLig, schouders: -0.028 },
  van: { x: 0.04, y: 1, z: 0.1 },
  naar: { x: 0.94, y: -0.22, z: 0.22 },
  elleboog: 24,
  buig: { x: -1, y: 0, z: 0 },
  enkel: { x: 0.24, y: 0.08, z: 0.62 },
  voet: { kanteling: 0, uitdraai: 15 },
  knieRichting: { x: 0.3, y: 1, z: 0.4 },
  elleboogRichting: { x: 1, y: -1, z: 0.3 },
  greepRichting: NEUTRAAL_LIGGEND,
  materiaal: [{ soort: 'bankKaal', plek: { x: 0, y: 0, z: -0.15 } }, { soort: 'halters' }],
  spieren: ['borst'],
  spierenSecundair: ['schouder'],
  camera: { hoek: 22, hoogte: 26, afstand: 4.3, doel: { x: 0, y: 0.62, z: -0.1 } },
  tempo: { begin: 0.5, heen: 3.0, eind: 0.4, terug: 2.0 },
})
