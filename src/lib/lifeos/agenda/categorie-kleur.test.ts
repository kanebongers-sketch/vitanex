import { describe, expect, test } from 'vitest'
import { bepaalKleur, CATEGORIE_KLEUR } from './categorie-kleur'

describe('bepaalKleur', () => {
  test('PT-klant rood, PT-team groen', () => {
    expect(bepaalKleur('pt_klant', null, null)).toBe('11')
    expect(bepaalKleur('pt_team', null, null)).toBe('10')
  })

  test('al de juiste kleur → niets doen', () => {
    expect(bepaalKleur('pt_klant', '11', null)).toBeNull()
  })

  test('een kleur die jij zelf koos blijft staan', () => {
    expect(bepaalKleur('pt_klant', '5', null)).toBeNull()
    expect(bepaalKleur('pt_klant', '5', '10')).toBeNull()
  })

  test('categorie veranderd en de kleur was van LifeOS → bijwerken', () => {
    // Was PT-team (groen, door LifeOS gezet), is nu PT-klant → rood.
    expect(bepaalKleur('pt_klant', '10', '10')).toBe('11')
  })

  test('Overig krijgt geen kleur', () => {
    expect(bepaalKleur('overig', null, null)).toBeNull()
    expect(CATEGORIE_KLEUR.overig).toBeNull()
  })

  test('elke categorie een eigen kleur', () => {
    const kleuren = Object.values(CATEGORIE_KLEUR).filter((k) => k !== null)
    expect(new Set(kleuren).size).toBe(kleuren.length)
  })
})
