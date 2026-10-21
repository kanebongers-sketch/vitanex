// ─── Fit Factory Club, 3D-oefenbeelden: hoofd en haar ───────────────────────
// Een realistisch, rustig hoofd van een atletische man. De vorm komt uit een
// afstandsveld (hoofd-vorm): schedel, voorhoofd, wenkbrauwboog, oogkassen,
// jukbeenderen, neus, lippen, kaaklijn, kin en een vloeiende overgang naar de
// nek. De huid krijgt kleurverschil (wangen, neus, lippen met lichte rand,
// lichte baardschaduw, zachte haarlijn, rustige vlekjes) en zachte schaduw in
// plooien. Daarbij ogen met oogleden, oren, kort haar en wenkbrauwen. De vorm
// wordt een keer berekend en daarna hergebruikt; per beeld kost het hoofd
// niets extra.
//
// De nek van de romp krijgt dezelfde kleur en schaduw (nekKleur), en de nek
// van het hoofd hangt aan dezelfde botten als de romp op die hoogte. Zo loopt
// de huid zonder naad van het hoofd in de nek over.

import { Color, Vector3 } from 'three'
import { glad, raster, type Bouwer, type PuntInfo } from './bouwer'
import { bouwHaarlaag, bouwWenkbrauwen, haarGrens, hoekenVan } from './hoofd-haar'
import { bouwOgen } from './hoofd-ogen'
import { bouwOren } from './hoofd-oor'
import { huidvorm, RINGEN, ROND } from './hoofd-raster'
import { lipGewicht, lipRand, mondGewicht, normaal, occlusie } from './hoofd-vorm'
import type { Palet } from './palet'
import { BIND, BOT, HOOFD_NAAR_BIND } from './skelet'

const KLEUR = {
  warm: new Color('#b8675f'),
  lip: new Color('#a4524c'),
  wal: new Color('#6b5552'),
  baard: new Color('#4a4442'),
  koel: new Color('#8d8a93'),
} as const

function vlek(dx: number, dy: number, dz: number, s: number): number {
  return Math.exp(-(dx * dx + dy * dy + dz * dz) / (s * s))
}

/** Rustige, lage ruis (-1 tot 1) voor kleurverschil in de huid. */
function golf(q: Vector3): number {
  return (
    0.5 * Math.sin(q.x * 97 + q.y * 41 + 1.3) * Math.sin(q.y * 83 - q.z * 57 + 0.4) +
    0.3 * Math.sin(q.x * 211 - q.z * 173 + 2.1) * Math.sin(q.y * 233 + q.x * 67) +
    0.2 * Math.sin(q.z * 151 + q.y * 199 + 0.7)
  )
}

/** Baardschaduw: kaak, kin, bovenlip en een beetje onder de kaak. */
function baard(q: Vector3, b: number, lip: number): number {
  const ax = Math.abs(q.x)
  const hoogte = glad(0.124, 0.098, q.y) * glad(0.05, 0.072, q.y)
  const zij = glad(118, 96, Math.abs(b))
  const wang = 1 - 0.6 * vlek(ax - 0.04, q.y - 0.11, q.z - 0.06, 0.016)
  return hoogte * zij * wang * (1 - lip)
}

/** Kleur van de huid op punt q (hoofdruimte) met schaduw ao. */
function huidKleur(p: Palet, q: Vector3, ao: number): Color {
  const ax = Math.abs(q.x)
  const k = p.huid.clone()
  // Rustig kleurverschil: iets lichter en geler op voorhoofd, roder op wangen en neus.
  k.multiplyScalar(1 + 0.025 * golf(q))
  k.multiplyScalar(1 + 0.03 * vlek(q.x, q.y - 0.205, q.z - 0.075, 0.04))
  const wang = vlek(ax - 0.044, q.y - 0.126, q.z - 0.072, 0.02)
  const neus = vlek(q.x, q.y - 0.118, q.z - 0.11, 0.011)
  const oor = vlek(ax - 0.07, q.y - 0.14, q.z + 0.01, 0.02)
  k.lerp(KLEUR.warm, 0.12 * wang + 0.14 * neus + 0.08 * oor)
  // Onder de ogen iets koeler en donkerder.
  k.lerp(KLEUR.wal, 0.07 * vlek(ax - 0.031, q.y - 0.1425, q.z - 0.079, 0.0085))
  const { a, b } = hoekenVan(q)
  const lip = lipGewicht(q.x, q.y, q.z)
  const bw = baard(q, b, lip)
  k.lerp(KLEUR.baard, 0.1 * bw).lerp(KLEUR.koel, 0.04 * bw)
  // Lippen: natuurlijk rood met een lichte rand, de spleet donker.
  k.lerp(KLEUR.lip, 0.74 * lip).multiplyScalar(1 + 0.07 * lipRand(q.x, q.y, q.z))
  k.multiplyScalar(1 - 0.6 * mondGewicht(q.x, q.y, q.z))
  // Neusgaten: zacht donker.
  k.multiplyScalar(1 - 0.28 * vlek(ax - 0.0058, q.y - 0.1078, q.z - 0.1045, 0.0026))
  // Haarlijn: kort haar dat naar de huid toe dunner wordt (gaat over in de rand van het haar).
  const grens = haarGrens(b)
  const dun = glad(grens + 9, grens - 1, a) ** 2 * glad(122, 100, Math.abs(b))
  k.lerp(p.haar, 0.45 * dun * (0.8 + 0.2 * golf(q)))
  return k.multiply(new Color(1 - 0.4 * ao, 1 - 0.46 * ao, 1 - 0.48 * ao))
}

const N = new Vector3()

/** Kleur van de huid van de nek (romp of hoofd) op punt q in hoofdruimte, met dezelfde schaduw. */
export function nekKleur(p: Palet, q: Vector3): Color {
  return huidKleur(p, q, occlusie(q, normaal(q, N)))
}

/** Botten van een punt van het hoofd: in de nek dezelfde menging als de romp. */
function bottenVan(q: Vector3): { readonly a: number; readonly b: number; readonly w: number } {
  const s = q.y + BIND.hoofd.y
  const nek = glad(0.53, 0.585, s)
  const kin = glad(0.056, 0.07, q.z)
  return { a: BOT.borst, b: BOT.hoofd, w: nek + (1 - nek) * kin }
}

function bouwHuid(b: Bouwer, p: Palet): void {
  const vorm = huidvorm()
  raster(b, {
    ringen: RINGEN,
    rond: ROND,
    naarBind: HOOFD_NAAR_BIND,
    punt: (i, j, uit) => {
      const k = (i * ROND + j) * 3
      return uit.set(vorm.punten[k], vorm.punten[k + 1], vorm.punten[k + 2])
    },
    info: (i, j, q): PuntInfo => ({ kleur: huidKleur(p, q, vorm.schaduw[i * ROND + j]), spier: 0, ...bottenVan(q) }),
  })
}

export function bouwHoofd(b: Bouwer, p: Palet): void {
  bouwHuid(b, p)
  bouwOgen(b, (q, ao) => huidKleur(p, q, ao))
  bouwOren(b, p)
}

export function bouwHaar(b: Bouwer, p: Palet): void {
  bouwHaarlaag(b, p, (q) => huidKleur(p, q, 0))
  bouwWenkbrauwen(b, p)
}
