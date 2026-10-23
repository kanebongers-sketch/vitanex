// Lintregel als test: in de nieuwe geldcode deelt niemand door 100 behalve
// cent.ts. Wie euro's wil tonen, gebruikt formatEuro; wie een procent wil,
// gebruikt maalBreuk. (Een ESLint-regel zou eslint.config.mjs raken; deze test
// doet hetzelfde voor alleen deze mappen.)
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const BETALEN = path.resolve(__dirname, '..')
const MAPPEN = ['geld', 'contract', 'factuur', 'incasso']
// datum.ts rekent met eeuwen (jaar / 100 voor schrikkeljaren), niet met geld.
const TOEGESTAAN = new Set([path.join(BETALEN, 'geld', 'cent.ts'), path.join(BETALEN, 'contract', 'datum.ts')])
const DELING_DOOR_100 = /\/\s*100(?![0-9])/

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const vol = path.join(map, naam)
    if (statSync(vol).isDirectory()) return bestanden(vol)
    return vol.endsWith('.ts') && !vol.endsWith('.test.ts') ? [vol] : []
  })
}

describe('lintregel geld', () => {
  it('geen deling door 100 buiten cent.ts', () => {
    const fout = MAPPEN.flatMap((m) => bestanden(path.join(BETALEN, m)))
      .filter((b) => !TOEGESTAAN.has(b))
      .flatMap((b) =>
        readFileSync(b, 'utf8')
          .split('\n')
          .map((regel, i) => ({ regel, i }))
          .filter(({ regel }) => !regel.trim().startsWith('//') && DELING_DOOR_100.test(regel))
          .map(({ i }) => `${path.relative(BETALEN, b)}:${i + 1}`),
      )
    expect(fout).toEqual([])
  })
})
