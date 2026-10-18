// ─── Fit Factory Club, illustraties: naar SVG-tekst (PUUR) ──────────────────
// Dezelfde lagen als de React-weergave, maar als losse SVG-tekst: voor een
// zelfstandig bestand (bijvoorbeeld om later per oefening een .svg te bewaren)
// en voor de controle in tests. Kleuren via CSS-variabelen met een vaste
// terugval, zodat het bestand ook zonder onze stylesheet klopt.

import type { Kleur, Laag } from './laag'
import type { Animatie, Kader, Stand } from './scene'
import { getal } from './vorm'

/** Terugvalkleuren (donker thema, brons) voor een los bestand. */
export const TERUGVAL: Record<Kleur, string> = {
  vloer: 'rgba(0,0,0,0.28)',
  huid: '#c9c4bb',
  huidVer: '#9c978f',
  huidNabij: '#d6d1c8',
  schaduw: 'rgba(20,18,15,0.16)',
  glans: 'rgba(255,255,255,0.14)',
  spier: '#b58e5c',
  spierZacht: 'rgba(181,142,92,0.5)',
  spierVer: '#8a6c46',
  spierVerZacht: 'rgba(138,108,70,0.5)',
  haar: '#3b3833',
  schoen: '#2b2c30',
  schoenVer: '#202124',
  zool: '#e7e3dc',
  metaal: '#a9adb4',
  metaalDonker: '#55585e',
  schijf: '#2f3136',
  schijfVer: '#232428',
  schijfRand: '#4a4d53',
  schijfGlas: 'rgba(47,49,54,0.42)',
  kussen: '#3a3b40',
  kussenVer: '#2d2e32',
  frame: '#6b6e75',
  frameVer: '#45474c',
  kabel: '#8d9097',
}

export function cssVar(k: Kleur): string {
  return `--ill-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`
}

export interface PadStijl {
  fill: string
  stroke?: string
  strokeWidth?: number
  strokeLinecap?: 'round'
  fillRule?: 'evenodd'
}

/** De stijl van een laag als object (voor React). */
export function padStijl(l: Laag): PadStijl {
  const kleur = `var(${cssVar(l.kleur)},${TERUGVAL[l.kleur]})`
  if (l.lijn) return { fill: 'none', stroke: kleur, strokeWidth: l.lijn, strokeLinecap: 'round' }
  return l.evenodd ? { fill: kleur, fillRule: 'evenodd' } : { fill: kleur }
}

/** SMIL keyTimes als tekst. */
export function keyTimes(a: Animatie): string {
  return a.momenten.map((m) => String(Math.round(m * 10000) / 10000)).join(';')
}

/** Alle paden van een laag achter elkaar, in de volgorde van de tijdlijn (SMIL values). */
export function waarden(a: Animatie, paden: readonly string[]): string {
  return a.beelden.map((i) => paden[i]).join(';')
}

export function stijlVan(l: Laag): string {
  const kleur = `var(${cssVar(l.kleur)},${TERUGVAL[l.kleur]})`
  if (l.lijn) return `fill:none;stroke:${kleur};stroke-width:${l.lijn};stroke-linecap:round`
  return `fill:${kleur}${l.evenodd ? ';fill-rule:evenodd' : ''}`
}

export function viewBox(k: Kader): string {
  return `${getal(k.x)} ${getal(k.y)} ${getal(k.b)} ${getal(k.h)}`
}

/** Een stilstaande stand als SVG-tekst. */
export function svgStand(s: Stand, k: Kader, label: string): string {
  const paden = s.lagen.map((l) => `<path d="${l.d}" style="${stijlVan(l)}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox(k)}" role="img" aria-label="${label}">${paden}</svg>`
}

/** Een vloeiende animatie als SVG-tekst (SMIL: werkt ook als losse afbeelding). */
export function svgAnimatie(a: Animatie, label: string): string {
  const tijden = keyTimes(a)
  const paden = a.sporen
    .map(({ laag, paden: d }) => {
      return `<path d="${d[0]}" style="${stijlVan(laag)}"><animate attributeName="d" dur="${a.duur}s" repeatCount="indefinite" calcMode="linear" keyTimes="${tijden}" values="${waarden(a, d)}"/></path>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox(a.kader)}" role="img" aria-label="${label}">${paden}</svg>`
}
