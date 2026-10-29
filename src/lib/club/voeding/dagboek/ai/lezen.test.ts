import { describe, expect, it } from 'vitest'
import { eersteJson, leesAiItem, leesAiRespons, MAX_ITEMS } from './lezen'

// Geporteerd uit MentaForce (components/voeding/voice-client.test.ts). De
// AI-uitvoer is een systeemgrens: kapotte of onvolledige items mogen het
// controlescherm niet laten vastlopen. Ontbrekende macro's worden 0, items
// zonder naam vallen weg.

describe('leesAiItem', () => {
  it('leest een volledig item (snake_case naar camelCase)', () => {
    const i = leesAiItem({ naam: 'Banaan', portie_omschrijving: '1 stuk', portie_gram: 120, calorieen: 105, eiwitten_g: 1.3, koolhydraten_g: 27, vetten_g: 0.4, betrouwbaarheid: 'hoog' })
    expect(i).toEqual({ naam: 'Banaan', portieOmschrijving: '1 stuk', portieGram: 120, kcal: 105, eiwitG: 1.3, koolhydratenG: 27, vetG: 0.4, betrouwbaarheid: 'hoog' })
  })

  it('vult ontbrekende macro\'s met 0 en onbekende betrouwbaarheid met laag', () => {
    expect(leesAiItem({ naam: 'Onbekend hapje' })).toMatchObject({ kcal: 0, eiwitG: 0, koolhydratenG: 0, vetG: 0, betrouwbaarheid: 'laag', portieGram: null, portieOmschrijving: null })
  })

  it('weigert een item zonder naam', () => {
    expect(leesAiItem({ calorieen: 100 })).toBeNull()
    expect(leesAiItem({ naam: '   ' })).toBeNull()
    expect(leesAiItem('banaan')).toBeNull()
  })

  it('rondt kcal af en weigert negatieve of absurde waarden', () => {
    expect(leesAiItem({ naam: 'x', calorieen: 154.6 })?.kcal).toBe(155)
    expect(leesAiItem({ naam: 'x', calorieen: -50, eiwitten_g: -3 })).toMatchObject({ kcal: 0, eiwitG: 0 })
    expect(leesAiItem({ naam: 'x', portie_gram: 99999 })?.portieGram).toBeNull()
  })
})

describe('leesAiRespons', () => {
  it('neemt de omschrijving en items mee en gooit kapotte items eruit', () => {
    const r = leesAiRespons({ transcript: 'twee eieren', items: [{ naam: 'Ei' }, { calorieen: 5 }, null] })
    expect(r?.transcript).toBe('twee eieren')
    expect(r?.items).toHaveLength(1)
    expect(r?.items[0].naam).toBe('Ei')
  })

  it('geeft lege items bij een ontbrekende lijst, null bij onzin', () => {
    expect(leesAiRespons({ transcript: 'niks' })).toEqual({ transcript: 'niks', items: [] })
    expect(leesAiRespons(null)).toBeNull()
    expect(leesAiRespons('tekst')).toBeNull()
  })

  it('begrenst het aantal items', () => {
    const veel = Array.from({ length: 40 }, (_, i) => ({ naam: `Item ${i}` }))
    expect(leesAiRespons({ items: veel })?.items).toHaveLength(MAX_ITEMS)
  })
})

describe('eersteJson', () => {
  it('haalt JSON uit een antwoord met of zonder hekjes', () => {
    expect(eersteJson('```json\n{"items":[]}\n```')).toEqual({ items: [] })
    expect(eersteJson('Hier: {"a":1} klaar')).toEqual({ a: 1 })
    expect(eersteJson('geen json')).toBeNull()
    expect(eersteJson('{kapot')).toBeNull()
  })
})
