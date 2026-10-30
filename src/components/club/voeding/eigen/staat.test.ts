import { describe, expect, it } from 'vitest'
import { aantalVan, macrosGeldig, reken, startConcept, verzoekVan, type Indelingen } from './staat'

const namen: Indelingen = { 3: ['O', 'L', 'A'], 4: ['O', 'L', 'T', 'A'], 5: ['1', '2', '3', '4', '5'], 6: ['1', '2', '3', '4', '5', '6'] }

describe('eigen plan: stappen', () => {
  it('begint zonder plan met vier momenten en een redelijk dagdoel', () => {
    const c = startConcept(null, namen)
    expect(c.aantal).toBe(4)
    expect(c.maaltijden).toHaveLength(4)
    expect(c.bewaar).toBe(false)
    expect(macrosGeldig(c)).toBe(true)
  })

  it('rekent met de invoer en meldt wat mist', () => {
    const leeg = startConcept(null, namen)
    expect(reken(leeg, 'nl').ok).toBe(false)
    const vol = { ...leeg, doel: 'afvallen' as const, over: { gewicht: '70,5', lengte: '168', leeftijd: '41', geslacht: 'vrouw' as const, activiteit: 'licht' as const } }
    const r = reken(vol, 'nl')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.concept.berekening?.gewichtKg).toBe(70.5)
      expect(r.concept.verbruik?.rust).toBeGreaterThan(1200)
      expect(Number(r.concept.eiwit)).toBe(Math.round(70.5 * 1.8))
    }
  })

  it('stuurt de lichaamsgegevens alleen mee met het vinkje', () => {
    const basis = startConcept(null, namen)
    const r = reken({ ...basis, doel: 'onderhoud', over: { gewicht: '80', lengte: '180', leeftijd: '30', geslacht: 'man', activiteit: 'matig' } }, 'nl')
    if (!r.ok) throw new Error('rekenen mislukt')
    expect(verzoekVan(r.concept).plan.berekening).toBe(null)
    expect(verzoekVan(r.concept).bewaarGegevens).toBe(false)
    const met = verzoekVan({ ...r.concept, bewaar: true })
    expect(met.bewaarGegevens).toBe(true)
    expect(met.plan.berekening).not.toBe(null)
  })

  it('kiest het dichtstbijzijnde aantal momenten', () => {
    expect(aantalVan([])).toBe(4)
    expect(aantalVan(Array.from({ length: 8 }, () => ({ naam: 'x', tijd: null, voorbeelden: '' })))).toBe(6)
    expect(aantalVan([{ naam: 'x', tijd: null, voorbeelden: '' }])).toBe(3)
  })

  it('weigert een onzinnig dagdoel', () => {
    expect(macrosGeldig({ ...startConcept(null, namen), kcal: '300' })).toBe(false)
    expect(macrosGeldig({ ...startConcept(null, namen), eiwit: 'abc' })).toBe(false)
  })
})
