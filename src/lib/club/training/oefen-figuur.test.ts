import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { figuurVanSportschool } from './oefen-figuur'

// Besluit Kane (06-11-2026): Fit Factory ziet het figuur kane, elke andere sportschool neutraal.

describe('figuurVanSportschool', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('Fit Factory krijgt kane, elke andere sportschool neutraal', () => {
    expect(figuurVanSportschool('ff-id', 'ff-id')).toBe('kane')
    expect(figuurVanSportschool('andere-id', 'ff-id')).toBe('neutraal')
  })

  it('leest het id van Fit Factory uit de omgeving', () => {
    vi.stubEnv('LIFEOS_USER_ID', 'ff-id')
    expect(figuurVanSportschool('ff-id')).toBe('kane')
    expect(figuurVanSportschool('de000000-0000-4000-8000-0000000000c1')).toBe('neutraal')
  })

  it('zonder id in de omgeving altijd neutraal, ook bij een leeg id', () => {
    vi.stubEnv('LIFEOS_USER_ID', '')
    expect(figuurVanSportschool('')).toBe('neutraal')
    expect(figuurVanSportschool('ff-id', undefined)).toBe('neutraal')
  })
})

const WORTEL = process.cwd()
const lees = (...pad: string[]) => readFileSync(join(WORTEL, ...pad), 'utf8')

function tsxIn(map: string): string[] {
  return readdirSync(map).flatMap((n) => {
    const pad = join(map, n)
    if (statSync(pad).isDirectory()) return tsxIn(pad)
    return n.endsWith('.tsx') ? [pad] : []
  })
}

describe('de keuze komt uit de sportschool', () => {
  it('Club leest het id van de geopende sportschool, de ledenapp dat van de sessie van het lid', () => {
    expect(lees('src/app/(aiyourgym)/(club)/club/layout.tsx')).toMatch(/figuurVanSportschool\(org\.id\)/)
    expect(lees('src/app/(aiyourgym)/(club)/mijn/page.tsx')).toMatch(/figuurVanSportschool\(userId\)/)
  })

  it('geen component kiest zelf een figuur: alleen useRepRender roept repRenderVoor aan', () => {
    const buiten = ['src/components', 'src/app']
      .flatMap((m) => tsxIn(join(WORTEL, m)))
      .filter((f) => !f.endsWith('oefen-figuur.tsx') && /\brepRenderVoor\(/.test(readFileSync(f, 'utf8')))
    expect(buiten).toEqual([])
  })

  it('de openbare website gebruikt de neutrale lijst', () => {
    const scherm = lees('src/components/aiyourgym/mockups/product/SchemaScherm.tsx')
    expect(scherm).toContain('OEFENRENDERS_NEUTRAAL')
    expect(scherm).not.toMatch(/\bOEFENRENDERS\b/)
  })
})
