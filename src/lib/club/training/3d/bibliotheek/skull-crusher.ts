// 3D-oefening: Skull crusher. Naam exact zoals in de oefenbibliotheek.
// Op de rug op een vlakke bank, voeten plat op de grond. De stang boven de
// borst met gestrekte armen, de bovenarmen iets naar achteren gekanteld
// (richting het hoofd). Alleen de ellebogen buigen: in 3 tellen zakt de stang
// in een boog tot net boven het voorhoofd, de ellebogen blijven op hun plek en
// wijzen naar de voeten (naar het plafond), kort stil, in 1 tel terug strekken.

import { armOefening, LICHAAM } from '../bouw/boven'
/** De onderarm klapt naar het hoofd en iets naar binnen: zo blijven de handen op dezelfde plek op de stang. */
const BUIG = { x: -0.09, y: 0, z: -1 } as const
import type { Oefening3d } from '../typen'

export const SKULL_CRUSHER: Oefening3d = armOefening({
  naam: 'Skull crusher',
  lichaam: LICHAAM.bankLig,
  van: { heffen: 182, opzij: -3, elleboog: 6, buig: BUIG },
  naar: { heffen: 182, opzij: -3, elleboog: 117, buig: BUIG },
  enkel: { x: 0.24, y: 0.08, z: 0.62 },
  voet: { kanteling: 0, uitdraai: 15 },
  knieRichting: { x: 0.3, y: 1, z: 0.4 },
  elleboogRichting: { x: 0.05, y: 1, z: 0.3 },
  materiaal: [{ soort: 'bankKaal', plek: { x: 0, y: 0, z: -0.15 } }, { soort: 'curlStang' }],
  spieren: ['bovenarm'],
  camera: { hoek: 70, hoogte: 20, afstand: 4.0, doel: { x: 0, y: 0.7, z: -0.25 } },
  tempo: { begin: 0.5, heen: 3.0, eind: 0.4, terug: 1.1 },
  tussen: 3,
})
