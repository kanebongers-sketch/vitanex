// 3D-oefening: Bulgarian split squat. Naam exact zoals in de oefenbibliotheek.
// Een vlakke bank staat dwars achter het figuur. De rechtervoet ligt met de
// wreef en de tenen op het kussen, ontspannen, en duwt niet af. De linkervoet
// staat een grote stap voor de bank, plat op de vloer, iets naast de lijn van de
// achterste voet (twee rails). De heup zakt recht omlaag tot de voorste dij
// ongeveer horizontaal is; de voorste knie staat dan ongeveer boven de enkel en
// de hiel blijft aan de grond. De romp helt licht voorover met een rechte rug,
// de dumbbells hangen aan gestrekte armen naast de heupen, blik vooruit.
// Boven blijft de voorste knie licht gebogen. Tempo volgens de coaching:
// 3 tellen omlaag, kort stil, 1 tel omhoog.

import { balanceer, bereikbaar, houding, lus } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'

/** Halve afstand tussen de voeten (twee rails). */
const SPOOR = 0.11
/** Kanteling van de achterste voet: tenen naar achteren, wreef op het kussen (graden). */
const VOET_ACHTER = 155
/** Enkel van de achterste voet: net boven het kussen (bovenkant 0,43 m) bij de voorrand. */
const ENKEL_ACHTER = { x: -SPOOR, y: 0.475, z: -0.76 } as const
/** Midden van de bank (dwars, 0,30 m diep): voorrand net achter de achterste enkel. */
const BANK_Z = -0.95
/** Heuphoogte boven (voorste knie licht gebogen) en onderin (voorste dij ongeveer horizontaal). */
const HEUP = { boven: 0.93, onder: 0.525 }
/** Bekken voor/achter: de heup gaat recht omlaag, het balanceren zet hem precies. */
const BEKKEN_Z = -0.32
/** Romp licht voorover met een rechte rug (graden). */
const KANTEL = { boven: 8, onder: 24 }
/** Zwaartepunt: het meeste gewicht op het voorste been. */
const DOEL_Z = { boven: -0.22, onder: -0.27 }
/** Gewicht van het paar dumbbells voor het zwaartepunt (fractie van het lichaam). */
const LAST_GEWICHT = 0.25
/** Halve afstand tussen de handen: dumbbells naast de heupen, vrij van de dij. */
const GREEP = { boven: 0.255, onder: 0.29 }

const BASIS: Oefening3d = {
  naam: 'Bulgarian split squat',
  sleutels: [],
  last: 'hangend',
  handen: 'greep',
  enkel: { x: SPOOR, y: 0.08, z: 0 },
  enkelRechts: ENKEL_ACHTER,
  voet: { kanteling: 0, uitdraai: 4 },
  voetRechts: { kanteling: VOET_ACHTER, uitdraai: 0 },
  // Omlaag en vooruit: de voorste knie volgt de tenen, de achterste wijst naar de vloer.
  knieRichting: { x: 0.1, y: -1, z: 1 },
  elleboogRichting: { x: 0.35, y: 0, z: -1 },
  greepRichting: { x: 0, y: 0, z: -1 },
  materiaal: [
    { soort: 'bankKaal', plek: { x: 0, y: 0, z: BANK_Z }, draai: 90 },
    { soort: 'halters' },
  ],
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring', 'romp'],
  // Van opzij en iets van voren: voorste scheen, achterste voet op de bank en de rompheling.
  camera: { hoek: 62, hoogte: 10, afstand: 4.6, doel: { x: 0, y: 0.72, z: -0.42 } },
}

function zetLast(h: Houding, greep: number): Houding {
  // Armen hangen recht onder de schouders, dumbbells iets achter de lijn.
  return { ...h, greep, lastZ: schouderIn(h).z - 0.02 }
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const kantel = KANTEL.boven + (KANTEL.onder - KANTEL.boven) * d
  const borst = -2 - 2 * d
  const romp = houding({
    bekkenY: HEUP.boven + (HEUP.onder - HEUP.boven) * d,
    bekkenZ: BEKKEN_Z,
    kantel,
    lende: 0,
    borst,
    nek: -(kantel + borst) * 0.85,
    schouders: -0.012,
  })
  const greep = GREEP.boven + (GREEP.onder - GREEP.boven) * d
  const doel = DOEL_Z.boven + (DOEL_Z.onder - DOEL_Z.boven) * d
  let uit = zetLast(romp, greep)
  for (let i = 0; i < 3; i++) uit = zetLast(balanceer(BASIS, uit, doel, LAST_GEWICHT), greep)
  return bereikbaar(BASIS, uit, 0.975)
}

export const BULGARIAN_SPLIT_SQUAT: Oefening3d = {
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.5, heen: 3.0, eind: 0.4, terug: 1.1 }, 2),
}
