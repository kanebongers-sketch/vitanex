import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrast } from '@/lib/club/kern/huisstijl'
import { isGroenig, kleurigheid, losAllesOp } from '../tokens.testhulp'

// Contrast van de hoofdstukken in obsidiaan met iron als accent (besluit Kane
// 28-10-2026 en 29-10-2026; WCAG 2.2 AA, 4.5:1 voor tekst, 3:1 voor grote tekst en
// UI-lijnen). De waarden komen rechtstreeks uit het .ayg-blok van voorpagina.css; de
// iron-tokens verwijzen naar --iron-accent in aiyourgym.css en worden eerst
// uitgerekend. Elk paar is een kleur op het vlak waar hij echt staat. Er is een
// palet: de site is altijd donker.

const zonderCommentaar = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const CSS = zonderCommentaar(readFileSync(path.join(__dirname, 'voorpagina.css'), 'utf8'))
const SITE_CSS = zonderCommentaar(readFileSync(path.join(__dirname, '../../../app/(aiyourgym)/(website)/aiyourgym/aiyourgym.css'), 'utf8'))

function blokTokens(css: string): Record<string, string> {
  const start = css.indexOf('.ayg {')
  const blok = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries([...blok.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

const RUW = blokTokens(CSS)
const K = losAllesOp(RUW, blokTokens(SITE_CSS))

const LAGEN = ['vp-diep', 'vp-basis', 'vp-vlak', 'vp-vlak-hoog', 'vp-vlak-top'] as const

const TEKST: readonly [tekst: string, vlak: string][] = [
  ...LAGEN.flatMap((v) => [['vp-wit', v], ['vp-wit-zacht', v], ['vp-iron', v]] as [string, string][]),
  ['vp-iron-tekst', 'vp-iron'],
  ['vp-iron-tekst', 'vp-iron-licht'],
  ['vp-veld-hint', 'vp-basis'],
]

const LIJNEN: readonly [lijn: string, vlak: string][] = [
  ...LAGEN.map((v) => ['vp-iron-lijn', v] as [string, string]),
  ['vp-iron', 'vp-vlak-top'],
]

describe('hoofdstukken in obsidiaan: contrast', () => {
  it('alle gebruikte tokens zijn uit te rekenen tot een kleur', () => {
    for (const k of [...LAGEN, 'vp-wit', 'vp-wit-zacht', 'vp-iron', 'vp-iron-licht', 'vp-iron-tekst', 'vp-iron-lijn', 'vp-veld-hint']) {
      expect(K[k], k).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
  it('elk tekstpaar haalt 4.5:1', () => {
    const teLaag = TEKST.map(([t, v]) => ({ paar: `${t} op ${v}`, c: contrast(K[t], K[v]) })).filter((p) => !(p.c >= 4.5))
    expect(teLaag).toEqual([])
  })
  it('iron lijnen halen 3:1 op elke laag', () => {
    const teLaag = LIJNEN.map(([t, v]) => ({ paar: `${t} op ${v}`, c: contrast(K[t], K[v]) })).filter((p) => !(p.c >= 3))
    expect(teLaag).toEqual([])
  })
  it('de lagen lopen op van diep naar hoog, zodat de hoofdstukken te onderscheiden zijn', () => {
    for (let i = 1; i < LAGEN.length; i++) expect(contrast(K[LAGEN[i]], K[LAGEN[0]])).toBeGreaterThan(contrast(K[LAGEN[i - 1]], K[LAGEN[0]]))
  })
  it('obsidian iron: het accent volgt --iron-accent en is koel metaalgrijs, zonder groen (besluit Kane 29-10-2026)', () => {
    expect(RUW['vp-iron']).toBe('var(--iron-accent)')
    expect(RUW['vp-iron-tekst']).toBe('var(--iron-accent-tekst)')
    for (const k of ['vp-iron', 'vp-iron-licht', 'vp-iron-tekst', 'vp-iron-lijn']) {
      expect(kleurigheid(K[k]), k).toBeLessThanOrEqual(16)
      expect(isGroenig(K[k]), k).toBe(false)
    }
    expect(CSS).not.toMatch(/--vp-(salie|racegroen|groen)/)
  })
  it('geen lichte versie meer: de vlakken in creme, racegroen, flessengroen en salie zijn weg', () => {
    expect(CSS).not.toMatch(/prefers-color-scheme/)
    expect(CSS).not.toMatch(/--vp-(creme|papier|fles|inkt)\b/)
    expect(CSS).not.toMatch(/background:\s*var\(--vp-iron\)\s*;\s*color:\s*var\(--vp-wit\)/)
  })
})
