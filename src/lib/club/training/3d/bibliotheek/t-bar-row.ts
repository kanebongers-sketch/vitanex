// 3D-oefening: T-bar row. Naam exact zoals in de oefenbibliotheek.
// Over de stang met de voeten op heupbreedte: het scharnier achter je, de schijven
// voor je en de T-greep (een dwarsstang onder de stang, handen net binnen
// schouderbreedte, bovenhands) onder je borst. Knieen licht gebogen, billen naar
// achteren tot de romp ongeveer 45 graden voorover staat, rug recht van stuit tot
// nek. Onderin hangen de armen gestrekt en zweven de schijven net boven de grond;
// trek de greep naar de onderste borst met de ellebogen langs de zij en breng de
// schouderbladen samen. De romp houdt dezelfde hoek.
// Tempo: 1 tel omhoog, kort stil, 2 tellen omlaag.
// Camera van opzij en iets van achteren: rughoek, stang tussen de benen en de schijven.

import { armOefening, LICHAAM } from '../bouw/boven'
import { BLIK } from '../bouw/basis'
import type { Oefening3d } from '../typen'

export const T_BAR_ROW: Oefening3d = armOefening({
  naam: 'T-bar row',
  lichaam: { ...LICHAAM.voorover, bekkenY: 0.86, kantel: 48 },
  van: { dx: -0.02, dy: -0.6, dz: 0.161 },
  naar: { dx: -0.02, dy: -0.29, dz: 0.0 },
  balans: 0.03,
  enkel: { x: 0.14, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 12 },
  knieRichting: { x: 0.3, y: 0, z: 1 },
  elleboogRichting: { x: 0.3, y: 0.5, z: -0.8 },
  materiaal: [{ soort: 'tBar', plek: { x: 0, y: 0, z: -1.3 } }],
  spieren: ['rug', 'bovenarm'],
  spierenSecundair: ['schouder', 'onderrug'],
  camera: { hoek: 70, hoogte: 11, afstand: 4.5, doel: { x: 0, y: 0.72, z: 0.0 } },
  blik: BLIK.scharnier,
  tempo: { begin: 0.4, heen: 1.0, eind: 0.4, terug: 2.0 },
  tussen: 1,
})
