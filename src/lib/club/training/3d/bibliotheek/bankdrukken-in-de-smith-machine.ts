// 3D-oefening: Bankdrukken in de smith machine. Naam exact zoals in de oefenbibliotheek.
// Op de rug op een losse vlakke bank, zo onder de stang geschoven dat die
// recht op de middenborst zakt. Voeten plat, billen op de bank, schouderbladen
// samen en laag met een lichte boog in de onderrug. Greep iets breder dan de
// schouders, onderarmen onderin verticaal, ellebogen ongeveer 45 graden van de
// romp. De geleiding loopt recht: 2 tellen omlaag tot de stang de borst bijna
// raakt, kort stil, 1 tel recht omhoog tot de armen gestrekt zijn (niet op
// slot). Veiligheidsstops net onder borsthoogte.

import { smithDrukken } from '../bouw/smith'
import type { Oefening3d } from '../typen'

export const BANKDRUKKEN_SMITH: Oefening3d = smithDrukken({
  naam: 'Bankdrukken in de smith machine',
  romp: { bekkenY: 0.52, bekkenZ: 0.24, kantel: -68, lende: -15, borst: -13, nek: 6, schouders: -0.04, greep: 0.31 },
  stangZ: -0.11,
  onderY: 0.685,
  bank: { soort: 'bankKaal', plek: { x: 0, y: 0, z: -0.24 } },
  enkel: { x: 0.21, y: 0.08, z: 0.42 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.08, y: 1, z: 0.3 },
  elleboogRichting: { x: 0.5, y: -0.5, z: 0.62 },
  spieren: ['borst', 'bovenarm', 'schouder'],
  camera: { hoek: 42, hoogte: 14, afstand: 4.0, doel: { x: 0, y: 0.82, z: -0.02 } },
  tempo: { begin: 0.5, heen: 2.0, eind: 0.3, terug: 1.1 },
})
