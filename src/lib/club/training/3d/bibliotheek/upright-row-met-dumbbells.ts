// 3D-oefening: Upright row met dumbbells. Naam exact zoals in de oefenbibliotheek.
// Rechtop, voeten op heupbreedte, de dumbbells voor de bovenbenen met de
// handpalmen naar het lichaam. De ellebogen gaan voor: ze trekken naar opzij en
// omhoog tot schouderhoogte, de handen volgen er los onder en blijven vlak voor
// het lichaam (de dumbbells gaan langs de romp omhoog tot borsthoogte). Bovenin
// staan de ellebogen hoger dan de polsen. Romp stil, niet zwaaien of
// achterover leunen. Een tel omhoog, kort stil, twee tellen omlaag.

import { armOefening, LICHAAM } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const UPRIGHT_ROW_DUMBBELLS: Oefening3d = armOefening({
  naam: 'Upright row met dumbbells',
  lichaam: { ...LICHAAM.staand, kantel: 2 },
  van: { dx: -0.002, dy: -0.62, dz: 0.168 },
  naar: { dx: -0.002, dy: -0.22, dz: 0.21 },
  balans: 0.03,
  enkel: { x: 0.12, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 8 },
  elleboogRichting: { x: 1, y: 0.5, z: -0.2 },
  materiaal: [{ soort: 'halters' }],
  spieren: ['schouder'],
  spierenSecundair: ['rug', 'bovenarm'],
  // Schuin van voren: de ellebogen die boven de polsen uitkomen en de baan vlak langs het lichaam.
  camera: { hoek: 32, hoogte: 8, afstand: 4.3, doel: { x: 0, y: 1.08, z: 0.05 } },
  tempo: { begin: 0.4, heen: 1.1, eind: 0.4, terug: 2.0 },
  tussen: 3,
})
