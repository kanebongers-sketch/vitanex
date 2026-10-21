// ─── Fit Factory Club, 3D-oefenbeelden: afspelen van een oefening (PUUR) ────
// `houdingVan()` is de houding die het tekenen per frame gebruikt. Bovenop de
// gewone interpolatie tussen sleutels (interpolatie.ts):
// - `start`: de lus begint op een gekozen fractie, zodat het belangrijkste moment
//   op een logische plek valt;
// - `kniePad`: de knie buigt in hetzelfde tempo als de andere kanalen en het
//   bekken zakt daarmee mee. Zonder zakt het bekken lineair en buigt de knie
//   bovenin eerst, omdat de kniehoek bij een bijna gestrekt been heel snel
//   verandert (hij volgt de wortel van de daling).

import { figuurIn } from './kinematica'
import { houdingOp, lusDuur, standTijd } from './interpolatie'
import { BEEN, MATEN } from './maten'
import type { Houding, Oefening3d, Sleutel } from './typen'

const GRAAD = Math.PI / 180

/** Reik van het been (afstand heup tot enkel gedeeld door de beenlengte) bij een kniebuiging. */
export function reikBijKnie(buiging: number): number {
  const a = MATEN.dij
  const b = MATEN.scheen
  return Math.sqrt(a * a + b * b + 2 * a * b * Math.cos(buiging * GRAAD)) / BEEN
}

/**
 * Zet de hoogte van het bekken zo dat de linkerknie `buiging` graden gebogen is.
 * Al het andere blijft gelijk. Ligt het been bijna plat (leg press), dan blijft de
 * houding zoals hij is.
 */
export function metKnie(o: Oefening3d, h: Houding, buiging: number): Houding {
  const doel = reikBijKnie(buiging) * BEEN
  let uit = h
  for (let i = 0; i < 8; i++) {
    const been = figuurIn(o, uit).benen[0]
    const afstand = been.begin.distanceTo(been.eind)
    const fout = doel - afstand
    if (Math.abs(fout) < 1e-5) break
    const helling = (been.begin.y - been.eind.y) / Math.max(1e-6, afstand)
    if (helling < 0.3) return uit
    uit = { ...uit, bekkenY: uit.bekkenY + fout / helling }
  }
  return uit
}

const KNIE_SLEUTELS = new WeakMap<Oefening3d, readonly Sleutel[]>()

/** Dezelfde sleutels met de kniebuiging in het kanaal bekkenY, om die mee te interpoleren. */
function knieSleutels(o: Oefening3d): readonly Sleutel[] {
  const bekend = KNIE_SLEUTELS.get(o)
  if (bekend) return bekend
  const uit = o.sleutels.map((s) => ({ ...s, houding: { ...s.houding, bekkenY: figuurIn(o, s.houding).benen[0].buiging } }))
  KNIE_SLEUTELS.set(o, uit)
  return uit
}

/** Seconden waarmee het afspelen in de lus verschoven is. */
function verschuiving(o: Oefening3d): number {
  return (o.start ?? 0) * lusDuur(o.sleutels)
}

/** De houding die getekend wordt op tijd `t` (seconden, loopt eindeloos door). */
export function houdingVan(o: Oefening3d, t: number): Houding {
  const tijd = t + verschuiving(o)
  const h = houdingOp(o.sleutels, tijd)
  if (!o.kniePad) return h
  return metKnie(o, h, houdingOp(knieSleutels(o), tijd).bekkenY)
}

/** Tijd in het afspelen (zoals `houdingVan` hem leest) van de begin- of eindhouding. */
export function standTijdVan(o: Oefening3d, stand: 'begin' | 'eind'): number {
  const duur = lusDuur(o.sleutels)
  const t = standTijd(o.sleutels, stand) - verschuiving(o)
  return ((t % duur) + duur) % duur
}
