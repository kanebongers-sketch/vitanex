// 3D-oefening: Lateral raise aan de kabel. Naam exact zoals in de oefenbibliotheek.
// Eenarmig: de sporter staat zijwaarts naast een kabelkolom met de katrol
// helemaal laag (de kolom aan de rechterkant). De linkerhand pakt het handvat
// voor het lichaam langs, voor de heup. De arm gaat met een vaste, lichte
// buiging in de elleboog zijwaarts omhoog, de elleboog voorop, tot de arm
// horizontaal op schouderhoogte staat. Kort vast en in 3 tellen gecontroleerd
// terug tot voor de heup, met spanning op de kabel. De rechterhand houdt de
// kolom vast voor steun, de schouder blijft laag en de romp staat stil.
//
// De kolom staat vast op x = 0 en loopt langs z; daarom is het hele figuur
// bijna een kwartslag gedraaid (rol 80): het kijkt ongeveer naar +x, de linkerkant wijst naar -z.

import { Vector3 } from 'three'
import { schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'
import { BLIK, houding, HEUP_STAAND, lus, metMoment, rechtsNaar } from '../bouw/basis'

const GRAAD = Math.PI / 180

/** Katrol helemaal laag, naast de rechtervoet. */
const KATROL = { x: 0.03, y: 0.14, z: 0.44 }
/** De kolom (vierkant 9 cm) waar de rechterhand steun aan houdt. */
const KOLOM_Z = KATROL.z + 0.11

/** Bijna een kwartslag gedraaid: de rechterheup iets naar achteren, zodat de kabel voor het been langs loopt. */
const ROL = 80

/** Rechtop, zijwaarts naast de kolom, schouders laag. */
const ROMP = houding({ bekkenY: HEUP_STAAND - 0.012, kantel: 0, rol: ROL, schouders: -0.012 })

const OMHOOG = new Vector3(0, 1, 0)

/** Van het eigen frame (x links, z voor) naar de wereld (figuur kijkt ongeveer naar +x). */
function wereld(v: Vector3): Vector3 {
  return v.clone().applyAxisAngle(OMHOOG, ROL * GRAAD)
}

/** Het vlak van de schouderblad: de arm gaat iets voor het lichaam omhoog. */
const VLAK = 24 * GRAAD

/**
 * De bovenarm bij `a` graden zijwaarts heffen (0 = hangt, 90 = horizontaal,
 * negatief = voor het lichaam langs naar de andere heup), in het eigen frame.
 */
function bovenarm(a: number): Vector3 {
  const r = a * GRAAD
  const opzij = Math.sin(r) * Math.cos(VLAK)
  const voor = 0.34 * Math.cos(r) + Math.abs(Math.sin(r)) * Math.sin(VLAK)
  return new Vector3(opzij, -Math.cos(r), voor).normalize()
}

/** De onderarm buigt vast iets naar voren en omlaag: de elleboog leidt. */
function onderarm(boven: Vector3, buiging: number): Vector3 {
  const richting = new Vector3(0, -0.35, 1)
  const loodrecht = richting.sub(boven.clone().multiplyScalar(richting.dot(boven))).normalize()
  const e = buiging * GRAAD
  return boven.clone().multiplyScalar(Math.cos(e)).addScaledVector(loodrecht, Math.sin(e))
}

const BASIS: Oefening3d = {
  naam: 'Lateral raise aan de kabel',
  sleutels: [],
  last: 'wereld',
  handen: 'greep',
  greepAnatomisch: true,
  enkel: { x: 0.03, y: 0.08, z: -0.13 },
  enkelRechts: { x: -0.05, y: 0.08, z: 0.12 },
  voet: { kanteling: 0, uitdraai: 88 },
  voetRechts: { kanteling: 0, uitdraai: -72 },
  knieRichting: { x: 1, y: 0, z: -0.15 },
  knieRichtingRechts: { x: 1, y: 0, z: 0.15 },
  elleboogRichting: { x: -0.6, y: 0.5, z: -1 },
  elleboogRichtingRechts: { x: -0.4, y: -1, z: 0.3 },
  materiaal: [{ soort: 'kabelLaag', greep: 'handvat', plek: KATROL }],
  spieren: ['schouder'],
  spierenSecundair: ['rug'],
  blik: BLIK.vooruit,
  // Camera loodrecht op het vlak waarin de arm beweegt: de zijwaartse baan is zo het best te lezen.
  camera: { hoek: 100, hoogte: 14, afstand: 4.9, doel: { x: 0.0, y: 0.9, z: 0.24 } },
}

/** De rechterhand om de voorste rand van de kolom, tussen heup en borst, de elleboog licht gebogen en laag. */
function steun(h: Houding): Houding {
  return rechtsNaar(BASIS, h, { x: 0.035, y: 1.04, z: KOLOM_Z - 0.03 })
}

function stand(p: { a: number; buiging: number }): Houding {
  const s = schouderIn(ROMP)
  const boven = bovenarm(p.a)
  const onder = onderarm(boven, p.buiging)
  const hand = s.clone().add(wereld(boven).multiplyScalar(MATEN.bovenarm)).add(wereld(onder).multiplyScalar(ARM_GREEP))
  return steun({ ...ROMP, greep: hand.x, lastY: hand.y, lastZ: hand.z, draai: 6, draaiRechts: 84 })
}

export const LATERAL_RAISE_KABEL: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ a: -48, buiging: 24 }, { a: 86, buiging: 24 }, stand, { begin: 0.4, heen: 1.15, eind: 0.6, terug: 3.0 }, 3),
})
