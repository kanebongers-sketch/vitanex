import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Een nieuwe sportschool loopt de startwizard, het inlezen van leden en het
// uitnodigen van het team zelf door. Wat daar op het scherm staat mag niet
// verwijzen naar de oude inlog (pincode, controlecode), naar het platform
// (Kane, testomgeving, presentatie) of naar Fit Factory en zijn vestigingen.
// We kijken naar de code zonder commentaar.

const MAPPEN = ['src/components/club/start', 'src/lib/club/start', 'src/components/club/leden/import', 'src/lib/club/leden/import']
const LOSSE = [
  'src/app/(aiyourgym)/(club)/club/start/page.tsx',
  'src/app/(aiyourgym)/(club)/club/leden/importeren/page.tsx',
  'src/components/club/instellingen/MedewerkerLogin.tsx',
  'src/lib/club/kern/instel-paginas.ts',
]
const VERBODEN = /pincode|controlecode|\bKane\b|Fit Factory|Budel|Eersel|presentatie|testomgeving/i
// Bestaande medewerkers van voor 23-10-2026 zien eerlijk dat ze nog met een pincode inloggen.
const UITZONDERING = /Nog met pincode|oude link en pincode/

function zonderCommentaar(bron: string): string[] {
  return bron
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((r) => r.replace(/(^|\s)\/\/.*$/, ''))
}

function bestanden(): string[] {
  const uitMappen = MAPPEN.flatMap((m) => readdirSync(m).filter((f) => /\.tsx?$/.test(f) && !f.includes('.test.')).map((f) => join(m, f)))
  return [...uitMappen, ...LOSSE]
}

describe('teksten voor een nieuwe sportschool', () => {
  it('verwijzen niet naar pincodes, het platform of Fit Factory', () => {
    const fout = bestanden().flatMap((pad) =>
      zonderCommentaar(readFileSync(pad, 'utf8'))
        .map((regel, i) => ({ regel, i }))
        .filter(({ regel }) => VERBODEN.test(regel) && !UITZONDERING.test(regel) && !/LOGO_FIT_FACTORY|FitFactory/.test(regel))
        .map(({ regel, i }) => `${pad}:${i + 1}: ${regel.trim()}`),
    )
    expect(fout).toEqual([])
  })
})
