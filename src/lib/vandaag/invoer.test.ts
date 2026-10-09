import { describe, expect, test } from 'vitest'
import { leesActie, leesCheckIn, leesPlan } from './invoer'

describe('leesCheckIn', () => {
  test('drie gehele getallen 1–5', () => {
    expect(leesCheckIn({ stemming: 4, energie: 3, stress: 2 })).toEqual({ ok: true, waarde: { stemming: 4, energie: 3, stress: 2 } })
  })
  test('buiten de schaal, kommagetal of ontbrekend → fout', () => {
    expect(leesCheckIn({ stemming: 6, energie: 3, stress: 2 }).ok).toBe(false)
    expect(leesCheckIn({ stemming: 3.5, energie: 3, stress: 2 }).ok).toBe(false)
    expect(leesCheckIn({ stemming: 3 }).ok).toBe(false)
    expect(leesCheckIn(null).ok).toBe(false)
  })
})

describe('leesActie', () => {
  test('bekende actie en keuze', () => {
    expect(leesActie({ actie: 'bedtijd', keuze: 'oke', toon: 'aanpassen' })).toEqual({ ok: true, waarde: { actie: 'bedtijd', keuze: 'oke', toon: 'aanpassen' } })
  })
  test('onbekende toon wordt null, onbekende actie is een fout', () => {
    expect(leesActie({ actie: 'bedtijd', keuze: 'nee', toon: 'raar' })).toEqual({ ok: true, waarde: { actie: 'bedtijd', keuze: 'nee', toon: null } })
    expect(leesActie({ actie: 'hacken', keuze: 'oke' }).ok).toBe(false)
  })
})

describe('leesPlan', () => {
  test('geldig plan, gesorteerd op weekdag', () => {
    const uit = leesPlan({ dagen: [
      { weekdag: 4, soort: 'Hardlopen', intensiteit: 'licht', tijd: null },
      { weekdag: 1, soort: ' Benen ', intensiteit: 'zwaar', tijd: '18:00' },
    ] })
    expect(uit).toEqual({ ok: true, waarde: [
      { weekdag: 1, soort: 'Benen', intensiteit: 'zwaar', tijd: '18:00' },
      { weekdag: 4, soort: 'Hardlopen', intensiteit: 'licht', tijd: null },
    ] })
  })
  test('leeg plan mag (alles rustdagen)', () => {
    expect(leesPlan({ dagen: [] })).toEqual({ ok: true, waarde: [] })
  })
  test('dubbele dag, foute tijd of lege naam → fout', () => {
    expect(leesPlan({ dagen: [{ weekdag: 1, soort: 'A', intensiteit: 'zwaar' }, { weekdag: 1, soort: 'B', intensiteit: 'licht' }] }).ok).toBe(false)
    expect(leesPlan({ dagen: [{ weekdag: 1, soort: 'A', intensiteit: 'zwaar', tijd: '25:00' }] }).ok).toBe(false)
    expect(leesPlan({ dagen: [{ weekdag: 1, soort: '  ', intensiteit: 'zwaar' }] }).ok).toBe(false)
  })
})
