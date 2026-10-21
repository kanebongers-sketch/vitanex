// 3D-oefening: Schuin bankdrukken in de smith machine. Naam exact zoals in de oefenbibliotheek.
// Een bank op ongeveer 32 graden onder de stang, rug en hoofd tegen de
// leuning, voeten plat en billen op de bank. De bank staat zo dat de stang
// net onder het sleutelbeen op de bovenste borst uitkomt. Greep iets breder
// dan de schouders, onderarmen verticaal en de ellebogen iets onder
// schouderhoogte. 2 tellen recht omlaag tot de stang de bovenste borst bijna
// raakt, kort stil, 1 tel omhoog tot de armen gestrekt zijn.

import { smithDrukken } from '../bouw/smith'
import type { Oefening3d } from '../typen'

export const SCHUIN_BANKDRUKKEN_SMITH: Oefening3d = smithDrukken({
  naam: 'Schuin bankdrukken in de smith machine',
  romp: { bekkenY: 0.56, bekkenZ: 0.12, kantel: -58, nek: 10, schouders: -0.03, greep: 0.31 },
  stangZ: -0.172,
  onderY: 0.885,
  bank: { soort: 'bankSchuin', hoek: 32, plek: { x: 0, y: 0, z: 0 } },
  enkel: { x: 0.22, y: 0.08, z: 0.68 },
  voet: { kanteling: 0, uitdraai: 15 },
  knieRichting: { x: 0.3, y: 0.8, z: 0.5 },
  elleboogRichting: { x: 0.6, y: -0.6, z: 0.3 },
  spieren: ['borst', 'bovenarm', 'schouder'],
  camera: { hoek: 44, hoogte: 14, afstand: 4.2, doel: { x: 0, y: 0.95, z: 0.0 } },
  tempo: { begin: 0.5, heen: 2.0, eind: 0.3, terug: 1.1 },
})
