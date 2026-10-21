// 3D-oefening: Deadlift. Naam exact zoals in de oefenbibliotheek.
// Stang boven het midden van de voet, schenen tegen de stang, schouders net voor
// de stang, rug neutraal. Eerst spanning opbouwen (heupen een fractie omlaag,
// borst omhoog, schouders laag), dan de grond wegduwen met de benen en voorbij de
// knie de heupen naar voren tot rechtop. Terug: heupen eerst naar achteren, stang
// langs de dijen, dan de knieen buigen tot de schijven op de vloer staan.
// De stang blijft tot bovenaan op dezelfde plek boven de middenvoet, zodat hij een
// rechte lijn omhoog en omlaag maakt. Het afspelen begint zo dat de startpositie
// (spanning, stang op de vloer) op de helft van de lus valt.

import { houding, langsBeen } from '../bouw/basis'
import { startVoorSleutel } from '../interpolatie'
import { figuurIn } from '../kinematica'
import type { Houding, Oefening3d, Sleutel } from '../typen'

/** Halve greepbreedte: net buiten de knieen, armen vrij langs de benen. */
const GREEP = 0.27
/** Stang boven het midden van de voet; de scheen raakt hem in de start. */
const STANG_Z = 0.07
/** Hoogte van de stang als de schijven (straal 0,225 m) op de vloer staan. */
const STANG_VLOER = 0.226
/** Midden van de stang net voor scheen, knie of dij (dikte been plus stang). */
const STANG_AAN_BEEN = 0.07

const BASIS: Oefening3d = {
  naam: 'Deadlift',
  sleutels: [],
  last: 'hangend',
  handen: 'greep',
  enkel: { x: 0.13, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 8 },
  knieRichting: { x: 0.12, y: 0, z: 1 },
  elleboogRichting: { x: 0, y: 0, z: -1 },
  materiaal: [{ soort: 'stang', schijven: 3 }],
  // Billen, hamstrings en rugstrekkers doen het werk; de quadriceps duwen van de
  // vloer, de bovenrug houdt de schouders op hun plek en de onderarmen de greep.
  spieren: ['bil', 'hamstring', 'onderrug'],
  spierenSecundair: ['dij', 'rug', 'onderarm'],
  // Heup en knie strekken samen, zodat de heupen niet eerst omhoog schieten.
  kniePad: true,
  // Geen vaste blik: de nek staat per stand. Onderin in lijn met de rug (ogen een
  // paar meter voor je op de vloer), bovenaan het hoofd neutraal en vooruit.
  // Van opzij op borsthoogte, net iets van achteren, zoals een trainer de deadlift
  // uitlegt: de voorste schijven schuiven zo voor het lichaam langs, waardoor voet,
  // scheen en stang als een verticale lijn te zien zijn, samen met de rughoek en de
  // billen en hamstrings die het werk doen.
  camera: { hoek: 108, hoogte: 11, afstand: 3.9, doel: { x: 0, y: 0.74, z: 0 } },
}

/** Zet de heuphoogte zo dat de schijven precies op de vloer staan. */
function opVloer(h: Houding): Houding {
  let uit = h
  for (let i = 0; i < 12; i++) {
    const fout = figuurIn(BASIS, uit).last.pos.y - STANG_VLOER
    if (Math.abs(fout) < 0.0005) break
    uit = { ...uit, bekkenY: uit.bekkenY - fout }
  }
  return uit
}

// Neergezet: stang op de vloer, armen hangen, nog geen spanning. Heupen een
// fractie hoger, schouders ontspannen.
const LOS = opVloer(houding({
  bekkenY: 0.68, bekkenZ: -0.33, kantel: 68, lende: 4, borst: 2, nek: -30,
  schouders: 0.015, lastZ: STANG_Z, greep: GREEP,
}))
// Spanning: heupen iets omlaag, borst trots, schouders laag (oksels naar de
// heupen), rug neutraal. De stang staat nog op de vloer.
const SPANNING = opVloer(houding({
  bekkenY: 0.66, bekkenZ: -0.308, kantel: 67, lende: 1, borst: -5, nek: -28,
  schouders: -0.03, lastZ: STANG_Z, greep: GREEP,
}))
// Omhoog: stang net onder de knie. De benen hebben geduwd, de knieen zijn naar
// achteren uit de baan van de stang, de rughoek is bijna gelijk aan de start.
const KNIE = langsBeen(BASIS, houding({
  bekkenY: 0.8, bekkenZ: -0.32, kantel: 64, lende: 1, borst: -5, nek: -26,
  schouders: -0.025, lastZ: STANG_Z, greep: GREEP,
}), STANG_AAN_BEEN)
// Omlaag: eerst de heupen naar achteren met bijna gestrekte knieen tot de stang
// voorbij de knie is; pas daarna buigen de knieen (via KNIE).
const SCHARNIER = langsBeen(BASIS, houding({
  bekkenY: 0.875, bekkenZ: -0.3, kantel: 56, lende: 1, borst: -4, nek: -22,
  schouders: -0.025, lastZ: STANG_Z, greep: GREEP,
}), STANG_AAN_BEEN)
// Bovenaan rechtop met gestrekte heupen en billen aan, niet achterover. Borst
// trots en schouders terug, zodat de stang hoog op de dij hangt.
const BOVEN = langsBeen(BASIS, houding({
  bekkenY: 0.946, bekkenZ: 0, kantel: 0, lende: -3, borst: -6, nek: 8,
  schouders: -0.005, lastZ: STANG_Z, greep: GREEP,
}), STANG_AAN_BEEN)

// Tempo: rustig los van de vloer (0,85 s tot de knie), voorbij de knie sneller
// over een langere weg naar rechtop (0,85 s), kort vasthouden, 2 tellen omlaag
// en elke herhaling opnieuw spanning opbouwen.
const SLEUTELS: Sleutel[] = [
  { houding: SPANNING, vast: 0.45, naarVolgende: 0.85 },
  { houding: KNIE, vast: 0, naarVolgende: 0.85 },
  { houding: BOVEN, vast: 0.6, naarVolgende: 0.85 },
  { houding: SCHARNIER, vast: 0, naarVolgende: 0.7 },
  { houding: KNIE, vast: 0, naarVolgende: 0.65 },
  { houding: LOS, vast: 0.35, naarVolgende: 0.5 },
]

export const DEADLIFT_3D: Oefening3d = {
  ...BASIS,
  sleutels: SLEUTELS,
  // De startpositie met spanning (stang nog op de vloer) valt op de helft van de lus.
  start: startVoorSleutel(SLEUTELS, 0, 0.5),
}
