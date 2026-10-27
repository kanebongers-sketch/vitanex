import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Een render die een vak vult (telefoon, held, coaching) moet absolute en inset 0
// krijgen. Anders heeft .ayg-lus met container-type: size en aspect-ratio auto
// geen hoogte, wordt .ayg-lus-vlak min(100cqw, 0) en is het beeld 0 bij 0
// (fout live op /trainingsschemas, 27-10-2026). Deze test rekent de cascade na
// voor de klassen die op het element staan, met de echte regels uit mockups.css.

const CSS = readFileSync(join(__dirname, 'mockups.css'), 'utf8')

interface Regel {
  klassen: string[]
  stijl: Record<string, string>
  volgorde: number
}

/** Alle regels op het hoogste niveau (niet in @media of @supports) die alleen uit klassen bestaan. */
function regels(css: string): Regel[] {
  const zonderCommentaar = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const uit: Regel[] = []
  const patroon = /^([^\s@{}][^{}]*)\{([^{}]*)\}/gm
  let m: RegExpExecArray | null
  let volgorde = 0
  while ((m = patroon.exec(zonderCommentaar))) {
    const stijl: Record<string, string> = {}
    for (const deel of m[2].split(';')) {
      const i = deel.indexOf(':')
      if (i > 0) stijl[deel.slice(0, i).trim()] = deel.slice(i + 1).trim()
    }
    for (const selector of m[1].split(',').map((s) => s.trim())) {
      if (!/^(\.[\w-]+)+$/.test(selector)) continue
      uit.push({ klassen: selector.slice(1).split('.'), stijl, volgorde: volgorde++ })
    }
  }
  return uit
}

/** De waarde die wint voor een element met precies deze klassen: meeste klassen, dan de laatste. */
function berekend(klassen: string[], eigenschap: string): string | undefined {
  const passend = regels(CSS)
    .filter((r) => r.klassen.every((k) => klassen.includes(k)) && eigenschap in r.stijl)
    .sort((a, b) => a.klassen.length - b.klassen.length || a.volgorde - b.volgorde)
  return passend.at(-1)?.stijl[eigenschap]
}

describe('OefenLus vullend in een vak (.ayg-lus.ayg-3d--vul)', () => {
  const vul = ['ayg-lus', 'ayg-3d--vul']

  it('staat absolute, zodat het de maat van het vak krijgt', () => {
    expect(berekend(vul, 'position')).toBe('absolute')
  })

  it('vult het vak helemaal (inset 0)', () => {
    expect(berekend(vul, 'inset')).toBe('0')
  })

  it('heeft geen eigen verhouding, die komt van het vak', () => {
    expect(berekend(vul, 'aspect-ratio')).toBe('auto')
  })

  it('een losse OefenLus houdt een eigen vierkant vak (relative, verhouding 1)', () => {
    expect(berekend(['ayg-lus'], 'position')).toBe('relative')
    expect(berekend(['ayg-lus'], 'aspect-ratio')).toBe('1')
  })
})
