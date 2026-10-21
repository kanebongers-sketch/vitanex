// 3D-oefening: Seated cable row met brede greep. Naam exact zoals in de oefenbibliotheek.
// Brede stang aan de lage kabel, voeten tegen de steun met de knieen licht
// gebogen. Rechtop zitten met gestrekte armen en de stang breed vast. Trek de stang
// naar de onderste borst met de ellebogen schuin naar buiten (nadruk op de
// bovenrug), houd kort vast met de schouderbladen samen en laat hem gecontroleerd
// terugkomen. De romp blijft rechtop: niet achterover leunen en niet voorover
// vallen bij het terugkomen.
// Tempo: 1 tel trekken, kort vast, 2 tellen terug.
// Camera schuin van achteren: ellebogen naar buiten en de schouderbladen.

import { armOefening } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const SEATED_CABLE_ROW_BREED: Oefening3d = armOefening({
  naam: 'Seated cable row met brede greep',
  lichaam: { bekkenY: 0.52, bekkenZ: 0, kantel: 5, nek: -6, schouders: 0.01 },
  lichaamEind: { bekkenY: 0.52, bekkenZ: 0, kantel: -1, borst: -3, nek: 0, schouders: -0.015 },
  van: { dx: 0.15, dy: -0.17, dz: 0.57 },
  naar: { dx: 0.15, dy: -0.2, dz: 0.15 },
  enkel: { x: 0.12, y: 0.22, z: 0.74 },
  voet: { kanteling: -62, uitdraai: 6 },
  knieRichting: { x: 0.25, y: 1, z: 0.2 },
  elleboogRichting: { x: 0.9, y: -0.2, z: -0.6 },
  materiaal: [
    { soort: 'bankKaal', plek: { x: 0, y: 0, z: 0.1 } },
    { soort: 'kabel', greep: 'lat', plek: { x: 0, y: 0.32, z: 1.02 } },
  ],
  spieren: ['rug', 'schouder'],
  spierenSecundair: ['bovenarm'],
  camera: { hoek: 116, hoogte: 16, afstand: 4.4, doel: { x: 0, y: 0.72, z: 0.35 } },
  tempo: { begin: 0.4, heen: 1.0, eind: 0.5, terug: 2.0 },
  tussen: 1,
})
