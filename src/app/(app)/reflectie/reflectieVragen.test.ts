import { describe, expect, test } from 'vitest'
import { bepaalWeekStart, berekenWekenOpRij, eersteOpenVraag } from './reflectieVragen'

describe('bepaalWeekStart', () => {
  test('geeft de maandag van de week voor een doordeweekse dag', () => {
    // Arrange: woensdag 1 juli 2026
    const woensdag = new Date(2026, 6, 1, 14, 30)
    // Act
    const resultaat = bepaalWeekStart(woensdag)
    // Assert: maandag 29 juni 2026
    expect(resultaat).toBe('2026-06-29')
  })

  test('blijft op zondag in de huidige week (getDay() === 0)', () => {
    const zondag = new Date(2026, 6, 5, 9, 0)
    expect(bepaalWeekStart(zondag)).toBe('2026-06-29')
  })

  test('geeft een maandag zichzelf terug, ook vlak voor middernacht lokaal', () => {
    const maandagLaat = new Date(2026, 5, 29, 23, 59)
    expect(bepaalWeekStart(maandagLaat)).toBe('2026-06-29')
  })

  test('muteert de meegegeven datum niet', () => {
    const datum = new Date(2026, 6, 1)
    const kopie = new Date(datum)
    bepaalWeekStart(datum)
    expect(datum.getTime()).toBe(kopie.getTime())
  })
})

describe('berekenWekenOpRij', () => {
  test('geeft 0 zonder eerdere reflecties', () => {
    expect(berekenWekenOpRij([], '2026-06-29')).toBe(0)
  })

  test('telt alleen de huidige week als 1', () => {
    expect(berekenWekenOpRij(['2026-06-29'], '2026-06-29')).toBe(1)
  })

  test('telt aaneengesloten weken door, ook over een maandgrens', () => {
    const weken = ['2026-06-29', '2026-06-22', '2026-06-15']
    expect(berekenWekenOpRij(weken, '2026-06-29')).toBe(3)
  })

  test('stopt bij een gat in de reeks', () => {
    const weken = ['2026-06-29', '2026-06-15']
    expect(berekenWekenOpRij(weken, '2026-06-29')).toBe(1)
  })

  test('telt vanaf vorige week als deze week nog niet is opgeslagen', () => {
    const weken = ['2026-06-22', '2026-06-15']
    expect(berekenWekenOpRij(weken, '2026-06-29')).toBe(2)
  })
})

describe('eersteOpenVraag', () => {
  test('begint vooraan zonder antwoorden', () => {
    expect(eersteOpenVraag({})).toBe(0)
  })

  test('springt naar de eerste lege vraag en negeert witruimte', () => {
    expect(eersteOpenVraag({ hoogtepunt: 'Mooi moment', uitdaging: '   ' })).toBe(1)
  })

  test('valt terug op 0 als alles is ingevuld', () => {
    const alles = {
      hoogtepunt: 'a', uitdaging: 'b', leermoment: 'c',
      energie: 'd', volgende_week: 'e', dankbaarheid: 'f',
    }
    expect(eersteOpenVraag(alles)).toBe(0)
  })
})
