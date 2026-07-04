import { describe, expect, test } from 'vitest'
import { eersteOpenVraag } from './reflectieVragen'

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
