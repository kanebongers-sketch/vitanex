// ─── Fit Factory Club, illustraties: het figuur in vooraanzicht (PUUR) ──────
// Voor oefeningen die je beter van voren uitlegt (lateral raise): hetzelfde
// figuur, symmetrisch. We rekenen de rechterhelft (rechts op het scherm) en
// spiegelen die om de middellijn. Spreiding van armen en benen in het beeldvlak.

import type { Spier } from '../spieren'
import type { Kleur, Laag, Lagen } from './laag'
import { legeLagen } from './laag'
import type { VoorHouding } from './typen'
import { assen, eind, punt, v, type Assen, type Vec } from './vec'
import { ellips, gladGesloten, gladOpen, ledemaatOmtrek, rondeRechthoek, schaduwMaan, spierBand, spierLens, type Profiel } from './vorm'
import type { SpierKeuze } from './lichaam-zij'

export const VOOR = {
  heupBreed: 9.4,
  schouder: v(18.6, -48),
  bovenbeen: 44,
  onderbeen: 43,
  bovenarm: 30,
  onderarm: 24,
  hand: 7,
  enkelHoogte: 7.5,
} as const

// Pluskant = naar de middellijn (rechterhelft); links wordt gespiegeld.
const PROFIEL_VOOR = {
  bovenbeen: [[0, 8.0, 9.2], [0.2, 8.0, 9.0], [0.5, 6.8, 7.6], [0.85, 5.2, 5.6], [1, 5.0, 5.2]],
  onderbeen: [[0, 5.0, 5.0], [0.2, 5.3, 5.9], [0.4, 4.8, 5.5], [0.75, 3.3, 3.5], [1, 3.1, 3.1]],
  bovenarm: [[0, 5.4, 7.4], [0.15, 5.6, 7.4], [0.4, 4.8, 5.4], [0.7, 4.4, 4.5], [1, 3.6, 3.7]],
  onderarm: [[0, 3.9, 4.1], [0.25, 4.1, 4.5], [0.6, 3.2, 3.3], [1, 2.5, 2.6]],
} as const satisfies Record<string, Profiel>

function spiegelProfiel(p: Profiel): Profiel {
  return p.map(([t, a, b]) => [t, b, a] as const)
}

// Romp (rechterhelft, van de nek naar het kruis), ten opzichte van het midden van de heupen.
const ROMP_HELFT: readonly (readonly [number, number])[] = [
  [6.2, -56.6], [12, -53.6], [19.4, -50.2], [16.8, -40.6], [16.2, -33], [13.4, -20], [14.8, -9], [16.6, 0.4], [8, 6.6], [1.4, 8.4],
]
const HOOFD_HELFT: readonly (readonly [number, number])[] = [
  [0, -82.6], [6.4, -80.4], [8.8, -73.6], [8.3, -66.6], [6.2, -61.6], [2.8, -59.4],
]
const HAAR_HELFT: readonly (readonly [number, number])[] = [
  [0, -83.4], [7, -81], [9.5, -74.5], [8.8, -71.6], [7.2, -75.4], [3.6, -77.6],
]
const SCHOEN_HELFT: readonly (readonly [number, number])[] = [
  [-3.6, -2.2], [3.6, -2.4], [5.2, 2.6], [5.8, 6.2], [4.2, 7.9], [-3.2, 7.9], [-4.8, 6.2], [-4.6, 2.6],
]

interface Lid {
  a: Assen
  l: number
  profiel: Profiel
  /** De buitenkant (voor schaduw): -1 rechts, +1 links (na spiegelen). */
  buiten: 1 | -1
}

export interface VoorSkelet {
  readonly heup: Vec
  readonly armen: readonly { boven: Lid; onder: Lid; hand: Assen; greep: Vec }[]
  readonly benen: readonly { boven: Lid; onder: Lid; enkel: Vec }[]
}

function zijde(h: VoorHouding, teken: 1 | -1): { arm: VoorSkelet['armen'][number]; been: VoorSkelet['benen'][number] } {
  const x = (p: Vec): Vec => v(h.heup.x + teken * p.x, h.heup.y + p.y)
  const hoek = (a: number) => (teken === 1 ? a : -a)
  const profiel = (p: Profiel) => (teken === 1 ? p : spiegelProfiel(p))
  const buiten: 1 | -1 = teken === 1 ? -1 : 1
  const kniefactor = Math.cos((h.knie * 0.6 * Math.PI) / 180)
  const bovenbeen = assen(x(v(VOOR.heupBreed, 0)), hoek(180 - h.beenSpreiding))
  const lBoven = VOOR.bovenbeen * kniefactor
  const onderbeen = assen(eind(bovenbeen, lBoven), hoek(180 - h.beenSpreiding))
  const bovenarm = assen(x(VOOR.schouder), hoek(180 - h.armSpreiding))
  const onderarm = assen(eind(bovenarm, VOOR.bovenarm), hoek(180 - h.armSpreiding + h.elleboog))
  const hand = assen(eind(onderarm, VOOR.onderarm), onderarm.hoek)
  return {
    arm: {
      boven: { a: bovenarm, l: VOOR.bovenarm, profiel: profiel(PROFIEL_VOOR.bovenarm), buiten },
      onder: { a: onderarm, l: VOOR.onderarm, profiel: profiel(PROFIEL_VOOR.onderarm), buiten },
      hand,
      greep: eind(hand, VOOR.hand * 0.7),
    },
    been: {
      boven: { a: bovenbeen, l: lBoven, profiel: profiel(PROFIEL_VOOR.bovenbeen), buiten },
      onder: { a: onderbeen, l: VOOR.onderbeen, profiel: profiel(PROFIEL_VOOR.onderbeen), buiten },
      enkel: eind(onderbeen, VOOR.onderbeen),
    },
  }
}

export function voorSkelet(h: VoorHouding): VoorSkelet {
  const r = zijde(h, 1)
  const l = zijde(h, -1)
  return { heup: h.heup, armen: [r.arm, l.arm], benen: [r.been, l.been] }
}

function gespiegeld(c: Vec, helft: readonly (readonly [number, number])[], sluitMidden: boolean): Vec[] {
  const rechts = helft.map(([x, y]) => v(c.x + x, c.y + y))
  const links = [...helft].reverse().map(([x, y]) => v(c.x - x, c.y + y))
  const zonderDubbel = sluitMidden ? links.filter((p, i) => !(i === 0 && Math.abs(p.x - c.x) < 0.01)) : links
  return [...rechts, ...zonderDubbel]
}

type SpierVoor = { lid: 'bovenarm' | 'bovenbeen'; band?: [number, number]; kant?: 1 | -1; t?: [number, number]; diepte?: number } | { romp: readonly (readonly [number, number])[] }

const SPIER_VOOR: Partial<Record<Spier, readonly SpierVoor[]>> = {
  middelste_schouder: [{ lid: 'bovenarm', band: [0, 0.32] }],
  voorste_schouder: [{ lid: 'bovenarm', band: [0, 0.3] }],
  trapezius: [{ romp: [[6.2, -56.6], [12, -53.6], [17.6, -50.8], [12, -50.6], [7, -52.6]] }],
  borstspieren: [{ romp: [[1.2, -46.5], [14, -48], [16, -41], [11.5, -36.2], [2, -36.6]] }],
  rechte_buikspier: [{ romp: [[0.8, -34], [7, -34], [7.4, -10], [4.5, 2], [0.8, 2]] }],
  quadriceps: [{ lid: 'bovenbeen', kant: 1, t: [0.12, 0.92], diepte: 1.4 }],
}

function spierKleur(primair: boolean): Kleur {
  return primair ? 'spier' : 'spierZacht'
}

function lidLagen(lid: Lid, sleutel: string, spieren: Laag[], huid: Kleur = 'huid'): Laag[] {
  return [
    { sleutel: `${sleutel}-vorm`, d: gladGesloten(ledemaatOmtrek(lid.a, lid.l, lid.profiel)), kleur: huid },
    ...spieren,
    { sleutel: `${sleutel}-schaduw`, d: gladGesloten(schaduwMaan(lid.a, lid.l, lid.profiel, lid.buiten, 0.32)), kleur: 'schaduw' },
  ]
}

function spierenOpLid(lid: Lid, soort: 'bovenarm' | 'bovenbeen', keuze: SpierKeuze, sleutel: string): Laag[] {
  const alle = [...keuze.secundair.map((sp) => ({ sp, primair: false })), ...keuze.primair.map((sp) => ({ sp, primair: true }))]
  const uit: Laag[] = []
  for (const { sp, primair } of alle) {
    for (const [i, vorm] of (SPIER_VOOR[sp] ?? []).entries()) {
      if (!('lid' in vorm) || vorm.lid !== soort) continue
      const punten = vorm.band
        ? spierBand(lid.a, lid.l, lid.profiel, vorm.band[0], vorm.band[1])
        : spierLens(lid.a, lid.l, lid.profiel, -lid.buiten as 1 | -1, vorm.t?.[0] ?? 0.1, vorm.t?.[1] ?? 0.9, vorm.diepte ?? 1)
      uit.push({ sleutel: `${sleutel}-${sp}-${i}`, d: gladGesloten(punten), kleur: spierKleur(primair) })
    }
  }
  return uit
}

function rompSpieren(h: Vec, keuze: SpierKeuze): Laag[] {
  const alle = [...keuze.secundair.map((sp) => ({ sp, primair: false })), ...keuze.primair.map((sp) => ({ sp, primair: true }))]
  const uit: Laag[] = []
  for (const { sp, primair } of alle) {
    for (const [i, vorm] of (SPIER_VOOR[sp] ?? []).entries()) {
      if (!('romp' in vorm)) continue
      for (const teken of [1, -1] as const) {
        const punten = vorm.romp.map(([x, y]) => v(h.x + teken * x, h.y + y))
        uit.push({ sleutel: `romp-${sp}-${i}-${teken}`, d: gladGesloten(punten), kleur: spierKleur(primair) })
      }
    }
  }
  return uit
}

function schoen(enkel: Vec, teken: 1 | -1, sleutel: string): Laag[] {
  const punten = SCHOEN_HELFT.map(([x, y]) => v(enkel.x + teken * x, enkel.y + y))
  return [
    { sleutel: `${sleutel}-schoen`, d: gladGesloten(punten, 0.8), kleur: 'schoen' },
    { sleutel: `${sleutel}-zool`, d: rondeRechthoek(v(enkel.x + teken * 0.4, enkel.y + VOOR.enkelHoogte - 0.7), 10.6, 1.6, 0.8), kleur: 'zool' },
  ]
}

function vuist(arm: VoorSkelet['armen'][number], sleutel: string): Laag {
  const c = punt(arm.hand, 4.4, 0)
  return { sleutel: `${sleutel}-vuist`, d: ellips(c, 4.6, 4.2, arm.hand.hoek - 90), kleur: 'huidNabij' }
}

/** Fijne lijnen die de vorm uitleggen: borstrand, middellijn, sleutelbeen. Rustig, in schaduwtoon. */
function vormLijnen(h: Vec): Laag[] {
  const p = (x: number, y: number) => v(h.x + x, h.y + y)
  const zijde = (teken: 1 | -1, sleutel: string): Laag[] => [
    { sleutel: `borstrand-${sleutel}`, d: gladOpen([p(teken * 1.4, -37), p(teken * 7, -35.8), p(teken * 13.4, -37.6), p(teken * 15.6, -41)]), kleur: 'schaduw', lijn: 0.9 },
    { sleutel: `sleutelbeen-${sleutel}`, d: gladOpen([p(teken * 2.6, -52.6), p(teken * 9, -51.8), p(teken * 15.6, -50.4)]), kleur: 'schaduw', lijn: 0.6 },
  ]
  return [
    ...zijde(1, 'r'),
    ...zijde(-1, 'l'),
    { sleutel: 'middellijn', d: gladOpen([p(0, -45), p(0, -30), p(0, -14)]), kleur: 'schaduw', lijn: 0.7 },
  ]
}

export function lichaamVoor(s: VoorSkelet, keuze: SpierKeuze): Lagen {
  const l = legeLagen()
  const h = s.heup
  const nek = v(h.x, h.y - 59)
  l.romp = [
    { sleutel: 'nek', d: rondeRechthoek(nek, 12.6, 12, 5), kleur: 'huid' },
    { sleutel: 'nek-schaduw', d: rondeRechthoek(v(h.x, h.y - 57.2), 10, 5, 2.5), kleur: 'schaduw' },
    { sleutel: 'romp', d: gladGesloten(gespiegeld(h, ROMP_HELFT, true)), kleur: 'huid' },
    ...rompSpieren(h, keuze),
    ...vormLijnen(h),
    { sleutel: 'hoofd', d: gladGesloten(gespiegeld(h, HOOFD_HELFT, true)), kleur: 'huid' },
    { sleutel: 'oor-r', d: ellips(v(h.x + 8.9, h.y - 70.5), 1.5, 2.6), kleur: 'schaduw' },
    { sleutel: 'oor-l', d: ellips(v(h.x - 8.9, h.y - 70.5), 1.5, 2.6), kleur: 'schaduw' },
    { sleutel: 'haar', d: gladGesloten(gespiegeld(h, HAAR_HELFT, true)), kleur: 'haar' },
  ]
  l.beenNabij = s.benen.flatMap((b, i) => {
    const teken = i === 0 ? 1 : -1
    return [
      ...lidLagen(b.onder, `been${i}-onder`, []),
      ...schoen(b.enkel, teken, `been${i}`),
      ...lidLagen(b.boven, `been${i}-boven`, spierenOpLid(b.boven, 'bovenbeen', keuze, `been${i}-boven`)),
      { sleutel: `been${i}-knieschijf`, d: ellips(punt(b.boven.a, b.boven.l - 1.5, 0.4 * teken), 2.8, 3.6, b.boven.a.hoek - 90), kleur: 'glans' as const },
    ]
  })
  l.armNabij = s.armen.flatMap((a, i) => [
    ...lidLagen(a.onder, `arm${i}-onder`, [], 'huidNabij'),
    ...lidLagen(a.boven, `arm${i}-boven`, spierenOpLid(a.boven, 'bovenarm', keuze, `arm${i}-boven`), 'huidNabij'),
  ])
  l.hand = s.armen.map((a, i) => vuist(a, `arm${i}`))
  return l
}
