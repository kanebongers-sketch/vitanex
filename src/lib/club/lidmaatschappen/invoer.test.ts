import { describe, expect, it } from 'vitest'
import { leesLabel, leesTagsOok, leesVorm } from './invoer'
import { labelUitRij, sorteerVormen, vormSleutel, vormUitRij } from './model'

const EIGEN = [{ sleutel: 'centrum' }, { sleutel: 'noord' }]

describe('leesVorm', () => {
  it('leest een volledige vorm', () => {
    // Arrange
    const body = { naam: '  Dal-uren ', omschrijving: 'Overdag', vestigingen: ['noord'], groepslessen: true, maxLessenPerWeek: '2', dalVan: '09:00', dalTot: '16:00', dalWeekendVrij: true, kleur: 'groen', actief: true }
    // Act
    const uit = leesVorm(body, EIGEN)
    // Assert
    expect(uit).toEqual({
      ok: true,
      waarde: { naam: 'Dal-uren', omschrijving: 'Overdag', vestigingen: ['noord'], groepslessen: true, maxLessenPerWeek: 2, dalVan: '09:00', dalTot: '16:00', dalWeekendVrij: true, kleur: 'groen', actief: true },
    })
  })

  it('maakt van alle vestigingen aangevinkt: alle', () => {
    const uit = leesVorm({ naam: 'X', vestigingen: ['noord', 'centrum'] }, EIGEN)
    expect(uit.ok && uit.waarde.vestigingen).toBeNull()
  })

  it('weigert een vestiging van een andere sportschool', () => {
    expect(leesVorm({ naam: 'X', vestigingen: ['budel'] }, EIGEN)).toMatchObject({ ok: false })
  })

  it('weigert een lege naam, een fout maximum en verkeerde daluren', () => {
    expect(leesVorm({ naam: ' ' }, EIGEN).ok).toBe(false)
    expect(leesVorm({ naam: 'X', maxLessenPerWeek: 0 }, EIGEN).ok).toBe(false)
    expect(leesVorm({ naam: 'X', maxLessenPerWeek: 2.5 }, EIGEN).ok).toBe(false)
    expect(leesVorm({ naam: 'X', dalVan: '16:00', dalTot: '09:00' }, EIGEN).ok).toBe(false)
    expect(leesVorm({ naam: 'X', dalVan: '09:00' }, EIGEN).ok).toBe(false)
    expect(leesVorm({ naam: 'X', kleur: 'paars' }, EIGEN).ok).toBe(false)
  })

  it('negeert het maximum zonder groepslessen', () => {
    const uit = leesVorm({ naam: 'X', groepslessen: false, maxLessenPerWeek: 99 }, EIGEN)
    expect(uit.ok && uit.waarde.maxLessenPerWeek).toBeNull()
  })
})

describe('leesLabel', () => {
  it('normaliseert de naam zoals een tag', () => {
    expect(leesLabel({ naam: 'PT Interesse ', kleur: 'amber' })).toEqual({ ok: true, waarde: { naam: 'pt-interesse', omschrijving: '', kleur: 'amber' } })
  })

  it('weigert een naam zonder letters', () => {
    expect(leesLabel({ naam: '!!!' }).ok).toBe(false)
    expect(leesLabel({}).ok).toBe(false)
  })

  it('leest tagsOok alleen als echte true', () => {
    expect(leesTagsOok({ tagsOok: true })).toBe(true)
    expect(leesTagsOok({ tagsOok: 'ja' })).toBe(false)
    expect(leesTagsOok(undefined)).toBe(false)
  })
})

describe('model', () => {
  it('leest een databaserij en ruimt halve daluren op', () => {
    const v = vormUitRij({ id: 'a', naam: 'X', vestigingen: [], groepslessen: false, max_lessen_per_week: 3, daluren_van: '09:00:00', daluren_tot: null, kleur: 'onzin', actief: false })
    expect(v).toMatchObject({ vestigingen: null, groepslessen: false, maxLessenPerWeek: 3, dalVan: null, dalTot: null, kleur: 'amber', actief: false })
    expect(vormUitRij({ id: 'a' })).toBeNull()
    expect(labelUitRij({ id: 'b', naam: 'nieuw' })).toMatchObject({ kleur: 'blauw', omschrijving: '' })
  })

  it('zet actieve vormen eerst en sorteert op naam', () => {
    const basis = vormUitRij({ id: 'x', naam: 'x' })
    if (!basis) throw new Error('rij')
    const lijst = sorteerVormen([
      { ...basis, naam: 'Zomer', actief: false },
      { ...basis, naam: 'Student' },
      { ...basis, naam: 'Dal-uren' },
    ])
    expect(lijst.map((v) => v.naam)).toEqual(['Dal-uren', 'Student', 'Zomer'])
    expect(vormSleutel('  A  B ')).toBe('a b')
  })
})
