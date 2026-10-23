import { describe, expect, it } from 'vitest'
import { NEUTRALE_LES, voorbeeldLes } from './soorten'

describe('de les in het voorbeeld van de ledenapp', () => {
  it('kiest een eigen lestype dat bij de soort past', () => {
    expect(voorbeeldLes(['Boksen', 'Small group training'], 'pt')).toBe('Small group training')
  })

  it('kiest anders het eerste eigen lestype', () => {
    expect(voorbeeldLes(['Ochtendkracht'], 'pt')).toBe('Ochtendkracht')
  })

  it('kiest zonder eigen lestypen de eerste les van de soort, nooit Spinning bij een PT-studio', () => {
    expect(voorbeeldLes([], 'pt')).toBe('Small group training')
    expect(voorbeeldLes([], 'yoga')).toBe('Yoga')
  })

  it('valt terug op een neutrale les', () => {
    expect(voorbeeldLes([], null)).toBe(NEUTRALE_LES)
    expect(voorbeeldLes(['  '], null)).toBe(NEUTRALE_LES)
  })
})
