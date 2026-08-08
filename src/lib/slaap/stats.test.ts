import { describe, it, expect } from 'vitest'
import { tijdNaarMinuten, urenUitTijden, gemiddelde, slaapschuld, regelmaat } from './stats'

describe('tijdNaarMinuten', () => {
  it('leest een geldige tijd', () => {
    expect(tijdNaarMinuten('23:30')).toBe(23 * 60 + 30)
    expect(tijdNaarMinuten('07:00')).toBe(420)
  })
  it('is null bij onzin', () => {
    expect(tijdNaarMinuten('25:00')).toBeNull()
    expect(tijdNaarMinuten('7u')).toBeNull()
  })
})

describe('urenUitTijden', () => {
  it('rekent een nacht over middernacht correct', () => {
    expect(urenUitTijden('23:00', '07:00')).toBe(8)
    expect(urenUitTijden('23:30', '06:00')).toBe(6.5)
  })
  it('rekent een dutje binnen dezelfde dag', () => {
    expect(urenUitTijden('13:00', '14:30')).toBe(1.5)
  })
  it('is null bij een ontbrekende tijd', () => {
    expect(urenUitTijden('', '07:00')).toBeNull()
  })
})

describe('gemiddelde', () => {
  it('rondt op 1 decimaal', () => {
    expect(gemiddelde([7, 8, 6])).toBe(7)
    expect(gemiddelde([7.5, 8])).toBe(7.8)
  })
  it('is null bij leeg', () => {
    expect(gemiddelde([])).toBeNull()
  })
})

describe('slaapschuld', () => {
  it('telt alleen tekorten op t.o.v. het doel', () => {
    // doel 8: nachten 7, 6, 9 → tekorten 1 + 2 + 0 = 3
    expect(slaapschuld([7, 6, 9], 8)).toBe(3)
  })
  it('is 0 als je altijd je doel haalt', () => {
    expect(slaapschuld([8, 9, 8.5], 8)).toBe(0)
  })
  it('is 0 zonder geldig doel', () => {
    expect(slaapschuld([5, 5], 0)).toBe(0)
  })
})

describe('regelmaat', () => {
  it('is 100 bij identieke bedtijden', () => {
    expect(regelmaat(['23:00', '23:00', '23:00'])).toBe(100)
  })
  it('behandelt tijden na middernacht als aansluitend', () => {
    // 23:00 en 01:00 liggen 2 uur uit elkaar, niet 22.
    const score = regelmaat(['23:00', '01:00'])
    expect(score).not.toBeNull()
    expect(score as number).toBeGreaterThan(0)
    expect(score as number).toBeLessThan(100)
  })
  it('is null bij te weinig data', () => {
    expect(regelmaat(['23:00'])).toBeNull()
  })
  it('daalt bij grote spreiding', () => {
    expect(regelmaat(['21:00', '23:00', '01:00', '03:00'])).toBeLessThan(50)
  })
})
