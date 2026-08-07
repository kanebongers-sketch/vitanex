import { describe, it, expect } from 'vitest'
import { leesVoiceItem, leesVoiceRespons } from './voice-client'

// De AI-uitvoer is een systeemgrens: kapotte of onvolledige items mogen de
// review-UI niet laten crashen. Ontbrekende macro's → 0 (schatting, tóch te
// corrigeren), items zonder naam vallen weg.

describe('leesVoiceItem', () => {
  it('leest een volledig item (snake_case → camelCase)', () => {
    const i = leesVoiceItem({ naam: 'Banaan', portie_omschrijving: '1 stuk', portie_gram: 120, calorieen: 105, eiwitten_g: 1.3, koolhydraten_g: 27, vetten_g: 0.4, betrouwbaarheid: 'hoog' })
    expect(i).toEqual({ naam: 'Banaan', portieOmschrijving: '1 stuk', portieGram: 120, calorieen: 105, eiwittenG: 1.3, koolhydratenG: 27, vettenG: 0.4, betrouwbaarheid: 'hoog' })
  })

  it('vult ontbrekende macro\'s met 0 en onbekende betrouwbaarheid met laag', () => {
    const i = leesVoiceItem({ naam: 'Onbekend hapje' })
    expect(i).toMatchObject({ calorieen: 0, eiwittenG: 0, koolhydratenG: 0, vettenG: 0, betrouwbaarheid: 'laag', portieGram: null, portieOmschrijving: null })
  })

  it('weigert een item zonder naam', () => {
    expect(leesVoiceItem({ calorieen: 100 })).toBeNull()
    expect(leesVoiceItem({ naam: '   ' })).toBeNull()
    expect(leesVoiceItem('banaan')).toBeNull()
  })

  it('rondt calorieen af op heel', () => {
    expect(leesVoiceItem({ naam: 'x', calorieen: 154.6 })?.calorieen).toBe(155)
  })
})

describe('leesVoiceRespons', () => {
  it('narrowt transcript + items en gooit kapotte items eruit', () => {
    const r = leesVoiceRespons({ transcript: 'twee eieren', items: [{ naam: 'Ei' }, { calorieen: 5 }, null] })
    expect(r?.transcript).toBe('twee eieren')
    expect(r?.items).toHaveLength(1)
    expect(r?.items[0].naam).toBe('Ei')
  })

  it('geeft lege items bij een ontbrekende lijst, null bij onzin', () => {
    expect(leesVoiceRespons({ transcript: 'niks' })).toEqual({ transcript: 'niks', items: [] })
    expect(leesVoiceRespons(null)).toBeNull()
    expect(leesVoiceRespons('tekst')).toBeNull()
  })
})
