// 3D-oefening: Triceps extension boven het hoofd. Naam exact zoals in de oefenbibliotheek.

import { armOefening, LICHAAM } from '../bouw/boven'
import { ACHTER } from './gedeeld'
import type { Oefening3d } from '../typen'

export const OVERHEAD_EXTENSION: Oefening3d = armOefening({
  naam: 'Triceps extension boven het hoofd',
  lichaam: { ...LICHAAM.zittend, kantel: -4, draai: 90 },
  van: { heffen: 165, opzij: 9, elleboog: 8, buig: ACHTER },
  naar: { heffen: 160, opzij: 9, elleboog: 122, buig: ACHTER },
  enkel: { x: 0.2, y: 0.08, z: 0.46 },
  voet: { kanteling: 0, uitdraai: 14 },
  knieRichting: { x: 0.3, y: 0.3, z: 1 },
  elleboogRichting: { x: 0.15, y: 1, z: 0.4 },
  // Neutraal (duimen naar achteren), meedraaiend met de onderarm: geen sprong als de onderarm rechtop komt.
  greepAnatomisch: true,
  materiaal: [{ soort: 'bankRug', plek: { x: 0, y: 0, z: -0.02 } }, { soort: 'halterStaand' }],
  spieren: ['bovenarm'],
  camera: { hoek: 62, hoogte: 9, afstand: 4.2, doel: { x: 0, y: 1.05, z: 0.0 } },
  tempo: { begin: 0.4, heen: 2.0, eind: 0.3, terug: 1.3 },
  tussen: 3,
})
