// Bewaker van het verhaal op de website: basis met add-ons (besluit Kane
// 31-10-2026, vervangt "zes losse pakketten"). Elk aantal dat de website noemt
// ("vijf add-ons", "Five add-ons") is het echte aantal in
// src/lib/aiyourgym/pakketten.ts, en het oude verhaal (losse pakketten die elk
// op zichzelf werken, "alleen Groepslessen") staat nergens meer.
// Aanleiding: het menu zei "Drie pakketten" terwijl er zes zijn (31-10-2026).

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ADD_ONS, PAKKETTEN } from '@/lib/aiyourgym/pakketten'
import { PAKKET_NAMEN } from '@/lib/aiyourgym/taal/woorden/algemeen/pakketten'
import { PRIJZEN } from '@/lib/aiyourgym/taal/woorden/website/prijzen'

const MAPPEN = ['src/components/aiyourgym', 'src/lib/aiyourgym/taal/woorden/website', 'src/app/(aiyourgym)/(website)']

const GETALLEN: Readonly<Record<string, number>> = {
  een: 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, zeven: 7, acht: 8, negen: 9, tien: 10,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
}

// Een getal (woord of cijfers), eventueel "losse"/"separate", dan pakketten/packages/plans of add-ons.
const PATROON = /\b(een|twee|drie|vier|vijf|zes|zeven|acht|negen|tien|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:losse\s+|separate\s+)?(pakketten|packages|plans|add-ons)\b/gi

// Het oude verhaal (elk pakket los, besluit Kane 29-10-2026) mag niet terugkomen.
const OUD = [/losse pakketten/i, /separate packages/i, /op zichzelf/i, /works? on (?:its|their) own/i, /alleen groepslessen/i, /only group classes/i, /alleen ledenadministratie/i, /only membership administration/i, /uitbreiding/i]

function bestanden(map: string): string[] {
  return readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam)
    if (statSync(pad).isDirectory()) return bestanden(pad)
    return /\.(ts|tsx)$/.test(naam) && !/\.test\.tsx?$/.test(naam) ? [pad] : []
  })
}

/** Alleen de teksten, zonder regels met commentaar (daar mag de geschiedenis staan). */
function zonderCommentaar(tekst: string): string {
  return tekst
    .split('\n')
    .filter((r) => !/^\s*(\/\/|\*|\/\*)/.test(r))
    .join('\n')
}

const TEKSTEN = MAPPEN.flatMap(bestanden).map((pad) => ({ pad, tekst: zonderCommentaar(readFileSync(pad, 'utf8')) }))

describe('basis met add-ons in de teksten van de website', () => {
  const treffers = TEKSTEN.flatMap(({ pad, tekst }) =>
    [...tekst.matchAll(PATROON)].map((m) => ({ pad, zin: m[0], soort: m[2].toLowerCase(), aantal: GETALLEN[m[1].toLowerCase()] ?? Number(m[1]) })),
  )

  it('vindt de zinnen die het aantal add-ons noemen (de test kijkt echt)', () => {
    expect(treffers.filter((t) => t.soort === 'add-ons').length).toBeGreaterThan(0)
  })

  it('noemt overal het echte aantal: add-ons is het aantal add-ons, pakketten het totaal', () => {
    const fout = treffers
      .filter((t) => t.aantal !== (t.soort === 'add-ons' ? ADD_ONS.length : PAKKETTEN.length))
      .map((t) => `${t.pad}: "${t.zin}"`)
    expect(fout).toEqual([])
  })

  it('het oude verhaal van losse pakketten staat nergens meer', () => {
    const fout = TEKSTEN.flatMap(({ pad, tekst }) => OUD.filter((r) => r.test(tekst)).map((r) => `${pad}: ${r}`))
    expect(fout).toEqual([])
  })

  it('de prijzenpagina vertelt het nieuwe verhaal in beide talen', () => {
    expect(PRIJZEN.nl.tekst).toMatch(/basis/i)
    expect(PRIJZEN.nl.tekst).toMatch(/add-ons/)
    expect(PRIJZEN.en.tekst).toMatch(/core/i)
    expect(PRIJZEN.en.tekst).toMatch(/add-ons/)
  })
})

describe('de basis in het model', () => {
  it('precies een basis (Ledenadministratie) en vijf add-ons', () => {
    expect(PAKKETTEN.filter((p) => p.basis === true).map((p) => p.sleutel)).toEqual(['administratie'])
    expect(ADD_ONS).toHaveLength(PAKKETTEN.length - 1)
    expect(ADD_ONS).not.toContain('administratie')
    expect(PAKKET_NAMEN.nl.basisNaam).toBe('Basis | Ledenadministratie')
    expect(PAKKET_NAMEN.en.basisNaam).toMatch(/^Core \| /)
  })
})
