// 3D-oefening: Reverse fly machine. Naam exact zoals in de oefenbibliotheek.
// Zittend met de borst tegen het kussen, voeten plat, handvatten op
// schouderhoogte met de handpalmen naar elkaar. Armen met een kleine buiging in
// de ellebogen die de hele beweging gelijk blijft. In een wijde boog naar
// achteren tot de armen in lijn met het lichaam zijn, kort vast, gecontroleerd
// terug tot vlak voor je. Schouders laag, borst blijft tegen het kussen.
// Tempo: 1 tel naar achteren, kort vast, 2 tellen terug.
// Camera schuin van achteren en boven: de boog van de armen en de achterkant van
// de schouders, die het werk doen.

import { armOefening } from '../bouw/boven'
import type { Oefening3d } from '../typen'

/** Rechtop, iets voorover tegen het borstkussen, buik vast. */
const ROMP = { bekkenY: 0.555, bekkenZ: 0, kantel: 4, lende: 0, borst: 2, nek: -4, schouders: -0.02 } as const

/** Lichte buiging: de onderarm wijst iets naar binnen en naar voren, de elleboog naar buiten. */
const BUIG = { x: -1, y: 0, z: 1 } as const

export const REVERSE_FLY_MACHINE: Oefening3d = armOefening({
  naam: 'Reverse fly machine',
  lichaam: ROMP,
  // Begin: armen voor je op schouderhoogte, handvatten vlak bij elkaar.
  van: { heffen: 86, opzij: 4, elleboog: 16, buig: BUIG },
  // Eind: armen in lijn met het lichaam, zijwaarts.
  naar: { heffen: 86, opzij: 86, elleboog: 16, buig: BUIG },
  enkel: { x: 0.17, y: 0.08, z: 0.46 },
  voet: { kanteling: 0, uitdraai: 12 },
  knieRichting: { x: 0.3, y: 0.4, z: 1 },
  elleboogRichting: { x: 1, y: 0.15, z: -1 },
  // Verticale handvatten: handpalmen naar elkaar.
  greepRichting: { x: 0, y: 1, z: 0 },
  materiaal: [{ soort: 'reverseFly', plek: { x: 0, y: 0, z: 0 } }],
  spieren: ['schouder'],
  spierenSecundair: ['rug'],
  camera: { hoek: 118, hoogte: 26, afstand: 4.4, doel: { x: 0, y: 0.95, z: 0.1 } },
  tempo: { begin: 0.4, heen: 1.1, eind: 0.5, terug: 2.0 },
  tussen: 7,
})
