// 3D-oefening: Lunge met dumbbells. Naam exact zoals in de oefenbibliotheek.
// Eigen houdingen: de linkervoet staat vast, de rechtervoet stapt een flinke pas
// naar voren en landt hiel eerst. De romp gaat eerder mee dan de voet en het zakken
// begint al tijdens het neerzetten, zodat stap en zakken een vloeiende beweging zijn. Onderin twee hoeken van ongeveer 90 graden, voorste
// knie boven de voet, romp rechtop met de blik vooruit, achterste voet op de bal.
// De dumbbells hangen recht onder de schouders langs de zij. Tempo volgens de
// coaching: 2 tellen omlaag, kort stil, dan een duidelijke afzet via de voorste hiel
// (gewicht naar achteren, tenen los, heup al iets omhoog) en vlot terug naar staan.
// De lus toont een kant (rechterbeen voor); wisselen kan het figuur nog niet.

import { staandeLast } from '../bouw/benen'
import { balanceer, HEUP_STAAND, houding, opTenen } from '../bouw/basis'
import type { Houding, Oefening3d, Sleutel } from '../typen'

/** Lengte van de pas naar voren (m). */
const PAS = 0.8
/** Hoe ver het heupgewricht onderin zakt (m): achterste knie een handbreedte boven de vloer. */
const ZAKKEN = 0.33
/** Achterste hiel omhoog onderin (graden): gewicht op de bal van de voet. */
const HIEL_OP = 33
/** Bekkenkanteling boven en onderin: romp vrijwel rechtop. */
const KANTEL_BOVEN = 5
const KANTEL_ONDER = 8

/** Halve breedte tussen de handen: net buiten de dijen, zodat de halters vrij hangen. */
const GREEP = 0.285
/** Handen iets achter de schouder: lucht tussen halter en voorste dij. */
const LAST = staandeLast('halters', GREEP, -0.09)
/** Afzet: zwaartepunt even naar achteren (m) en voorste tenen licht los (graden). */
const AFZET_TERUG = 0.1
const AFZET_TENEN = 14
/** Tenen omhoog vlak voor de landing (graden): de voorste voet landt hiel eerst. */
const HIEL_EERST = 16

/** Seconden: stil boven, zakken, stil onder, afzet, terugstappen. */
const TIJD = { begin: 0.3, heen: 1.8, eind: 0.25, afzet: 0.25, terug: 1.4 } as const

const BASIS: Oefening3d = {
  naam: 'Lunge met dumbbells',
  sleutels: [],
  ...LAST.o,
  handen: 'greep',
  enkel: { x: 0.11, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 4 },
  knieRichting: { x: 0.12, y: 0, z: 1 },
  spieren: ['dij', 'bil'],
  // Schuin voor-zij: beide knieen, de voorste knie boven de voet en de romp tegelijk.
  camera: { hoek: 68, hoogte: 9, afstand: 4.4, doel: { x: 0, y: 0.76, z: 0.38 } },
}

function klem(x: number): number {
  return Math.min(1, Math.max(0, x))
}

/** Zachte start en landing van een deelbeweging. */
function zacht(x: number): number {
  const k = klem(x)
  return k * k * (3 - 2 * k)
}

function maak(p: { t: number; a: number }): Houding {
  const k = klem(p.t / 0.7)
  const stap = zacht(k)
  // De romp gaat eerder mee naar voren dan de voet.
  const romp = zacht(p.t / 0.55)
  // Het zakken begint al terwijl de voet landt.
  const d = zacht((p.t - 0.25) / 0.75)
  const til = Math.sin(Math.PI * k) * 0.07
  // Tenen omhoog in de tweede helft van de stap: de hiel raakt eerst de vloer.
  const tenenOp = HIEL_EERST * Math.sin(Math.PI * Math.pow(k, 1.6))
  // De achterste (linker) hiel gaat omhoog zodra het gewicht naar voren gaat.
  const hiel = HIEL_OP * klem(0.45 * klem(stap * 2 - 1) + 0.55 * d)
  const lk = opTenen(hiel)
  const kantel = KANTEL_BOVEN + (KANTEL_ONDER - KANTEL_BOVEN) * d
  const borst = -2 * d
  const h = houding({
    bekkenY: HEUP_STAAND - 0.012 * stap - ZAKKEN * d + 0.03 * p.a,
    bekkenZ: (PAS / 2) * stap,
    kantel,
    lende: 0,
    borst,
    // Blik recht vooruit: de nek vangt de kanteling van de romp op.
    nek: -(kantel + borst) * 0.9,
    voetKantel: hiel,
    voetY: lk.voetY,
    voetZ: lk.voetZ,
    stapKantel: -hiel - tenenOp - AFZET_TENEN * p.a,
    stapY: til - lk.voetY,
    stapZ: PAS * stap - lk.voetZ,
  })
  // Zwaartepunt tussen de voeten, iets meer naar de voorste voet.
  // Bij de afzet schuift het gewicht naar de voorste hiel en de romp naar achteren.
  const doel = PAS * (0.6 * romp + 0.4 * stap) * 0.55 + 0.04 - AFZET_TERUG * p.a
  const zet = (x: Houding): Houding => LAST.zet(x)
  let uit = zet(h)
  for (let i = 0; i < 2; i++) uit = zet(balanceer(BASIS, uit, doel, LAST.gewicht))
  return uit
}

/** Stap en zakken in vijf gelijke delen, van staan naar onderin. */
function heen(): Sleutel[] {
  const n = 5
  return Array.from({ length: n }, (_, i) => ({
    houding: maak({ t: i / n, a: 0 }),
    vast: i === 0 ? TIJD.begin : 0,
    naarVolgende: TIJD.heen / n,
  }))
}

/** Onderin, korte afzet via de voorste hiel en in een beweging terug naar staan. */
function terug(): Sleutel[] {
  const stappen = [
    { t: 0.9, a: 0.6 },
    { t: 0.62, a: 0.3 },
    { t: 0.36, a: 0.1 },
    { t: 0.13, a: 0 },
  ]
  // Vijf deelstukken: vier tussenhoudingen en daarna terug naar het begin.
  const deel = TIJD.terug / (stappen.length + 1)
  return [
    { houding: maak({ t: 1, a: 0 }), vast: TIJD.eind, naarVolgende: TIJD.afzet },
    { houding: maak({ t: 1, a: 1 }), vast: 0, naarVolgende: deel },
    ...stappen.map((p) => ({ houding: maak(p), vast: 0, naarVolgende: deel })),
  ]
}

export const LUNGE_DUMBBELLS: Oefening3d = { ...BASIS, sleutels: [...heen(), ...terug()] }
