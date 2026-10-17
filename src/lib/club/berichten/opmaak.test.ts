import { describe, expect, it } from 'vitest'
import { blokken, voorproef } from './opmaak'

describe('blokken', () => {
  it('maakt alinea\'s en opsommingen', () => {
    // Arrange
    const tekst = 'Eerste regel\nzelfde alinea\n\n- punt een\n- punt twee\n\nSlot'
    // Act
    const uit = blokken(tekst)
    // Assert
    expect(uit).toEqual([
      { soort: 'alinea', regels: ['Eerste regel', 'zelfde alinea'] },
      { soort: 'lijst', punten: ['punt een', 'punt twee'] },
      { soort: 'alinea', regels: ['Slot'] },
    ])
  })

  it('zet een opsomming direct na tekst in een eigen blok', () => {
    expect(blokken('Let op:\n- a')).toEqual([
      { soort: 'alinea', regels: ['Let op:'] },
      { soort: 'lijst', punten: ['a'] },
    ])
  })

  it('negeert lege punten en Windows-regeleinden', () => {
    expect(blokken('- \r\n- echt')).toEqual([{ soort: 'lijst', punten: ['echt'] }])
  })

  it('geeft niets terug bij lege tekst', () => {
    expect(blokken('  \n\n')).toEqual([])
  })

  it('laat HTML gewoon als tekst staan', () => {
    expect(blokken('<b>hoi</b>')).toEqual([{ soort: 'alinea', regels: ['<b>hoi</b>'] }])
  })
})

describe('voorproef', () => {
  it('zet alles op een regel zonder opsommingstekens', () => {
    expect(voorproef('Hallo\n\n- een\n- twee')).toBe('Hallo een twee')
  })

  it('knipt lange tekst af op een woordgrens', () => {
    const uit = voorproef('woord '.repeat(60), 40)
    expect(uit.endsWith('...')).toBe(true)
    expect(uit.length).toBeLessThanOrEqual(43)
    expect(uit).not.toMatch(/ \.\.\.$/)
  })
})
