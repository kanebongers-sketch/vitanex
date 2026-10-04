import { describe, expect, test } from 'vitest'
import { groepeerOpTijd } from './tijdgroepen'
import type { Taak } from './taken'

function taak(titel: string, datum: string | null, klaar = false): Taak {
  return {
    id: titel, titel, notitie: null, categorie: null, klaar, klaarOp: null, datum, top3Positie: null,
    impact: null, inspanningMinuten: null, energie: null, deadline: null, projectId: null, aangemaaktOp: '2026-09-01T00:00:00Z',
  }
}

describe('groepeerOpTijd', () => {
  test('te laat, vandaag, morgen, deze week, later, ooit — lege groepen weg, klaar telt niet', () => {
    const uit = groepeerOpTijd(
      [
        taak('Ooit', null),
        taak('Later', '2026-10-06'),
        taak('Vrijdag', '2026-10-02'),
        taak('Zondag', '2026-10-04'),
        taak('Morgen', '2026-10-01'),
        taak('Vandaag', '2026-09-30'),
        taak('Te laat', '2026-09-28'),
        taak('Klaar', '2026-09-30', true),
      ],
      '2026-09-30', // woensdag
    )
    expect(uit.map((g) => [g.kop, g.taken.map((t) => t.titel)])).toEqual([
      ['Te laat', ['Te laat']],
      ['Vandaag', ['Vandaag']],
      ['Morgen', ['Morgen']],
      ['Deze week', ['Vrijdag', 'Zondag']],
      ['Later', ['Later']],
      ['Ooit', ['Ooit']],
    ])
  })

  test('op zondag is morgen al "Morgen" en valt er niets meer in "Deze week"', () => {
    const uit = groepeerOpTijd([taak('Ma', '2026-10-05')], '2026-10-04')
    expect(uit.map((g) => g.kop)).toEqual(['Morgen'])
  })
  test('geen dag maar wel een deadline → groep van de deadline (niet "Ooit")', () => {
    const metDeadline = { ...taak('Factuur', null), deadline: '2026-10-01' }
    const uit = groepeerOpTijd([metDeadline, taak('Ooit', null)], '2026-09-30')
    expect(uit.map((g) => [g.sleutel, g.taken.map((t) => t.titel)])).toEqual([
      ['morgen', ['Factuur']],
      ['ooit', ['Ooit']],
    ])
  })

  test('een verstreken deadline wint van een geplande dag in de toekomst', () => {
    const t = { ...taak('Offerte', '2026-10-02'), deadline: '2026-09-29' }
    expect(groepeerOpTijd([t], '2026-09-30').map((g) => g.kop)).toEqual(['Te laat'])
  })

  test('een deadline morgen trekt een taak gepland voor volgende week naar "Morgen"', () => {
    const t = { ...taak('Offerte', '2026-10-06'), deadline: '2026-10-01' }
    expect(groepeerOpTijd([t], '2026-09-30').map((g) => g.kop)).toEqual(['Morgen'])
  })
})
