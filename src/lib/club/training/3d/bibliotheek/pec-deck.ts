// 3D-oefening: Pec deck. Naam exact zoals in de oefenbibliotheek.
// Rechtop in de machine, rug en hoofd tegen de leuning, voeten plat. De
// handgrepen staan op schouderhoogte; de armen draaien om een as recht boven
// de schouders. Begin met de armen open in lijn met het lichaam (een
// comfortabele rek), breng ze met licht gebogen ellebogen in een boog voor de
// borst samen, knijp een tel en laat ze in 3 tellen rustig terug open gaan.
// Schouders blijven laag.

import { boogOefening } from '../bouw/boog'
import { LICHAAM } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const PEC_DECK: Oefening3d = boogOefening({
  naam: 'Pec deck',
  lichaam: { ...LICHAAM.zittend, kantel: -8, schouders: -0.02 },
  van: { x: 1, y: -0.14, z: 0 },
  naar: { x: 0, y: -0.14, z: 1 },
  as: { x: 0, y: 1, z: 0 },
  elleboog: 22,
  buig: { x: 0, y: 0, z: 1 },
  enkel: { x: 0.2, y: 0.08, z: 0.48 },
  voet: { kanteling: 0, uitdraai: 12 },
  knieRichting: { x: 0.3, y: 0.4, z: 1 },
  elleboogRichting: { x: 1, y: -0.5, z: -1 },
  greepRichting: { x: 0, y: -1, z: 0 },
  materiaal: [{ soort: 'pecDeck' }],
  spieren: ['borst'],
  spierenSecundair: ['schouder'],
  camera: { hoek: 26, hoogte: 18, afstand: 4.4, doel: { x: 0, y: 0.98, z: 0.15 } },
  tempo: { begin: 0.5, heen: 1.0, eind: 1.0, terug: 3.0 },
})
