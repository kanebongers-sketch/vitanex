import { describe, expect, it } from 'vitest'
import { BEWEGINGSPATROON_LABEL, BEWEGINGSPATRONEN, bewegingspatroonVan, kenmerkenVan, type MetKenmerken } from './oefening-kenmerken'
import { PATRONEN } from './typen'

function oefening(o: Partial<MetKenmerken>): MetKenmerken {
  return { patroon: 'squat', spierenPrimair: [], spiergroep: 'benen', materiaal: 'barbell', ...o }
}

describe('bewegingspatroon van een oefening', () => {
  it('neemt de grote patronen een op een over', () => {
    expect(bewegingspatroonVan(oefening({ patroon: 'squat' }))).toBe('squat')
    expect(bewegingspatroonVan(oefening({ patroon: 'heupscharnier' }))).toBe('hinge')
    expect(bewegingspatroonVan(oefening({ patroon: 'lunge' }))).toBe('lunge')
    expect(bewegingspatroonVan(oefening({ patroon: 'duwen_horizontaal', spiergroep: 'borst' }))).toBe('duwen_horizontaal')
    expect(bewegingspatroonVan(oefening({ patroon: 'duwen_verticaal', spiergroep: 'schouders' }))).toBe('duwen_verticaal')
    expect(bewegingspatroonVan(oefening({ patroon: 'trekken_horizontaal', spiergroep: 'rug' }))).toBe('trekken_horizontaal')
    expect(bewegingspatroonVan(oefening({ patroon: 'trekken_verticaal', spiergroep: 'rug' }))).toBe('trekken_verticaal')
    expect(bewegingspatroonVan(oefening({ patroon: 'core', spiergroep: 'buik' }))).toBe('core')
  })

  it('herkent dragen aan de naam', () => {
    expect(bewegingspatroonVan(oefening({ patroon: 'core', spiergroep: 'hele_lichaam', naam: 'Farmer walk' }))).toBe('carry')
    expect(bewegingspatroonVan(oefening({ patroon: 'core', spiergroep: 'buik', naam: 'Suitcase carry' }))).toBe('carry')
    expect(bewegingspatroonVan(oefening({ patroon: 'core', spiergroep: 'buik', naam: 'Plank' }))).toBe('core')
  })

  it('zet isolatie, cardio, losse sprongen en onbekend op overig', () => {
    expect(bewegingspatroonVan(oefening({ patroon: 'isolatie', spiergroep: 'biceps' }))).toBe('overig')
    expect(bewegingspatroonVan(oefening({ patroon: 'cardio', spiergroep: 'cardio' }))).toBe('overig')
    expect(bewegingspatroonVan(oefening({ patroon: 'explosief', spiergroep: 'hele_lichaam', naam: 'Burpee' }))).toBe('overig')
    expect(bewegingspatroonVan(oefening({ patroon: null }))).toBe('overig')
  })

  it('ziet een sprong met de benen als squat', () => {
    expect(bewegingspatroonVan(oefening({ patroon: 'explosief', spiergroep: 'benen', naam: 'Box jump' }))).toBe('squat')
  })

  it('geeft voor elk patroon uit de database een geldig bewegingspatroon met label', () => {
    for (const patroon of PATRONEN) {
      const b = bewegingspatroonVan(oefening({ patroon }))
      expect(BEWEGINGSPATRONEN).toContain(b)
      expect(BEWEGINGSPATROON_LABEL[b].length).toBeGreaterThan(2)
    }
  })
})

describe('kenmerken van een oefening', () => {
  it('geeft patroon, bewegingspatroon, spiergroep, spieren en materiaal', () => {
    const k = kenmerkenVan(oefening({ patroon: 'heupscharnier', spierenPrimair: ['bilspieren', 'hamstrings'], materiaal: 'kettlebell' }))
    expect(k).toEqual({
      patroon: 'heupscharnier',
      bewegingspatroon: 'hinge',
      spiergroep: 'benen',
      primaireSpier: 'bilspieren',
      hoofdspieren: ['bilspieren', 'hamstrings'],
      materiaal: 'kettlebell',
    })
  })

  it('schat de spieren uit de spiergroep als ze ontbreken', () => {
    const k = kenmerkenVan(oefening({ spierenPrimair: [], spiergroep: 'borst', patroon: 'duwen_horizontaal' }))
    expect(k.primaireSpier).not.toBeNull()
    expect(k.hoofdspieren.length).toBeGreaterThan(0)
  })
})
