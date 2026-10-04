import { describe, expect, test } from 'vitest'
import { isLifeosBlok } from './titels'
import { BOUW_TITEL } from './plan'

describe('isLifeosBlok', () => {
  test('herkent de titels die LifeOS zelf schrijft', () => {
    expect(isLifeosBlok(BOUW_TITEL)).toBe(true)
    expect(isLifeosBlok('Taak: Offerte maken')).toBe(true)
    expect(isLifeosBlok('Mail afhandelen (3)')).toBe(true)
  })
  test('gewone afspraken niet', () => {
    expect(isLifeosBlok('Darren PT')).toBe(false)
    expect(isLifeosBlok('Taakverdeling team')).toBe(false)
    expect(isLifeosBlok(null)).toBe(false)
  })
})
