// 3D-oefening: Row op een schuine bank. Naam exact zoals in de oefenbibliotheek.
// Rugleuning op 40 graden, met de borst op de bank en de voeten stevig achter de
// bank op de grond. Een dumbbell in elke hand hangt recht onder de schouders met
// gestrekte armen en de schouderbladen iets uit elkaar. Trek beide dumbbells
// omhoog tot de ellebogen naast de romp zijn (niet ver erachter) en knijp de
// schouderbladen samen; de borst blijft op de bank en het hoofd in het verlengde
// van de rug, de blik naar de grond.
// Tempo: 1 tel omhoog, 1 tel stil, 2 tellen omlaag.
// Camera van opzij: bank, rughoek en de ellebogen naast de romp.

import { armOefening } from '../bouw/boven'
import { NEUTRAAL } from './gedeeld'
import type { Oefening3d } from '../typen'

/** Hoek van de rugleuning boven horizontaal; de romp ligt er evenwijdig op. */
const HOEK = 40

const LIG = { bekkenY: 0.875, bekkenZ: 0, kantel: 90 - HOEK, lende: 0, borst: 0, nek: -6 } as const

export const ROW_SCHUINE_BANK: Oefening3d = armOefening({
  naam: 'Row op een schuine bank',
  lichaam: { ...LIG, schouders: 0.01 },
  lichaamEind: { ...LIG, schouders: -0.015 },
  van: { dx: 0.03, dy: -0.62, dz: 0.02 },
  naar: { dx: 0.05, dy: -0.35, dz: -0.07 },
  enkel: { x: 0.13, y: 0.08, z: -0.3 },
  voet: { kanteling: 0, uitdraai: 8 },
  knieRichting: { x: 0.2, y: 0, z: 1 },
  elleboogRichting: { x: 0.25, y: 0.6, z: -0.8 },
  greepRichting: NEUTRAAL,
  materiaal: [{ soort: 'halters' }, { soort: 'buikBank' }],
  spieren: ['rug', 'bovenarm'],
  spierenSecundair: ['schouder'],
  camera: { hoek: 74, hoogte: 12, afstand: 4.3, doel: { x: 0, y: 0.82, z: 0.15 } },
  blik: null,
  tempo: { begin: 0.4, heen: 1.0, eind: 1.0, terug: 2.0 },
  tussen: 1,
})
