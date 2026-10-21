// 3D-oefening: Roemeense deadlift met barbell. Naam exact zoals in de oefenbibliotheek.
// Eigen houdingen in plaats van de algemene hinge: de heupen gaan ver naar
// achteren terwijl de knieen in een vaste lichte buiging blijven (schenen bijna
// verticaal), de stang schuift in elke stand langs de dijen tot net onder de knie
// en de nek blijft in lijn met de rug, de ogen een paar meter voor je op de vloer.
// Bovenaan staat de heup helemaal gestrekt (billen aan), zonder achterover te leunen.

import { BLIK, TEMPO, bereikbaar, houding, langsBeen, zwaartepuntZ } from '../bouw/basis'
import { staandeLast } from '../bouw/benen'
import { startVoorSleutel } from '../interpolatie'
import { figuurIn } from '../kinematica'
import { BEEN } from '../maten'
import type { Houding, Oefening3d, Sleutel } from '../typen'

/** Halve greepbreedte: handen op heupbreedte, net buiten de dijen. */
const GREEP = 0.215
/** Reik van het been (heup tot enkel ten opzichte van de beenlengte) bovenaan: knie zacht, niet op slot. */
const REIK_BOVEN = 0.995
/** Reik tijdens de hele beweging: een vaste kniebuiging van ongeveer 20 graden. */
const REIK_VAST = 0.979
/** Bekkenkanteling onderin (graden voorover): stang net onder de knie, rug neutraal. */
const KANTEL_ONDER = 95
/** Afstand van het midden van de stang tot de lijn van het been: de stang raakt de broek. */
const STANG_AAN_BEEN = 0.055
/** Zwaartepunt boven het midden van de voet. */
const MIDDEN_VOET = 0.04

/**
 * Blik bij de RDL: de nek strekt onderin iets meer dan de algemene scharnierblik,
 * zodat de ogen een paar meter voor je op de vloer blijven en de kin niet naar de borst zakt.
 */
const BLIK_RDL = { hoek: BLIK.scharnier.hoek, sterkte: 0.68 }

const LAST = staandeLast('stang', GREEP, 0.1, false)

const BASIS: Oefening3d = {
  naam: 'Roemeense deadlift met barbell',
  sleutels: [],
  ...LAST.o,
  handen: 'greep',
  enkel: { x: 0.11, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 5 },
  knieRichting: { x: 0.1, y: 0, z: 1 },
  // Het werk zit in de achterkant van de dij en de billen; de onderrug houdt de rug
  // recht en de brede rugspieren houden de stang tegen de benen.
  spieren: ['hamstring', 'bil'],
  spierenSecundair: ['onderrug', 'rug'],
  blik: BLIK_RDL,
  // 3/4 van achteren-opzij op borsthoogte: heupen naar achteren, rechte lijn van nek
  // tot stuit en de achterkant van de dij (hoofdspier) goed in beeld. Puur van opzij
  // valt onderin de schijf voor de schenen; vanuit deze hoek staan knieen, schenen en
  // voeten vrij en zie je de stang langs de benen schuiven.
  camera: { hoek: 117, hoogte: 13, afstand: 3.7, doel: { x: 0, y: 0.78, z: 0.1 } },
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
    uit = langsBeen(BASIS, uit, STANG_AAN_BEEN)
    const fout = zwaartepuntZ(BASIS, uit, LAST.gewicht) - MIDDEN_VOET
    uit = zetReik({ ...uit, bekkenZ: uit.bekkenZ - fout * 1.2 }, reik)
  }
  return langsBeen(BASIS, uit, STANG_AAN_BEEN)
}

/** Reik bij diepte d: bovenaan zacht gestrekt, na de eerste centimeters de vaste buiging. */
function reikBij(d: number): number {
  const f = Math.min(1, d / 0.12)
  return REIK_BOVEN + (REIK_VAST - REIK_BOVEN) * (f * f * (3 - 2 * f))
}

function maak(d: number): Houding {
  // De heup leidt meteen: de kanteling loopt in het begin sneller op dan de diepte.
  const k = 1 - (1 - d) ** 1.12
  const h = houding({
    bekkenY: 0.94,
    // Bovenaan het bekken iets achterover (billen aan), daarna heupen naar achteren.
    kantel: -3 + (KANTEL_ONDER + 3) * k,
    // Rug neutraal: onderrug vast, bovenrug licht gestrekt (borst open).
    lende: 2 - 9 * k,
    borst: -2 - 13 * k,
    // De blik (scharnier) houdt onderin de ogen een paar meter voor je op de vloer;
    // rechtop heft de nek dat op zodat je gewoon vooruit kijkt.
    nek: -22 * (1 - k),
    // Schouders laag en naar achteren: oksels naar de heupen.
    schouders: -0.035 - 0.005 * k,
    greep: GREEP,
  })
  return inBalans(h, reikBij(d))
}

/** Een sleutel op diepte d. */
function op(d: number, rust: number, duur: number): Sleutel {
  return { houding: maak(d), vast: rust, naarVolgende: duur }
}

const HEEN = TEMPO.hinge.heen / 4
/** Bovenaan langer stil: heup helemaal gestrekt, billen aan, nek neutraal. */
const BOVEN_STIL = TEMPO.hinge.begin + 0.6
/** Omhoog in ruim een tel: de diepere scharnier vraagt iets meer tijd dan de standaard. */
const TERUG = (TEMPO.hinge.terug + 0.2) / 3

// Rechtop met billen aan, drie tellen omlaag met de heupen voorop, kort stil in de
// rek en een tel omhoog door de heupen naar voren te duwen.
const SLEUTELS: readonly Sleutel[] = [
  op(0, BOVEN_STIL, HEEN),
  op(0.3, 0, HEEN),
  op(0.58, 0, HEEN),
  op(0.82, 0, HEEN),
  op(1, TEMPO.hinge.eind, TERUG),
  op(0.68, 0, TERUG),
  op(0.3, 0, TERUG),
]

/** Index van de diepste stand: die valt op de helft van de lus. */
const ONDERIN = 4

export const RDL_BARBELL: Oefening3d = {
  ...BASIS,
  sleutels: SLEUTELS,
  start: startVoorSleutel(SLEUTELS, ONDERIN, 0.5),
}
