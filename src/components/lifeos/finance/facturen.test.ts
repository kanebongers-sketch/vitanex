import { describe, expect, test } from 'vitest'
import { dagPlus, leesFacturen, openFacturen, vervalTekst, type FactuurView } from './facturen'

const VANDAAG = '2026-09-25'

function f(over: Partial<FactuurView>): FactuurView {
  return { id: 'x', klant: 'Klant', bedrag: 100, status: 'open', factuurdatum: '2026-09-01', vervaldatum: null, ...over }
}

describe('leesFacturen', () => {
  test('leest geldige rijen, laat kapotte vallen', () => {
    const uit = leesFacturen({
      facturen: [
        { id: 'a', klant: 'Edwin', bedrag: 240, status: 'open', factuurdatum: '2026-09-01', vervaldatum: '2026-09-15' },
        { id: 'b', klant: 'X', bedrag: 'veel', status: 'open', factuurdatum: '2026-09-01' },
        { id: 'c', klant: 'Y', bedrag: 10, status: 'raar', factuurdatum: '2026-09-01' },
      ],
    })
    expect(uit?.map((x) => x.id)).toEqual(['a'])
  })

  test('onverwachte vorm → null', () => {
    expect(leesFacturen({})).toBeNull()
    expect(leesFacturen(null)).toBeNull()
  })
})

describe('openFacturen', () => {
  test('betaald valt weg; te laat eerst, dan op vervaldatum, zonder datum achteraan', () => {
    const lijst = openFacturen(
      [
        f({ id: 'geen', vervaldatum: null }),
        f({ id: 'later', vervaldatum: '2026-10-10' }),
        f({ id: 'betaald', status: 'betaald', vervaldatum: '2026-09-01' }),
        f({ id: 'laat', vervaldatum: '2026-09-20' }),
        f({ id: 'gemarkeerd', status: 'verlopen', vervaldatum: '2026-10-30' }),
        f({ id: 'eerder', vervaldatum: '2026-09-30' }),
      ],
      VANDAAG,
    )
    expect(lijst.map((x) => x.id)).toEqual(['laat', 'gemarkeerd', 'eerder', 'later', 'geen'])
  })
})

describe('vervalTekst', () => {
  test('te laat / vandaag / later / geen', () => {
    expect(vervalTekst(f({ vervaldatum: '2026-09-20' }), VANDAAG)).toBe('te laat sinds 20 sep')
    expect(vervalTekst(f({ vervaldatum: VANDAAG }), VANDAAG)).toBe('vervalt vandaag')
    expect(vervalTekst(f({ vervaldatum: '2026-10-09' }), VANDAAG)).toBe('vervalt 9 okt')
    expect(vervalTekst(f({ vervaldatum: null }), VANDAAG)).toBe('geen vervaldatum')
    expect(vervalTekst(f({ status: 'verlopen', vervaldatum: null }), VANDAAG)).toBe('te laat')
  })
})

describe('dagPlus', () => {
  test('over maandgrens en zomertijd heen', () => {
    expect(dagPlus('2026-09-25', 14)).toBe('2026-10-09')
    expect(dagPlus('2026-10-20', 14)).toBe('2026-11-03')
  })
})
