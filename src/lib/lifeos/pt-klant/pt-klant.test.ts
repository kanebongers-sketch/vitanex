import { describe, expect, test } from 'vitest'
import { bepaalWeekStatus, leesPtKlanten, matchtPtSessie, ptSessieTitel, type PtEvent, type PtKlant } from './pt-klant'

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
    { id: 'a', naam: 'Iris', email: 'iris@x.nl', abonnement: 'wekelijks_2', duo: false, locatie: 'someren', vakantieTot: null },
    { id: 'b', naam: 'Rick', email: null, abonnement: 'wekelijks_1', duo: false, locatie: 'budel', vakantieTot: null },
    { id: 'c', naam: 'Sam', email: null, abonnement: null, duo: false, locatie: null, vakantieTot: '2026-09-30' },
    { id: 'd', naam: 'Tess', email: null, abonnement: 'tweewekelijks_1', duo: false, locatie: 'bergeijk', vakantieTot: null },
  ]
  // Maandag van de week; VANDAAG valt in diezelfde week.
  const WEEK_VAN = '2026-09-07T00:00:00.000Z'
  const VANDAAG = '2026-09-07'

  test('telt geplande sessies en berekent het tekort per klant', () => {
    const events: PtEvent[] = [
      { titel: 'PT Iris (Someren)', startOp: '2026-09-08T09:00:00.000Z' },
      { titel: 'PT Iris (Someren)', startOp: '2026-09-10T09:00:00.000Z' },
      // Rick: nog niets → tekort 1.
    ]
    const status = bepaalWeekStatus(klanten, events, WEEK_VAN, VANDAAG)
    const iris = status.find((s) => s.id === 'a')!
    const rick = status.find((s) => s.id === 'b')!
    expect(iris).toMatchObject({ nodig: 2, weken: 1, ingepland: 2, tekort: 0 })
    expect(rick).toMatchObject({ nodig: 1, weken: 1, ingepland: 0, tekort: 1 })
  })

  test('2-wekelijks abonnement kijkt over twee weken (vorige week telt mee)', () => {
    // Tess: 1× per 2 weken. Een sessie in de vórige week telt mee → geen tekort.
    const events: PtEvent[] = [
      { titel: 'PT Tess Bergeijk', startOp: '2026-09-02T09:00:00.000Z' },
    ]
    const tess = bepaalWeekStatus(klanten, events, WEEK_VAN, VANDAAG).find((s) => s.id === 'd')!
    expect(tess).toMatchObject({ nodig: 1, weken: 2, ingepland: 1, tekort: 0 })
  })

  test('2-wekelijks: een boeking in de KOMENDE week telt óók mee (geen valse flag)', () => {
    // De Elize-casus: 1× per 2 weken, niets deze of vorige week, maar wél volgende
    // week geboekt. Vroeger keek het venster alleen achteruit → onterecht tekort 1.
    const events: PtEvent[] = [
      { titel: 'PT Tess Bergeijk', startOp: '2026-09-16T09:00:00.000Z' }, // volgende week
    ]
    const tess = bepaalWeekStatus(klanten, events, WEEK_VAN, VANDAAG).find((s) => s.id === 'd')!
    expect(tess).toMatchObject({ nodig: 1, weken: 2, ingepland: 1, tekort: 0 })
  })

  test('wekelijks blijft alleen deze week kijken (komende week telt niet mee)', () => {
    // Rick: 1×/week. Een boeking volgende week dekt deze week niet → tekort blijft 1.
    const events: PtEvent[] = [
      { titel: 'PT Rick Budel', startOp: '2026-09-16T09:00:00.000Z' }, // volgende week
    ]
    const rick = bepaalWeekStatus(klanten, events, WEEK_VAN, VANDAAG).find((s) => s.id === 'b')!
    expect(rick).toMatchObject({ nodig: 1, weken: 1, ingepland: 0, tekort: 1 })
  })

  test('geen abonnement telt als 1×/week', () => {
    const sam = bepaalWeekStatus(klanten, [], WEEK_VAN, VANDAAG).find((s) => s.id === 'c')!
    expect(sam.nodig).toBe(1)
    expect(sam.weken).toBe(1)
  })

  test('op vakantie: geen tekort, wel gemarkeerd', () => {
    // Sam is op vakantie t/m 30 sep; op 7 sep telt hij niet mee.
    const sam = bepaalWeekStatus(klanten, [], WEEK_VAN, VANDAAG).find((s) => s.id === 'c')!
    expect(sam.opVakantie).toBe(true)
    expect(sam.tekort).toBe(0)
  })

  test('vakantie voorbij: telt weer mee', () => {
    const na = bepaalWeekStatus(klanten, [], WEEK_VAN, '2026-10-01').find((s) => s.id === 'c')!
    expect(na.opVakantie).toBe(false)
    expect(na.tekort).toBe(1)
  })
})

describe('leesPtKlanten — afhaak', () => {
  const status = { id: 'k1', naam: 'Kevin', nodig: 1, ingepland: 0, tekort: 1 }

  test('leest geldige afhaak-regels mee', () => {
    const uit = leesPtKlanten({ gekoppeld: true, klanten: [status], afhaak: [{ id: 'k1', naam: 'Kevin', wekenGeleden: 4 }] })
    expect(uit?.gekoppeld && uit.afhaak).toEqual([{ id: 'k1', naam: 'Kevin', wekenGeleden: 4 }])
  })

  test('een kapotte afhaak-regel valt weg; de weekstatus blijft staan', () => {
    const uit = leesPtKlanten({ gekoppeld: true, klanten: [status], afhaak: [{ naam: 'x' }, { id: 'k2', naam: 'Iris', wekenGeleden: 3 }] })
    expect(uit?.gekoppeld && uit.klanten).toHaveLength(1)
    expect(uit?.gekoppeld && uit.afhaak.map((a) => a.naam)).toEqual(['Iris'])
  })

  test('oud antwoord zonder afhaak-veld → lege lijst, geen fout', () => {
    const uit = leesPtKlanten({ gekoppeld: true, klanten: [status] })
    expect(uit?.gekoppeld && uit.afhaak).toEqual([])
  })
})

describe('leesPtKlanten — statusHints', () => {
  const status = { id: 'k1', naam: 'Kevin', nodig: 1, ingepland: 0, tekort: 1 }

  test('leest geldige hints en laat kapotte weg', () => {
    const uit = leesPtKlanten({
      gekoppeld: true,
      klanten: [status],
      statusHints: [
        { id: 'j', naam: 'Joris', status: 'moet_benaderen', statusLabel: 'Moet benaderen', sessies: 4 },
        { id: 'x', naam: 'Kapot' },
      ],
    })
    expect(uit?.gekoppeld && uit.statusHints.map((h) => h.naam)).toEqual(['Joris'])
  })

  test('oud antwoord zonder statusHints → lege lijst', () => {
    const uit = leesPtKlanten({ gekoppeld: true, klanten: [status] })
    expect(uit?.gekoppeld && uit.statusHints).toEqual([])
  })
})
