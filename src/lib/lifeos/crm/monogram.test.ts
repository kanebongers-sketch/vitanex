import { describe, expect, it } from 'vitest'
import { initialen } from './monogram'

describe('initialen', () => {
  it('neemt de eerste + laatste woord-initiaal bij meerdere woorden', () => {
    expect(initialen('Kane Bongers')).toBe('KB')
    expect(initialen('jan de vries')).toBe('JV')
  })

  it('neemt de eerste twee letters bij één woord', () => {
    expect(initialen('Henri')).toBe('HE')
    expect(initialen('lisa')).toBe('LI')
  })

  it('geeft één letter terug bij een woord van één teken', () => {
    expect(initialen('X')).toBe('X')
  })

  it('valt terug op "?" bij een lege of witruimte-naam', () => {
    expect(initialen('')).toBe('?')
    expect(initialen('   ')).toBe('?')
  })

  it('negeert extra witruimte tussen woorden', () => {
    expect(initialen('  Kane   Bongers  ')).toBe('KB')
  })

  it('is altijd hoofdletters', () => {
    expect(initialen('nico jansen')).toBe('NJ')
  })
})
