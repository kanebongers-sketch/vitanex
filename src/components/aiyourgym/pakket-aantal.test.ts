// Bewaker: elk aantal pakketten dat de website noemt ("zes losse pakketten",
// "Six separate packages") is het echte aantal in src/lib/aiyourgym/pakketten.ts.
// Aanleiding: het menu zei "Drie pakketten" terwijl er zes zijn (31-10-2026).

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PAKKETTEN } from '@/lib/aiyourgym/pakketten'

const MAPPEN = ['src/components/aiyourgym', 'src/lib/aiyourgym/taal/woorden/website', 'src/app/(aiyourgym)/(website)']

const GETALLEN: Readonly<Record<string, number>> = {
  een: 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, zeven: 7, acht: 8, negen: 9, tien: 10,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}

// Een getal (woord of cijfers), eventueel "losse"/"separate", dan pakketten/packages/plans.
const PATROON = /\b(een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:losse\s+|separate\s+)?(pakketten|packages|plans)\b/gi

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam)
    if (statSync(pad).isDirectory()) return bestanden(pad)
    return /\.(ts|tsx)$/.test(naam) && !/\.test\.tsx?$/.test(naam) ? [pad] : []
  })
}

describe('aantal pakketten in de teksten van de website', () => {
  const treffers = MAPPEN.flatMap(bestanden).flatMap((pad) =>
    [...readFileSync(pad, 'utf8').matchAll(PATROON)].map((m) => ({ pad, zin: m[0], aantal: GETALLEN[m[1].toLowerCase()] ?? Number(m[1]) })),
  )

  it('vindt de zinnen die het aantal noemen (de test kijkt echt)', () => {
    expect(treffers.length).toBeGreaterThan(0)
  })

  it('noemt overal het echte aantal pakketten', () => {
    const fout = treffers.filter((t) => t.aantal !== PAKKETTEN.length).map((t) => `${t.pad}: "${t.zin}"`)
    expect(fout).toEqual([])
  })
})
