// 3D-oefening: Lunge met barbell. Naam exact zoals in de oefenbibliotheek.
// De stang ligt op de bovenrug (onder de nek, zoals bij de back squat), de handen
// ruim buiten de schouders trekken hem vast en de ellebogen wijzen naar beneden.
// De linkervoet staat vast, de rechtervoet stapt een flinke pas naar voren op
// heupbreedte (twee rails, niet op een lijn) en landt hiel eerst. Daarna zakt de
// heup recht omlaag tot de achterste knie net boven de vloer hangt: voorste knie
// boven de voet en in de richting van de tenen, romp rechtop met de borst omhoog.
// Elke stand staat in balans met het gewicht van de stang: die blijft boven het
// midden tussen de voeten. Tempo volgens de coaching: 2 tellen omlaag, kort stil,
// dan een krachtige afzet via de voorste hiel en terug naar de start.
// De lus toont een kant (rechterbeen voor).

import { balanceer, HEUP_STAAND, houding, opTenen } from '../bouw/basis'
import type { Houding, Oefening3d, Sleutel } from '../typen'

/** Lengte van de pas naar voren (m): ruim, zodat de voorste knie boven de voet blijft. */
const PAS = 0.8
/** Hoe ver het heupgewricht onderin zakt (m): achterste knie net boven de vloer. */
const ZAKKEN = 0.335
/** Achterste hiel omhoog onderin (graden): gewicht op de bal van de voet. */
const HIEL_OP = 33
/** Bekkenkanteling boven en onderin: romp rechtop onder de stang. */
const KANTEL_BOVEN = 5
const KANTEL_ONDER = 9
/** Gewicht van de stang voor de balans (fractie van het lichaam). */
const GEWICHT = 0.6
/** Stang op de bovenste trapezius, handen ruim buiten de schouders (borstframe). */
const STANG = { lastY: 0.222, lastZ: -0.135, greep: 0.46 } as const
/** Afzet: zwaartepunt even naar achteren (m) en voorste tenen licht los (graden). */
const AFZET_TERUG = 0.1
const AFZET_TENEN = 14
/** Tenen omhoog vlak voor de landing (graden): de voorste voet landt hiel eerst. */
const HIEL_EERST = 16

/** Seconden: ademen en vastzetten, zakken, stil onder, afzet, terugstappen. */
const TIJD = { begin: 0.5, heen: 2.0, eind: 0.3, afzet: 0.25, terug: 1.4 } as const

const BASIS: Oefening3d = {
  naam: 'Lunge met barbell',
  sleutels: [],
  last: 'romp',
  handen: 'greep',
  materiaal: [{ soort: 'stang', schijven: 2 }],
  // Ellebogen recht onder de stang: de stang zit vast op de rug.
  elleboogRichting: { x: 0.7, y: -1.6, z: -0.15 },
  // Voeten op heupbreedte, als op twee rails: ook van voren duidelijk naast elkaar.
  enkel: { x: 0.17, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 0 },
  knieRichting: { x: 0.12, y: 0, z: 1 },
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring', 'romp'],
  blik: { hoek: 0 },
  kniePad: true,
  // Schuin voor-zij op borsthoogte: twee rails, voorste knie boven de voet en de rechte romp.
  camera: { hoek: 40, hoogte: 13, afstand: 4.2, doel: { x: 0, y: 0.8, z: 0.4 } },
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
  const tenenOp = HIEL_EERST * Math.sin(Math.PI * Math.pow(k, 1.6))
  const hiel = HIEL_OP * klem(0.45 * klem(stap * 2 - 1) + 0.55 * d)
  const lk = opTenen(hiel)
  const kantel = KANTEL_BOVEN + (KANTEL_ONDER - KANTEL_BOVEN) * d
  const borst = -3 * d
  const h = houding({
    bekkenY: HEUP_STAAND - 0.012 * stap - ZAKKEN * d + 0.03 * p.a,
    bekkenZ: (PAS / 2) * stap,
    kantel,
    lende: 0,
    borst,
    nek: 0,
    schouders: 0.005,
    voetKantel: hiel,
    voetY: lk.voetY,
    voetZ: lk.voetZ,
    stapKantel: -hiel - tenenOp - AFZET_TENEN * p.a,
    stapY: til - lk.voetY,
    stapZ: PAS * stap - lk.voetZ,
    ...STANG,
  })
  // Zwaartepunt tussen de voeten, iets meer naar de voorste voet.
  const doel = PAS * (0.6 * romp + 0.4 * stap) * 0.55 + 0.04 - AFZET_TERUG * p.a
  let uit = h
  for (let i = 0; i < 2; i++) uit = { ...balanceer(BASIS, uit, doel, GEWICHT), ...STANG }
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
  const deel = TIJD.terug / (stappen.length + 1)
  return [
    { houding: maak({ t: 1, a: 0 }), vast: TIJD.eind, naarVolgende: TIJD.afzet },
    { houding: maak({ t: 1, a: 1 }), vast: 0, naarVolgende: deel },
    ...stappen.map((p) => ({ houding: maak(p), vast: 0, naarVolgende: deel })),
  ]
}

export const LUNGE_BARBELL: Oefening3d = { ...BASIS, sleutels: [...heen(), ...terug()] }
