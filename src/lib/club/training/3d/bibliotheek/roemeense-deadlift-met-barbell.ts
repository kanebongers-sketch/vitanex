// 3D-oefening: Roemeense deadlift met barbell. Naam exact zoals in de oefenbibliotheek.
// Eigen houdingen in plaats van de algemene hinge: de heupen gaan ver naar
// achteren terwijl de knieen in een vaste lichte buiging blijven (schenen bijna
// verticaal), de stang schuift in elke stand langs de dijen tot net onder de knie
// en de nek blijft in lijn met de rug. Bovenaan staat de heup helemaal gestrekt
// (billen aan), zonder achterover te leunen.

import { bereikbaar, houding, zwaartepuntZ } from '../bouw/basis'
import { staandeLast } from '../bouw/benen'
import { figuurIn } from '../kinematica'
import { BEEN } from '../maten'
import type { Houding, Oefening3d, Sleutel } from '../typen'

/** Halve greepbreedte: handen op heupbreedte, net buiten de dijen. */
const GREEP = 0.215
/** Reik van het been (heup tot enkel ten opzichte van de beenlengte) bovenaan: knie zacht, niet op slot. */
const REIK_BOVEN = 0.995
/** Reik tijdens de hele beweging: een vaste kniebuiging van ongeveer 20 graden. */
const REIK_VAST = 0.976
/** Bekkenkanteling onderin (graden voorover): stang net onder de knie, rug neutraal. */
const KANTEL_ONDER = 70
/** Afstand van het midden van de stang tot de lijn van het been (dikte dij plus stang). */
const STANG_AAN_BEEN = 0.085
/** Zwaartepunt boven het midden van de voet. */
const MIDDEN_VOET = 0.04

const LAST = staandeLast('stang', GREEP, 0.1, false)

const BASIS: Oefening3d = {
  naam: 'Roemeense deadlift met barbell',
  sleutels: [],
  ...LAST.o,
  handen: 'greep',
  enkel: { x: 0.11, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 5 },
  knieRichting: { x: 0.1, y: 0, z: 1 },
  spieren: ['bil', 'dij', 'rug'],
  // Zijaanzicht licht van achteren (schijf voor de benen weg): heupen naar achteren, rechte rug en een verticale stangbaan.
  camera: { hoek: 114, hoogte: 22, afstand: 4.3, doel: { x: 0, y: 0.8, z: -0.08 } },
}

/** Z van de voorkant van het linkerbeen op hoogte y (lijn heup, knie, enkel). */
function beenZOp(h: Houding, y: number): number {
  const b = figuurIn(BASIS, h).benen[0]
  const [boven, onder] = y >= b.midden.y ? [b.begin, b.midden] : [b.midden, b.eind]
  const f = Math.min(1, Math.max(0, (boven.y - y) / Math.max(1e-6, boven.y - onder.y)))
  return boven.z + (onder.z - boven.z) * f
}

/** Stang tegen de dijen: zoek de plek waar hij net voor het been hangt. */
function stangLangsBeen(h: Houding): Houding {
  let uit = h
  for (let i = 0; i < 4; i++) {
    const stangY = figuurIn(BASIS, uit).last.pos.y
    uit = { ...uit, lastZ: beenZOp(uit, stangY) + STANG_AAN_BEEN }
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
    uit = stangLangsBeen(uit)
    const fout = zwaartepuntZ(BASIS, uit, LAST.gewicht) - MIDDEN_VOET
    uit = zetReik({ ...uit, bekkenZ: uit.bekkenZ - fout * 1.2 }, reik)
  }
  return stangLangsBeen(uit)
}

function maak(d: number, reik: number): Houding {
  const h = houding({
    bekkenY: 0.94,
    // Bovenaan rechtop met billen aan, daarna heupen naar achteren.
    kantel: KANTEL_ONDER * d,
    // Rug neutraal: onderrug vast, bovenrug licht gestrekt (borst open).
    lende: -2,
    borst: -3 * d,
    // Nek volgt de rug: geen extra buiging, de blik zakt mee met de romp.
    nek: -6 * d,
    // Schouders laag en naar achteren: oksels naar de heupen.
    schouders: -0.035 - 0.005 * d,
    greep: GREEP,
  })
  return inBalans(h, reik)
}

/** Een sleutel op diepte d met de vaste kniebuiging. */
function vast(d: number, rust: number, duur: number): Sleutel {
  return { houding: maak(d, REIK_VAST), vast: rust, naarVolgende: duur }
}

// Rechtop met billen aan, knieen eerst in de vaste buiging, dan drie tellen
// omlaag met de heupen voorop, kort stil in de rek en een tel omhoog.
export const RDL_BARBELL: Oefening3d = {
  ...BASIS,
  sleutels: [
    { houding: maak(0, REIK_BOVEN), vast: 0.5, naarVolgende: 0.3 },
    vast(0, 0, 0.75),
    vast(0.25, 0, 0.75),
    vast(0.5, 0, 0.75),
    vast(0.75, 0, 0.75),
    vast(1, 0.7, 0.4),
    vast(0.6, 0, 0.4),
    vast(0.2, 0, 0.3),
  ],
}
