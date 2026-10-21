// 3D-oefening: Dips op een bank. Naam exact zoals in de oefenbibliotheek.
// Handen naast de billen op de rand van een dwarse bank, vingers naar voren
// over de rand, voeten plat op de grond met de knieen gebogen (de lichtste
// versie). De billen blijven vlak voor de rand en de romp blijft rechtop: alleen
// de ellebogen buigen, ze wijzen recht naar achteren. In 2 tellen zakken tot de
// bovenarmen ongeveer horizontaal zijn, kort stil, in 1 tel omhoog duwen tot de
// armen gestrekt zijn. De schouders blijven laag, weg van de oren.
//
// De handen staan vast op de bank; per stand zetten we het schoudergewricht op
// een gekozen plek en rekenen het bekken daaruit terug, zodat de romp precies
// zo ver zakt als de armen toelaten.

import { BLIK, houding, lus, metMoment, type Tempo } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'

/** Midden van de bank (dwars achter de sporter); de voorrand ligt 0,15 m daarvoor. */
const BANK_Z = -0.45
const RAND = BANK_Z + 0.15
/** Pols plat op het kussen (bovenkant 0,43 m), net achter de rand, iets breder dan de heupen. */
const HAND = { x: 0.2, y: 0.43 + 0.035, z: RAND - 0.05 } as const

interface Stand {
  /** Schoudergewricht ten opzichte van de pols: omhoog en naar voren (m). */
  readonly dy: number
  readonly dz: number
  /** Romp iets voorover (graden), zodat de billen bij de bank blijven. */
  readonly kantel: number
}

/** Boven: armen bijna gestrekt, schouders iets voor de handen. */
const BOVEN: Stand = { dy: 0.55, dz: 0.12, kantel: -1 }
/** Onder: bovenarmen ongeveer horizontaal, ellebogen recht naar achteren. */
const ONDER: Stand = { dy: 0.29, dz: 0.2, kantel: 8 }

function stand(p: Stand): Houding {
  const romp = houding({ kantel: p.kantel, borst: -2, nek: 0, schouders: -0.012 })
  const s = schouderIn(romp)
  return houding({
    ...romp,
    bekkenY: HAND.y + p.dy - s.y,
    bekkenZ: HAND.z + p.dz - s.z,
    lastY: HAND.y,
    lastZ: HAND.z,
    greep: HAND.x,
  })
}

/** 2 tellen omlaag, kort stil, 1 tel omhoog. */
const TEMPO_DIP: Tempo = { begin: 0.4, heen: 2.0, eind: 0.3, terug: 1.0 }

export const DIPS_OP_EEN_BANK: Oefening3d = metMoment({
  naam: 'Dips op een bank',
  sleutels: lus({ ...BOVEN }, { ...ONDER }, (p) => stand({ dy: p.dy, dz: p.dz, kantel: p.kantel }), TEMPO_DIP, 2),
  last: 'wereld',
  handen: 'plat',
  enkel: { x: 0.12, y: 0.08, z: RAND + 0.58 },
  voet: { kanteling: 0, uitdraai: 8 },
  knieRichting: { x: 0.12, y: 1, z: 0.35 },
  elleboogRichting: { x: 0.05, y: 0, z: -1 },
  materiaal: [{ soort: 'bankKaal', plek: { x: 0, y: 0, z: BANK_Z }, draai: 90 }],
  spieren: ['bovenarm'],
  spierenSecundair: ['borst', 'schouder'],
  camera: { hoek: 58, hoogte: 12, afstand: 3.9, doel: { x: 0, y: 0.6, z: 0.0 } },
  blik: BLIK.vooruit,
})
