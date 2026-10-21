// 3D-oefening: Split squat met dumbbells. Naam exact zoals in de oefenbibliotheek.
// De voeten staan de hele lus stil in een grote pas op heupbreedte (twee rails):
// links voor met de voet plat, rechts achter op de bal van de voet. De heup gaat
// als een lift recht omlaag tot de achterste knie net boven de grond is. Boven
// blijft de voorste knie licht gebogen (niet op slot). De achterste hiel komt
// verder omhoog naarmate je dieper zakt. Dumbbells hangen aan gestrekte armen
// naast de heupen, schouders laag, blik neutraal vooruit.
// Tempo: 2 tellen omlaag, kort stil, 1 tel omhoog.

import { balanceer, bereikbaar, HEUP_STAAND, houding, lus } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'

/** Lengte van de pas: van de voorste naar de achterste enkel (m). */
const PAS = 0.75
/** Halve afstand tussen de voeten: heupbreedte. */
const SPOOR = 0.11
/** Gewicht van het paar dumbbells voor het zwaartepunt (fractie van het lichaam). */
const LAST_GEWICHT = 0.25
/** Hielhoek van de achterste voet boven en onderin (graden). */
const HIEL = { boven: 30, onder: 56 }
/** Heuphoogte boven (voorste knie licht gebogen) en onderin (achterste knie net boven de grond). */
const HEUP = { boven: HEUP_STAAND, onder: 0.52 }
/** Hoe ver een been boven maximaal mag strekken: houdt de knieen van het slot. */
const REIK_BOVEN = 0.975
/** Bekken iets voor het midden van de pas, waar het na balanceren uitkomt. */
const BEKKEN_Z = -0.29
/** Halve afstand tussen de handen: dumbbells naast de heup, vrij van de dij. */
const GREEP = { boven: 0.255, onder: 0.305 }
/** Handen net achter de lijn van de schouders, langs het lichaam. */
const LAST_TERUG = -0.05

/**
 * Afstand van de enkel naar het draaipunt van de achterste voet (m). De schoen
 * heeft geen buigende tenen, dus de voet draait om de neus van de schoen in
 * plaats van om de bal: zo blijft de neus op de vloer en zakt hij er niet in.
 */
const DRAAIPUNT = 0.19
const GRAAD = Math.PI / 180

/** Waar de enkel heen gaat als de voet om de neus van de schoen kantelt. */
function opNeus(graden: number): { voetY: number; voetZ: number } {
  const a = graden * GRAAD
  const y = 0.08
  const z = -DRAAIPUNT
  return { voetY: y * Math.cos(a) - z * Math.sin(a) - y, voetZ: y * Math.sin(a) + z * Math.cos(a) - z }
}

const BASIS: Oefening3d = {
  naam: 'Split squat met dumbbells',
  sleutels: [],
  last: 'hangend',
  handen: 'greep',
  enkel: { x: SPOOR, y: 0.08, z: 0 },
  enkelRechts: { x: -SPOOR, y: 0.08, z: -PAS },
  voet: { kanteling: 0, uitdraai: 4 },
  knieRichting: { x: 0.1, y: 0, z: 1 },
  elleboogRichting: { x: 0.35, y: 0, z: -1 },
  greepRichting: { x: 0, y: 0, z: -1 },
  materiaal: [{ soort: 'halters' }],
  spieren: ['dij', 'bil'],
  camera: { hoek: 56, hoogte: 9, afstand: 4.5, doel: { x: 0, y: 0.78, z: -0.32 } },
}

/** Zwaartepunt iets voor het midden tussen de voeten: het voorste been doet het werk. */
function doelZ(d: number): number {
  return -0.31 + 0.02 * d
}

function zetLast(h: Houding, greep: number): Houding {
  return { ...h, greep, lastZ: schouderIn(h).z - LAST_TERUG }
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const hiel = HIEL.boven + (HIEL.onder - HIEL.boven) * d
  const voet = opNeus(hiel)
  const romp = houding({
    bekkenY: HEUP.boven + (HEUP.onder - HEUP.boven) * d,
    bekkenZ: BEKKEN_Z,
    kantel: 4 + 1.5 * d,
    lende: 0,
    borst: -1,
    nek: -5 - 2 * d,
    schouders: -0.012,
    stapKantel: hiel,
    stapY: voet.voetY,
    stapZ: voet.voetZ,
  })
  const greep = GREEP.boven + (GREEP.onder - GREEP.boven) * d
  let uit = zetLast(romp, greep)
  for (let i = 0; i < 3; i++) uit = zetLast(balanceer(BASIS, uit, doelZ(d), LAST_GEWICHT), greep)
  return bereikbaar(BASIS, uit, REIK_BOVEN)
}

export const SPLIT_SQUAT_DB: Oefening3d = {
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.6, heen: 2.0, eind: 0.4, terug: 1.0 }, 2),
}
