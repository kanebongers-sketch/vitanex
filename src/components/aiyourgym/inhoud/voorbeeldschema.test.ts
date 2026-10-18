import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { aantalMetBeeld, aantalMetCoaching, toonBereik, voorbeeldOefeningen } from './voorbeeldschema'

// Het voorbeeldschema op de website komt uit de echte bibliotheek: elke
// oefening heeft coaching en een RepDB-beeld dat echt in /public staat.

const PUBLIC = path.resolve(__dirname, '../../../../public')

describe('voorbeeldschema', () => {
  const oefeningen = voorbeeldOefeningen()

  it('vier oefeningen, allemaal met coaching uit de bibliotheek', () => {
    expect(oefeningen).toHaveLength(4)
    for (const o of oefeningen) {
      expect(o.coaching.kernpunten.length).toBeGreaterThanOrEqual(3)
      expect(o.coaching.kernpunten.length).toBeLessThanOrEqual(5)
      expect(o.coaching.fouten.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('elk beeld bestaat in public', () => {
    for (const o of oefeningen) {
      expect(existsSync(path.join(PUBLIC, o.beeldStart)), o.beeldStart).toBe(true)
      expect(existsSync(path.join(PUBLIC, o.beeldEind)), o.beeldEind).toBe(true)
    }
  })

  it('schrijft bereiken met "tot"', () => {
    expect(toonBereik('8-12')).toBe('8 tot 12')
    expect(toonBereik('30-45 sec')).toBe('30 tot 45 sec')
    for (const o of oefeningen) expect(o.voorschrift).not.toMatch(/\d-\d/)
  })

  it('telt de bibliotheek in plaats van te schatten', () => {
    expect(aantalMetCoaching()).toBeGreaterThan(100)
    expect(aantalMetBeeld()).toBeGreaterThan(100)
  })
})
