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
  test('een kale naam (alleen de naam) is ook een PT-sessie — zoals de auto-hernoem het ziet', () => {
    expect(matchtPtSessie('Atousa Oweisie', 'Atousa Oweisie')).toBe(true)
    expect(matchtPtSessie('Atousa', 'Atousa Oweisie', ['Atousa Oweisie', 'Kevin'])).toBe(true)
  })
  test('kale voornaam die twee klanten delen is dubbelzinnig → telt niet', () => {
    const namen = ['Kevin Jansen', 'Kevin de Vries']
    expect(matchtPtSessie('Kevin', 'Kevin Jansen', namen)).toBe(false)
  })
  test('kale achternaam of een deel van de naam telt niet', () => {
    expect(matchtPtSessie('Oweisie', 'Atousa Oweisie')).toBe(false)
    expect(matchtPtSessie('Atousa bellen', 'Atousa Oweisie')).toBe(false)
  })
  test('matcht niet de sessie van een andere klant', () => {
    expect(matchtPtSessie('PT Rick', 'Iris')).toBe(false)
  })
  test('hele woorden: "Tom" telt niet in "Tomas PT" of "Atom PT"', () => {
    expect(matchtPtSessie('Tomas PT', 'Tom')).toBe(false)
    expect(matchtPtSessie('Atom PT', 'Tom')).toBe(false)
    expect(matchtPtSessie('Tom PT', 'Tom')).toBe(true)
  })
  test('"pt" moet een los woord zijn', () => {
    expect(matchtPtSessie('Optie Iris', 'Iris')).toBe(false)
    expect(matchtPtSessie('PT-sessie Iris', 'Iris')).toBe(true)
  })
  test('meerdelige naam: aaneengesloten telt altijd; los alleen via een unieke voornaam', () => {
    const tweeJohns = ['John Van Der Sanden', 'John Smit']
    expect(matchtPtSessie('John Van Der Sanden PT', 'John Van Der Sanden', tweeJohns)).toBe(true)
    // "John" is hier niet uniek → de losse delen tellen niet.
    expect(matchtPtSessie('John en Van Der Sanden PT', 'John Van Der Sanden', tweeJohns)).toBe(false)
  })
  test('een langere klantnaam in de titel wint: "Ellen" krijgt geen krediet voor het duo', () => {
    const namen = ['Ellen', 'Marjan en Ellen']
    expect(matchtPtSessie('Marjan en Ellen PT', 'Ellen', namen)).toBe(false)
    expect(matchtPtSessie('Marjan en Ellen PT', 'Marjan en Ellen', namen)).toBe(true)
    expect(matchtPtSessie('Ellen PT', 'Ellen', namen)).toBe(true)
  })
  test('"Personal training" voluit telt als PT', () => {
    expect(matchtPtSessie('Joris Bax - Personal training', 'Joris Bax')).toBe(true)
    expect(matchtPtSessie('Personaltraining Joris Bax', 'Joris Bax')).toBe(true)
    expect(matchtPtSessie('Training Joris Bax', 'Joris Bax')).toBe(false)
  })
  test('unieke voornaam in een PT-titel telt ("Joris - Personal training" voor Joris Bax)', () => {
    const crm = ['Joris Bax', 'Kevin', 'Iris']
    expect(matchtPtSessie('Joris - Personal training', 'Joris Bax', crm)).toBe(true)
    expect(matchtPtSessie('Joris PT', 'Joris Bax', crm)).toBe(true)
  })
  test('voornaam die iemand anders in je CRM óók heeft → telt niet (coachgesprek met teamlid Iris)', () => {
    const crm = ['Iris Jansen', 'Iris'] // klant Iris Jansen, PT-teamlid Iris
    expect(matchtPtSessie('Coachgesprek PT - Kane (Iris)', 'Iris Jansen', crm)).toBe(false)
  })
  test('voornaam-terugval niet als een ándere bekende naam volledig in de titel staat', () => {
    const crm = ['Joris Bax', 'Kevin']
    expect(matchtPtSessie('PT Kevin (vervangt Joris)', 'Joris Bax', crm)).toBe(false)
  })
  test('twee losse klanten in één sessie krijgen allebei krediet', () => {
    const namen = ['Kevin', 'Sanne']
    expect(matchtPtSessie('PT Kevin en Sanne', 'Kevin', namen)).toBe(true)
    expect(matchtPtSessie('PT Kevin en Sanne', 'Sanne', namen)).toBe(true)
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

describe('vakantieTot over de draad', () => {
  test('de weekstatus draagt de ingestelde t/m-dag mee (het instel-formulier start erop)', () => {
    const klant: PtKlant = { id: 's', naam: 'Sam', email: null, abonnement: 'wekelijks_1', duo: false, locatie: null, vakantieTot: '2026-09-30' }
    const [status] = bepaalWeekStatus([klant], [], '2026-09-07T00:00:00.000Z', '2026-09-07')
    expect(status.vakantieTot).toBe('2026-09-30')
    const uit = leesPtKlanten({ gekoppeld: true, klanten: [status] })
    expect(uit?.gekoppeld && uit.klanten[0].vakantieTot).toBe('2026-09-30')
  })

  test('onzin of ontbrekend → null', () => {
    const basis = { id: 'k1', naam: 'Kevin', nodig: 1, ingepland: 0, tekort: 1 }
    const uit = leesPtKlanten({ gekoppeld: true, klanten: [{ ...basis, vakantieTot: 'morgen' }, basis] })
    expect(uit?.gekoppeld && uit.klanten.map((k) => k.vakantieTot)).toEqual([null, null])
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

describe('leesPtKlanten — onbekend', () => {
  test('leest geldige regels, laat kapotte weg, ontbrekend veld → leeg', () => {
    const status = { id: 'k1', naam: 'Kevin', nodig: 1, ingepland: 0, tekort: 1 }
    const uit = leesPtKlanten({
      gekoppeld: true,
      klanten: [status],
      onbekend: [{ titel: 'Darren PT', aantal: 2, laatsteOp: '2026-09-25T08:00:00.000Z' }, { titel: 'x' }],
    })
    expect(uit?.gekoppeld && uit.onbekend.map((o) => o.titel)).toEqual(['Darren PT'])
    const oud = leesPtKlanten({ gekoppeld: true, klanten: [status] })
    expect(oud?.gekoppeld && oud.onbekend).toEqual([])
  })
})

describe('leesPtKlanten — typfouten', () => {
  test('leest geldige regels; ontbrekend veld → leeg', () => {
    const status = { id: 'k1', naam: 'Kevin', nodig: 1, ingepland: 0, tekort: 1 }
    const uit = leesPtKlanten({
      gekoppeld: true,
      klanten: [status],
      typfouten: [{ titel: 'Kevnin', bedoeld: 'Kevin', op: '2026-09-22T17:30:00.000Z' }, { titel: 'x' }],
    })
    expect(uit?.gekoppeld && uit.typfouten).toEqual([{ titel: 'Kevnin', bedoeld: 'Kevin', op: '2026-09-22T17:30:00.000Z' }])
    const oud = leesPtKlanten({ gekoppeld: true, klanten: [status] })
    expect(oud?.gekoppeld && oud.typfouten).toEqual([])
  })
})
