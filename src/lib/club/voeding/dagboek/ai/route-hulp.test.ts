import { describe, expect, it } from 'vitest'
import { AI_DAG_REM, AI_MINUUT_REM, MAX_PER_DAG, overDaglimiet } from './route-hulp'
import { nepRemTik } from '@/lib/club/kern/rem-db'
import { aiFoutSoort } from '@/components/club/voeding/dagboek/api'

// Kostenrem: per lid hoogstens MAX_PER_DAG AI-aanroepen per 24 uur, geteld in de database.

describe('daglimiet voedings-AI', () => {
  it('laat er precies MAX_PER_DAG door en weigert de volgende', async () => {
    let nu = 1_800_000_000_000
    const tik = nepRemTik(() => nu)
    for (let i = 0; i < MAX_PER_DAG; i++) {
      expect(await overDaglimiet('lid-1', { tik })).toBe(false)
      nu += 1
    }
    expect(await overDaglimiet('lid-1', { tik })).toBe(true)
    expect(await overDaglimiet('lid-2', { tik })).toBe(false)
  })

  it('telt na 24 uur opnieuw', async () => {
    let nu = 1_800_000_000_000
    const tik = nepRemTik(() => nu)
    for (let i = 0; i < MAX_PER_DAG; i++) await overDaglimiet('lid-1', { tik })
    nu += 24 * 60 * 60 * 1000
    expect(await overDaglimiet('lid-1', { tik })).toBe(false)
  })

  it('gaat dicht als de database wegvalt (geen kosten zonder plafond)', async () => {
    const weg = async () => null
    const kapot = async (): Promise<boolean | null> => { throw new Error('netwerk') }
    expect(await overDaglimiet('lid-1', { tik: weg, geheugen: () => false })).toBe(true)
    expect(await overDaglimiet('lid-1', { tik: kapot, geheugen: () => false })).toBe(true)
  })

  it('is 30 per dag (besluit Kane 29-10-2026) en 6 per minuut, beide fail-closed', () => {
    expect(MAX_PER_DAG).toBe(30)
    expect(AI_DAG_REM.max).toBe(30)
    expect(AI_MINUUT_REM.max).toBe(6)
    expect(AI_DAG_REM.bijStoring).toBe('dicht')
    expect(AI_MINUUT_REM.bijStoring).toBe('dicht')
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
