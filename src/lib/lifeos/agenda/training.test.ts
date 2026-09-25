import { describe, expect, test } from 'vitest'
import { isEigenTraining } from './training'

describe('isEigenTraining', () => {
  test('eigen trainingen', () => {
    for (const t of ['Rick gym', 'Gymmen Bas', 'Sporten (incl. reistijd)', 'Training benen', 'Hardlopen', 'Crossfit'])
      expect(isEigenTraining(t)).toBe(true)
  })
  test('een PT-sessie met een klant is níet jouw training', () => {
    for (const t of ['Joris - Personal training', 'Joris - Personal Training Bergeijk', 'Kevin PT', 'PT Elize Budel', 'Personaltraining Sanne'])
      expect(isEigenTraining(t)).toBe(false)
  })
  test('gewone afspraken en leeg', () => {
    for (const t of ['Werken in Budel', 'Wandelen', 'Oktoberfest', '']) expect(isEigenTraining(t)).toBe(false)
    expect(isEigenTraining(null)).toBe(false)
  })
})
