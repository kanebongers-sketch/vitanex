import { describe, expect, it } from 'vitest'
import { leesMelding } from '@/lib/club/hulp/melding'
import { HULP_PAGINA, hulpVerzoek, hulpVoorStap } from './hulp-stap'
import { STAPPEN } from './stappen'

describe('hulpVoorStap', () => {
  it('zet de stap en de titel in het onderwerp', () => {
    expect(hulpVoorStap(6)).toEqual({ soort: 'vraag', onderwerp: 'Startwizard, stap 6 (Team): ik kom er niet uit', pagina: HULP_PAGINA })
  })

  it('valt terug op stap 1 bij een onzinnig nummer', () => {
    for (const n of [0, -1, 99, 2.5, Number.NaN]) expect(hulpVoorStap(n).onderwerp).toContain('stap 1 (')
  })

  it('geeft voor elke stap een melding die het helpcentrum accepteert', () => {
    STAPPEN.forEach((_, i) => {
      const uit = leesMelding(hulpVerzoek(i + 1, '  Ik weet niet wat ik hier moet kiezen.  '))
      expect(uit.ok).toBe(true)
      if (uit.ok) {
        expect(uit.waarde.pagina).toBe('/club/start')
        expect(uit.waarde.beschrijving).toBe('Ik weet niet wat ik hier moet kiezen.')
      }
    })
  })

  it('laat een te korte beschrijving door de gewone controle weigeren', () => {
    expect(leesMelding(hulpVerzoek(2, 'help')).ok).toBe(false)
  })
})
