import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrast } from '@/lib/club/kern/huisstijl'

// Contrast van de kleurhoofdstukken (WCAG 2.2 AA, 4.5:1 voor tekst). De waarden komen
// rechtstreeks uit voorpagina.css: het eerste .ayg-blok (licht) en het .ayg-blok in de
// media query voor donker. Elk paar is een tekstkleur op het vlak waar hij echt staat.

const CSS = readFileSync(path.join(__dirname, 'voorpagina.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

function blok(vanaf: number): Record<string, string> {
  const start = CSS.indexOf('.ayg {', vanaf)
  const tekst = CSS.slice(CSS.indexOf('{', start) + 1, CSS.indexOf('}', start))
  return Object.fromEntries([...tekst.matchAll(/--(vp-[\w-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]))
}

const LICHT = blok(0)
const DONKER = { ...LICHT, ...blok(CSS.indexOf('prefers-color-scheme: dark')) }

const PAREN: readonly [tekst: string, vlak: string][] = [
  ['vp-papier-tekst', 'vp-papier'],
  ['vp-papier-tekst', 'vp-papier-diep'],
  ['vp-papier-zacht', 'vp-papier'],
  ['vp-papier-zacht', 'vp-papier-diep'],
  ['vp-creme', 'vp-racegroen'],
  ['vp-salie', 'vp-racegroen'],
  ['vp-creme', 'vp-racegroen-licht'],
  ['vp-salie', 'vp-racegroen-licht'],
  ['vp-creme', 'vp-fles'],
  ['vp-salie', 'vp-fles'],
  ['vp-inkt', 'vp-salie'],
  ['vp-salie', 'vp-inkt'],
  ['vp-creme', 'vp-inkt'],
]

describe('kleurhoofdstukken: contrast', () => {
  it.each([
    ['licht', LICHT],
    ['donker', DONKER],
  ] as const)('elk tekstpaar haalt 4.5:1 (%s)', (_naam, kleuren) => {
    const teLaag = PAREN.map(([t, v]) => ({ paar: `${t} op ${v}`, c: contrast(kleuren[t], kleuren[v]) })).filter((p) => !(p.c >= 4.5))
    expect(teLaag).toEqual([])
  })
})
