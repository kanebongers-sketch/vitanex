import { describe, expect, it } from 'vitest'
import { MAX_PER_DAG, overDaglimiet } from './route-hulp'
import { aiFoutSoort } from '@/components/club/voeding/dagboek/api'

// Kostenrem: per lid hoogstens MAX_PER_DAG AI-aanroepen per 24 uur.

describe('daglimiet voedings-AI', () => {
  it('laat er precies MAX_PER_DAG door en weigert de volgende', () => {
    const lid = `test-${Math.random()}`
    const nu = 1_800_000_000_000
    for (let i = 0; i < MAX_PER_DAG; i++) expect(overDaglimiet(lid, nu + i)).toBe(false)
    expect(overDaglimiet(lid, nu + MAX_PER_DAG)).toBe(true)
  })

  it('telt na 24 uur opnieuw', () => {
    const lid = `test-${Math.random()}`
    const nu = 1_800_000_000_000
    for (let i = 0; i < MAX_PER_DAG; i++) overDaglimiet(lid, nu)
    expect(overDaglimiet(lid, nu + 24 * 60 * 60 * 1000)).toBe(false)
  })

  it('is 30 per dag (besluit Kane 29-10-2026)', () => {
    expect(MAX_PER_DAG).toBe(30)
  })
})

describe('foutsoort in de ledenapp', () => {
  it('onderscheidt toestemming, daglimiet en minuutrem', () => {
    expect(aiFoutSoort(403, 'toestemming')).toBe('toestemming')
    expect(aiFoutSoort(429, 'daglimiet')).toBe('daglimiet')
    expect(aiFoutSoort(429, undefined)).toBe('teVaak')
    expect(aiFoutSoort(413, undefined)).toBe('teGroot')
    expect(aiFoutSoort(422, undefined)).toBe('nietHerkend')
    expect(aiFoutSoort(404, undefined)).toBe('nietBeschikbaar')
    expect(aiFoutSoort(500, undefined)).toBe('algemeen')
  })
})
