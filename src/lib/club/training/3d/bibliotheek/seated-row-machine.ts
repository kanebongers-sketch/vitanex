// 3D-oefening: Seated row machine. Naam exact zoals in de oefenbibliotheek.
// Rechtop op de zitting met de voeten plat op de grond en de borst tegen het
// kussen; de stoel staat zo dat de grepen op borsthoogte zitten en net met
// gestrekte armen te pakken zijn. Pak de liggende grepen bovenhands en trek ze
// rustig naar je toe tot de ellebogen naast de romp zijn en knijp de schouderbladen samen; de borst
// blijft tegen het kussen en de schouders laag. Rustig terug tot de armen
// gestrekt zijn.
// Tempo: 1 tel trekken, 1 tel stil, 2 tellen terug.
// Camera schuin van opzij en iets van achteren: rug, ellebogen en borstkussen.

import { armOefening } from '../bouw/boven'
import type { Oefening3d } from '../typen'

const ZIT = { bekkenY: 0.56, bekkenZ: 0, lende: 0 } as const

export const SEATED_ROW_MACHINE: Oefening3d = armOefening({
  naam: 'Seated row machine',
  lichaam: { ...ZIT, kantel: 6, borst: 0, nek: -6, schouders: 0.012 },
  lichaamEind: { ...ZIT, kantel: 6, borst: -3, nek: -3, schouders: -0.015 },
  van: { dx: 0.05, dy: -0.12, dz: 0.6 },
  naar: { dx: 0.05, dy: -0.19, dz: 0.15 },
  enkel: { x: 0.16, y: 0.08, z: 0.47 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.25, y: 0.4, z: 1 },
  elleboogRichting: { x: 0.2, y: -0.5, z: -1 },
  materiaal: [{ soort: 'roeiMachine', plek: { x: 0, y: 0, z: 0 } }],
  spieren: ['rug', 'bovenarm'],
  spierenSecundair: ['schouder'],
  camera: { hoek: 106, hoogte: 14, afstand: 4.4, doel: { x: 0, y: 0.9, z: 0.25 } },
  tempo: { begin: 0.4, heen: 1.0, eind: 1.0, terug: 2.0 },
  tussen: 1,
})
