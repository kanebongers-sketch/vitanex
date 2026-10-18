// ─── Fit Factory Club, illustraties: inverse kinematica met twee delen (PUUR) ─
// Voor een arm (bovenarm, onderarm) of been (bovenbeen, onderbeen): waar moet
// het middelste gewricht (elleboog, knie) staan zodat het eind (hand, enkel) op
// het doel komt? Met de cosinusregel. `buig` kiest de kant: +1 = het middelste
// gewricht ligt met de klok mee van de lijn begin naar doel, -1 = tegen de klok in.
// Is het doel te ver, dan wijst het hele deel gestrekt naar het doel en is
// `bereikt` onwaar (de tests controleren dat elke oefening haar doelen haalt).

import { afstand, hoekVan, plus, maal, richting, type Vec } from './vec'

export interface IkUitkomst {
  midden: Vec
  eind: Vec
  /** Absolute hoek van het eerste deel. */
  hoek1: number
  /** Absolute hoek van het tweede deel. */
  hoek2: number
  bereikt: boolean
}

const MARGE = 1e-6

export function tweeDelen(begin: Vec, doel: Vec, l1: number, l2: number, buig: 1 | -1): IkUitkomst {
  const d = afstand(begin, doel)
  const basis = d < MARGE ? 180 : hoekVan({ x: doel.x - begin.x, y: doel.y - begin.y })
  const maxD = l1 + l2
  const minD = Math.abs(l1 - l2)
  const dd = Math.min(Math.max(d, minD + MARGE), maxD - MARGE)
  const cosA = (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd)
  const alfa = Math.acos(Math.min(1, Math.max(-1, cosA))) / (Math.PI / 180)
  const hoek1 = basis + buig * alfa
  const midden = plus(begin, maal(richting(hoek1), l1))
  const hoek2 = hoekVan({ x: doel.x - midden.x, y: doel.y - midden.y })
  const eind = plus(midden, maal(richting(hoek2), l2))
  return { midden, eind, hoek1, hoek2, bereikt: d <= maxD + 1e-3 && d >= minD - 1e-3 }
}
