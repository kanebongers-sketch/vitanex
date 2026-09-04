import { describe, expect, test } from 'vitest'
import { bepaalWeekStatus, matchtPtSessie, ptSessieTitel, type PtEvent, type PtKlant } from './pt-klant'

describe('ptSessieTitel', () => {
  test('bouwt de titel met naam en locatie', () => {
    expect(ptSessieTitel('Iris', 'someren')).toBe('PT Iris Someren')
  })
  test('zonder locatie alleen naam', () => {
    expect(ptSessieTitel('Rick', null)).toBe('PT Rick')
  })
})

describe('matchtPtSessie', () => {
  test('herkent een PT-sessie met de klant', () => {
    expect(matchtPtSessie('PT Iris (Someren)', 'Iris')).toBe(true)
    expect(matchtPtSessie('pt  iris', 'Iris')).toBe(true)
  })
  test('een gewone afspraak met de naam telt niet — er moet "pt" bij', () => {
    expect(matchtPtSessie('Lunch met Iris', 'Iris')).toBe(false)
  })
  test('matcht niet de sessie van een andere klant', () => {
    expect(matchtPtSessie('PT Rick', 'Iris')).toBe(false)
  })
})

describe('bepaalWeekStatus', () => {
  const klanten: PtKlant[] = [
    { id: 'a', naam: 'Iris', email: 'iris@x.nl', sessiesPerWeek: 2, locatie: 'someren', vakantieTot: null },
    { id: 'b', naam: 'Rick', email: null, sessiesPerWeek: 1, locatie: 'budel', vakantieTot: null },
    { id: 'c', naam: 'Sam', email: null, sessiesPerWeek: null, locatie: null, vakantieTot: '2026-09-30' },
  ]
  const VANDAAG = '2026-09-07'

  test('telt geplande sessies en berekent het tekort per klant', () => {
    const events: PtEvent[] = [
      { titel: 'PT Iris (Someren)', startOp: '2026-09-08T09:00:00.000Z' },
      { titel: 'PT Iris (Someren)', startOp: '2026-09-10T09:00:00.000Z' },
      // Rick: nog niets → tekort 1.
    ]
    const status = bepaalWeekStatus(klanten, events, VANDAAG)
    const iris = status.find((s) => s.id === 'a')!
    const rick = status.find((s) => s.id === 'b')!
    expect(iris).toMatchObject({ sessiesPerWeek: 2, ingepland: 2, tekort: 0 })
    expect(rick).toMatchObject({ sessiesPerWeek: 1, ingepland: 0, tekort: 1 })
  })

  test('null frequentie telt als 1×/week', () => {
    const sam = bepaalWeekStatus(klanten, [], VANDAAG).find((s) => s.id === 'c')!
    expect(sam.sessiesPerWeek).toBe(1)
  })

  test('op vakantie: geen tekort, wel gemarkeerd', () => {
    // Sam is op vakantie t/m 30 sep; op 7 sep telt hij niet mee.
    const sam = bepaalWeekStatus(klanten, [], VANDAAG).find((s) => s.id === 'c')!
    expect(sam.opVakantie).toBe(true)
    expect(sam.tekort).toBe(0)
  })

  test('vakantie voorbij: telt weer mee', () => {
    const na = bepaalWeekStatus(klanten, [], '2026-10-01').find((s) => s.id === 'c')!
    expect(na.opVakantie).toBe(false)
    expect(na.tekort).toBe(1)
  })
})
