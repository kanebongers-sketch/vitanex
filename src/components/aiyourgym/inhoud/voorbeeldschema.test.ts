import { describe, expect, it } from 'vitest'
import { oefening3dOpNaam } from '@/lib/club/training/3d'
import { aantalMetCoaching, toonBereik, voorbeeldOefeningen } from './voorbeeldschema'

// Het voorbeeldschema op de website komt uit de echte bibliotheek: elke
// oefening heeft coaching en een eigen 3D-beeld.

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

  it('elke oefening heeft een eigen 3D-beeld', () => {
    for (const o of oefeningen) expect(oefening3dOpNaam(o.naam), o.naam).toBeDefined()
  })

  it('schrijft bereiken met "tot"', () => {
    expect(toonBereik('8-12')).toBe('8 tot 12')
    expect(toonBereik('30-45 sec')).toBe('30 tot 45 sec')
    for (const o of oefeningen) expect(o.voorschrift).not.toMatch(/\d-\d/)
  })

  it('telt de bibliotheek in plaats van te schatten', () => {
    expect(aantalMetCoaching()).toBeGreaterThan(100)
  })
})
