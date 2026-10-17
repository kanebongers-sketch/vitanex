import { describe, expect, it } from 'vitest'
import { doelgroepTekst } from './weergave'

const VESTIGINGEN = [
  { sleutel: 'budel', naam: 'Budel', standaard: true },
  { sleutel: 'eersel', naam: 'Eersel', standaard: false },
]

describe('doelgroepTekst', () => {
  it('noemt alle leden van alle vestigingen', () => {
    expect(doelgroepTekst({ vestigingen: [], statussen: [], tag: null }, VESTIGINGEN)).toBe('Alle leden van alle vestigingen')
  })

  it('noemt statussen, vestigingen en tag', () => {
    // Arrange
    const b = { vestigingen: ['budel', 'eersel'], statussen: ['proef' as const, 'actief' as const], tag: 'Ochtend' }
    // Act + Assert
    expect(doelgroepTekst(b, VESTIGINGEN)).toBe('Proefleden en actieve leden in Budel en Eersel met tag Ochtend')
  })
})
