// 3D-oefening: Roemeense deadlift met dumbbells. Naam exact zoals in de oefenbibliotheek.
// Eigen houdingen in plaats van de algemene hinge: de heupen gaan ver naar
// achteren terwijl de knieen in een vaste lichte buiging blijven (schenen bijna
// verticaal). De dumbbells hangen smal, voor de dijen, en glijden in elke stand
// langs de benen tot net onder de knie. Handpalmen naar het lichaam, nek in lijn
// met de rug. Bovenaan staat de heup gestrekt (billen aan), zonder achterover te leunen.

import { bereikbaar, houding, zwaartepuntZ } from '../bouw/basis'
import { staandeLast } from '../bouw/benen'
import { figuurIn } from '../kinematica'
import { BEEN } from '../maten'
import type { Houding, Oefening3d, Sleutel } from '../typen'

/** Halve greepbreedte: dumbbells voor de dijen, niet ernaast. */
const GREEP = 0.11
/** Reik van het been bovenaan: knie zacht, niet op slot. */
const REIK_BOVEN = 0.995
/** Reik tijdens de hele beweging: een vaste lichte kniebuiging. */
const REIK_VAST = 0.978
/** Bekkenkanteling onderin (graden voorover): dumbbells net onder de knie, rug neutraal. */
const KANTEL_ONDER = 92
/** Afstand van het midden van de dumbbell tot de lijn van het been (dikte been plus schijf). */
const HALTER_AAN_BEEN = 0.085
/** Minimale afstand tot de voorkant van de knie, zodat de dumbbell er nooit doorheen gaat. */
const HALTER_AAN_KNIE = 0.1
/** Schouderbladen laag en naar achteren, zo laag als de grens toelaat. */
const SCHOUDERS_LAAG = -0.04
/** Zwaartepunt boven het midden van de voet. */
const MIDDEN_VOET = 0.04

const LAST = staandeLast('halters', GREEP, 0.1, false)

const BASIS: Oefening3d = {
  naam: 'Roemeense deadlift met dumbbells',
  sleutels: [],
  ...LAST.o,
  handen: 'greep',
  enkel: { x: 0.11, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 5 },
  knieRichting: { x: 0.1, y: 0, z: 1 },
  spieren: ['bil', 'dij', 'rug'],
  // Zuiver zijaanzicht, iets van voren: baan van de dumbbells langs de benen en de neutrale nek.
  camera: { hoek: 84, hoogte: 20, afstand: 4.3, doel: { x: 0, y: 0.8, z: -0.08 } },
}

/** Z van de voorkant van het linkerbeen op hoogte y (lijn heup, knie, enkel). */
function beenZOp(h: Houding, y: number): number {
  const b = figuurIn(BASIS, h).benen[0]
  const [boven, onder] = y >= b.midden.y ? [b.begin, b.midden] : [b.midden, b.eind]
  const f = Math.min(1, Math.max(0, (boven.y - y) / Math.max(1e-6, boven.y - onder.y)))
  return boven.z + (onder.z - boven.z) * f
}

/** Dumbbells tegen de benen: zoek de plek waar ze net voor het been hangen. */
function haltersLangsBeen(h: Houding): Houding {
  let uit = h
  for (let i = 0; i < 5; i++) {
    const f = figuurIn(BASIS, uit)
    const lastY = f.last.pos.y
    const knie = f.benen[0].midden
    const bijKnie = Math.max(0, 1 - Math.abs(lastY - knie.y) / 0.14)
    const minZ = knie.z + HALTER_AAN_KNIE * bijKnie
    uit = { ...uit, lastZ: Math.max(beenZOp(uit, lastY) + HALTER_AAN_BEEN, minZ) }
  }
  return uit
}

/** Zet de heuphoogte zo dat het been precies de gevraagde reik heeft (vaste kniebuiging). */
function zetReik(h: Houding, doel: number): Houding {
  let uit = h
  for (let i = 0; i < 12; i++) {
    const reik = figuurIn(BASIS, uit).benen[0].reik
    if (Math.abs(reik - doel) < 0.0004) break
    uit = { ...uit, bekkenY: uit.bekkenY - (reik - doel) * BEEN }
  }
  return bereikbaar(BASIS, uit, Math.max(doel, 0.999))
}

/** Heupen naar achteren of voren tot het zwaartepunt boven het midden van de voet ligt. */
function inBalans(h: Houding, reik: number): Houding {
  let uit = h
  for (let i = 0; i < 6; i++) {
    uit = haltersLangsBeen(uit)
    const fout = zwaartepuntZ(BASIS, uit, LAST.gewicht) - MIDDEN_VOET
    uit = zetReik({ ...uit, bekkenZ: uit.bekkenZ - fout * 1.2 }, reik)
  }
  return haltersLangsBeen(uit)
}

/** Reik bij diepte d: bovenaan zacht gestrekt, na de eerste centimeters de vaste buiging. */
function reikBij(d: number): number {
  const f = Math.min(1, d / 0.12)
  return REIK_BOVEN + (REIK_VAST - REIK_BOVEN) * (f * f * (3 - 2 * f))
}

function maak(d: number): Houding {
  // Bovenaan het bekken iets achterover (billen aan) met de onderrug neutraal;
  // in de hinge de bovenrug licht gestrekt (borst open) en de nek in het verlengde.
  // De heup leidt meteen: de kanteling loopt in het begin sneller op dan de diepte.
  const k = 1 - (1 - d) ** 1.35
  const h = houding({
    bekkenY: 0.94,
    kantel: -4 + (KANTEL_ONDER + 4) * k,
    lende: 3 - 17 * k,
    borst: -2 - 13 * k,
    nek: -4 - 26 * k,
    schouders: SCHOUDERS_LAAG,
    greep: GREEP,
  })
  return inBalans(h, reikBij(d))
}

/** Een sleutel op diepte d. */
function op(d: number, rust: number, duur: number): Sleutel {
  return { houding: maak(d), vast: rust, naarVolgende: duur }
}

// Rechtop met billen aan, knieen in de vaste buiging, drie tellen omlaag met de
// heupen voorop, kort stil in de rek en een tel omhoog.
export const RDL_DUMBBELLS: Oefening3d = {
  ...BASIS,
  sleutels: [
    op(0, 0.6, 0.75),
    op(0.25, 0, 0.75),
    op(0.5, 0, 0.75),
    op(0.75, 0, 0.75),
    op(1, 0.6, 0.45),
    op(0.55, 0, 0.4),
    op(0.2, 0, 0.4),
  ],
}
