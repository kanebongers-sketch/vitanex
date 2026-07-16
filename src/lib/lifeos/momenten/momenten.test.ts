import { describe, it, expect } from 'vitest'
import { momentVoorUur, huidigMoment, groetVoorUur, MOMENTEN, momentDef } from './momenten'

describe('momentVoorUur', () => {
  it('geeft ochtend tot 11:00', () => {
    expect(momentVoorUur(0)).toBe('ochtend')
    expect(momentVoorUur(7)).toBe('ochtend')
    expect(momentVoorUur(10)).toBe('ochtend')
  })

  it('schakelt op 11:00 naar nu — de ochtend loopt door tot je echt begonnen bent', () => {
    expect(momentVoorUur(11)).toBe('nu')
    expect(momentVoorUur(15)).toBe('nu')
    expect(momentVoorUur(19)).toBe('nu')
  })

  it('begint de avond pas om 20:00, niet om 17:00', () => {
    // Arrange/Act/Assert — om 17:00 werk je vaak nog; dan is het geen avond.
    expect(momentVoorUur(19)).toBe('nu')
    expect(momentVoorUur(20)).toBe('avond')
    expect(momentVoorUur(23)).toBe('avond')
  })

  it('kapt een niet-heel uur netjes af i.p.v. te struikelen', () => {
    expect(momentVoorUur(10.9)).toBe('ochtend')
    expect(momentVoorUur(20.1)).toBe('avond')
  })

  it('valt terug op nu bij onzin — nooit een crash op een kapotte klok', () => {
    expect(momentVoorUur(NaN)).toBe('nu')
    expect(momentVoorUur(Infinity)).toBe('nu')
  })
})

describe('huidigMoment', () => {
  it('leest het uur uit de meegegeven datum', () => {
    // Arrange — de klok komt erín, dus deze test valt niet anders uit om 23:59.
    const ochtend = new Date(2026, 6, 15, 8, 30)
    const avond = new Date(2026, 6, 15, 21, 15)

    // Act + Assert
    expect(huidigMoment(ochtend)).toBe('ochtend')
    expect(huidigMoment(avond)).toBe('avond')
  })
})

describe('groetVoorUur', () => {
  it('past de groet aan het moment aan', () => {
    expect(groetVoorUur(8)).toBe('Goedemorgen')
    expect(groetVoorUur(14)).toBe('Hallo')
    expect(groetVoorUur(22)).toBe('Goedenavond')
  })
})

describe('MOMENTEN', () => {
  it('zijn er precies drie — geen 23-widget-muur', () => {
    expect(MOMENTEN).toHaveLength(3)
  })

  it('beantwoordt elk moment één vraag', () => {
    for (const m of MOMENTEN) {
      expect(m.vraag.length).toBeGreaterThan(0)
      expect(momentDef(m.key)).toBe(m)
    }
  })
})
