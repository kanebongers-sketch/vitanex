// 3D-oefening: Arnold press. Naam exact zoals in de oefenbibliotheek.
// Zittend op een rechte bank, rug tegen het kussen. Onderin de halters voor de
// schouders op kinhoogte, handpalmen naar je toe en ellebogen voor het lichaam.
// Tijdens het drukken draaien de handen naar buiten en gaan de ellebogen opzij,
// zodat de handpalmen bovenin naar voren wijzen. Gecontroleerd terug langs
// dezelfde baan, met de draai terug naar je toe.

import { BLIK, houding, lus, metMoment } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'

/** Romp: rug tegen het kussen, buik vast (zelfde zit als de Dumbbell shoulder press). */
const ROMP = { bekkenY: 0.535, bekkenZ: -0.042, kantel: -4, lende: 0, borst: 0, nek: 2 }

/** Hand ten opzichte van de linkerschouder (m): onderin voor de schouder, bovenin boven het hoofd. */
const ONDER = { dx: -0.01, dy: 0.06, dz: 0.21 }
const BOVEN = { dx: 0.057, dy: 0.6, dz: 0.07 }

/**
 * Stand op fractie `f` van onder (0) naar boven (1). De draai loopt van
 * onderhands (180, palmen naar je toe) naar neutraal-voorwaarts (90 bij de
 * ellebogen opzij), de elleboog draait van voor het lichaam naar opzij. In het
 * midden gaan de handen iets verder uit elkaar, zoals de ellebogen openen.
 */
function stand(p: { f: number }): Houding {
  const f = p.f
  const schouders = 0.02 * f
  const s = schouderIn(houding({ ...ROMP, schouders }))
  const meng = (a: number, b: number) => a + (b - a) * f
  const open = 0.05 * Math.sin(Math.PI * f)
  // De draai loopt iets voor op de hoogte: de handen draaien al in het eerste stuk.
  const draaiF = Math.min(1, f * 1.25)
  return houding({
    ...ROMP,
    schouders,
    greep: s.x + meng(ONDER.dx, BOVEN.dx) + open,
    lastY: s.y + meng(ONDER.dy, BOVEN.dy),
    lastZ: s.z + meng(ONDER.dz, BOVEN.dz),
    draai: 180 - 90 * draaiF,
    elleboog: -62 * (1 - draaiF),
  })
}

export const ARNOLD_PRESS: Oefening3d = metMoment({
  naam: 'Arnold press',
  sleutels: lus({ f: 0 }, { f: 1 }, stand, { begin: 0.4, heen: 1.4, eind: 0.3, terug: 2.0 }, 3),
  last: 'wereld',
  handen: 'greep',
  greepAnatomisch: true,
  enkel: { x: 0.14, y: 0.08, z: 0.38 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.08, y: 0.3, z: 1 },
  elleboogRichting: { x: 1, y: -0.5, z: 0.15 },
  materiaal: [{ soort: 'bankRug', plek: { x: 0, y: 0, z: -0.02 } }, { soort: 'halters' }],
  spieren: ['schouder'],
  spierenSecundair: ['bovenarm', 'romp'],
  blik: BLIK.vooruit,
  camera: { hoek: -34, hoogte: 10, afstand: 4.0, doel: { x: 0, y: 0.95, z: 0.06 } },
})
