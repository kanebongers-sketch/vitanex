import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrast } from '@/lib/club/kern/huisstijl'

// Contrast van de hoofdstukken in obsidiaan (besluit Kane 28-10-2026; WCAG 2.2 AA,
// 4.5:1 voor tekst, 3:1 voor grote tekst en UI-lijnen). De waarden komen rechtstreeks
// uit het .ayg-blok van voorpagina.css. Elk paar is een kleur op het vlak waar hij
// echt staat. Er is een palet: de site is altijd donker.

const CSS = readFileSync(path.join(__dirname, 'voorpagina.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const start = CSS.indexOf('.ayg {')
const blok = CSS.slice(CSS.indexOf('{', start) + 1, CSS.indexOf('}', start))
const K: Record<string, string> = Object.fromEntries([...blok.matchAll(/--(vp-[\w-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]))

const LAGEN = ['vp-diep', 'vp-basis', 'vp-vlak', 'vp-vlak-hoog', 'vp-vlak-top'] as const

const TEKST: readonly [tekst: string, vlak: string][] = [
  ...LAGEN.flatMap((v) => [['vp-wit', v], ['vp-wit-zacht', v], ['vp-salie', v]] as [string, string][]),
  ['vp-racegroen', 'vp-salie'],
  ['vp-racegroen', 'vp-salie-licht'],
  ['vp-veld-hint', 'vp-basis'],
]

const LIJNEN: readonly [lijn: string, vlak: string][] = [
  ['vp-groen-lijn', 'vp-diep'],
  ['vp-salie', 'vp-vlak-top'],
]

describe('hoofdstukken in obsidiaan: contrast', () => {
  it('elk tekstpaar haalt 4.5:1', () => {
    const teLaag = TEKST.map(([t, v]) => ({ paar: `${t} op ${v}`, c: contrast(K[t], K[v]) })).filter((p) => !(p.c >= 4.5))
    expect(teLaag).toEqual([])
  })
  it('groene lijnen halen 3:1', () => {
    const teLaag = LIJNEN.map(([t, v]) => ({ paar: `${t} op ${v}`, c: contrast(K[t], K[v]) })).filter((p) => !(p.c >= 3))
    expect(teLaag).toEqual([])
  })
  it('de lagen lopen op van diep naar hoog, zodat de hoofdstukken te onderscheiden zijn', () => {
    for (let i = 1; i < LAGEN.length; i++) expect(contrast(K[LAGEN[i]], K[LAGEN[0]])).toBeGreaterThan(contrast(K[LAGEN[i - 1]], K[LAGEN[0]]))
  })
  it('geen lichte versie meer: de vlakken in creme, racegroen, flessengroen en salie zijn weg', () => {
    expect(CSS).not.toMatch(/prefers-color-scheme/)
    expect(CSS).not.toMatch(/--vp-(creme|papier|fles|inkt)\b/)
    expect(CSS).not.toMatch(/background:\s*var\(--vp-(racegroen|salie)\)\s*;\s*color:\s*var\(--vp-wit\)/)
  })
})
