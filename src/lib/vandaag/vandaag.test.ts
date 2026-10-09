import { describe, expect, test } from 'vitest'
import { normaal } from './normaal'
import { bepaalSignalen, duur, feitZinnen } from './signalen'
import { maakKaart, MAX_ACTIES } from './regels'
import type { Feiten } from './types'

/** Zeven nachten van ongeveer 7u20: genoeg voor een normaal. */
const NACHTEN = [440, 445, 430, 450, 440, 435, 445]
const STAPPEN = [8000, 8500, 7800, 9000, 8200, 8100, 8600]

function feiten(over: Partial<Feiten> = {}): Feiten {
  return {
    datum: '2026-10-09',
    slaapMinuten: 440,
    slaapHistorie: NACHTEN,
    stappenGisteren: 8300,
    stappenHistorie: STAPPEN,
    checkin: { stemming: 4, energie: 4, stress: 2 },
    training: { soort: 'Benen', intensiteit: 'zwaar', tijd: '18:00' },
    heeftPlan: true,
    bedtijdStreef: '23:00',
    afspraken: null,
    grenzen: null,
    herstel: null,
    vo2max: null,
    ...over,
  }
}

describe('normaal', () => {
  test('mediaan van de recente metingen, ongevoelig voor één uitschieter', () => {
    expect(normaal([440, 445, 430, 120, 440])).toBe(440)
  })

  test('te weinig metingen = geen normaal', () => {
    expect(normaal([440, 445, 430])).toBeNull()
  })

  test('nullen en onzin tellen niet mee', () => {
    expect(normaal([0, Number.NaN, 400, 410, 420, 430, 440])).toBe(420)
  })
})

describe('signalen', () => {
  test('een uur minder dan normaal is een korte nacht', () => {
    const s = bepaalSignalen(feiten({ slaapMinuten: 370 }))
    expect(s.slaapKort).toBe(true)
    expect(s.slaapVerschil).toBe(70)
  })

  test('zonder normaal geldt 6 uur als ondergrens', () => {
    expect(bepaalSignalen(feiten({ slaapHistorie: [], slaapMinuten: 330 })).slaapKort).toBe(true)
    expect(bepaalSignalen(feiten({ slaapHistorie: [], slaapMinuten: 400 })).slaapKort).toBe(false)
  })

  test('weinig bewogen alleen ten opzichte van je eigen normaal', () => {
    expect(bepaalSignalen(feiten({ stappenGisteren: 3000 })).weinigBewogen).toBe(true)
    expect(bepaalSignalen(feiten({ stappenGisteren: 7000 })).weinigBewogen).toBe(false)
  })

  test('duur leest als 6u10', () => {
    expect(duur(370)).toBe('6u10')
    expect(duur(420)).toBe('7u')
    expect(duur(45)).toBe('45 min')
  })

  test('feitzinnen noemen alleen wat gemeten is', () => {
    const f = feiten({ slaapMinuten: null, checkin: null, stappenGisteren: null })
    expect(feitZinnen(f, bepaalSignalen(f))).toEqual([])
  })
})

describe('maakKaart — de regelbibliotheek', () => {
  test('gewone dag: alles normaal, plan staat, geen verzonnen advies', () => {
    const kaart = maakKaart(feiten())
    expect(kaart.toon).toBe('normaal')
    expect(kaart.kop).toBe('Alles normaal. Je plan staat.')
    expect(kaart.acties).toEqual([])
    expect(kaart.training).toEqual({ soort: 'Benen', advies: 'zoals_gepland', tijd: '18:00' })
  })

  test('korte nacht + zware training → lichter, plus vroeg naar bed', () => {
    const kaart = maakKaart(feiten({ slaapMinuten: 370 }))
    expect(kaart.toon).toBe('aanpassen')
    expect(kaart.kop).toBe('Licht trainen, rustig aan.')
    expect(kaart.acties.map((a) => a.id)).toEqual(['training', 'bedtijd'])
    expect(kaart.acties[0].waarom).toContain('1u10 minder dan normaal')
    expect(kaart.acties[1].titel).toContain('23:00')
  })

  test('de grens van de trainer wint: na een slechte nacht rust', () => {
    const kaart = maakKaart(feiten({ slaapMinuten: 370, grenzen: { naSlechteNacht: 'rust' } }))
    expect(kaart.toon).toBe('rustig')
    expect(kaart.acties[0].id).toBe('rust')
    expect(kaart.acties[0].waarom).toContain('trainer')
  })

  test('meerdere signalen laag → rust en minder doen', () => {
    const kaart = maakKaart(feiten({ slaapMinuten: 360, checkin: { stemming: 2, energie: 2, stress: 4 } }))
    expect(kaart.toon).toBe('rustig')
    expect(kaart.kop).toBe('Rustige dag. Minder is vandaag het plan.')
    expect(kaart.acties.map((a) => a.id)).toEqual(['rust', 'minder', 'ademhaling'])
    expect(kaart.acties).toHaveLength(MAX_ACTIES)
  })

  test('hoge stress + agenda → pauze vóór de zwaarste afspraak', () => {
    const kaart = maakKaart(
      feiten({
        checkin: { stemming: 3, energie: 3, stress: 4 },
        training: null,
        afspraken: [
          { titel: 'Standup', start: '2026-10-09T07:00:00Z', eind: '2026-10-09T07:15:00Z' },
          { titel: 'Presentatie', start: '2026-10-09T12:00:00Z', eind: '2026-10-09T13:30:00Z' },
        ],
      }),
    )
    expect(kaart.acties[0].id).toBe('pauze')
    expect(kaart.acties[0].titel).toContain('Presentatie')
    expect(kaart.acties[0].titel).toContain('14:00')
    expect(kaart.kop).toBe('Drukke dag. Bouw rust in.')
  })

  test('zittende dag gisteren en geen training → wandelen', () => {
    const kaart = maakKaart(feiten({ training: null, stappenGisteren: 2500 }))
    expect(kaart.acties.map((a) => a.id)).toEqual(['bewegen'])
  })

  test('nog niets bekend → vraag om check-in, geen getallen', () => {
    const kaart = maakKaart(feiten({ slaapMinuten: null, checkin: null, stappenGisteren: null, heeftPlan: false, training: null }))
    expect(kaart.toon).toBe('onbekend')
    expect(kaart.kop).toBe('Goedemorgen. Hoe gaat het vandaag?')
    expect(kaart.acties.map((a) => a.id)).toEqual(['checkin', 'plan'])
    expect(kaart.feiten).toEqual([])
  })

  test('rustdag in het plan, alles normaal', () => {
    expect(maakKaart(feiten({ training: null })).kop).toBe('Alles normaal. Geniet van je rustdag.')
  })

  test('nooit meer dan drie acties', () => {
    const kaart = maakKaart(
      feiten({
        slaapMinuten: 300,
        checkin: null,
        heeftPlan: false,
        stappenGisteren: 1000,
        training: null,
      }),
    )
    expect(kaart.acties.length).toBeLessThanOrEqual(MAX_ACTIES)
  })
})

describe('herstel uit het horloge', () => {
  const HARTSLAG = [52, 53, 51, 52, 54, 52, 53]
  const HRV = [60, 62, 58, 61, 59, 60, 63]

  test('rusthartslag 6 slagen boven normaal → minder hersteld, zware training lichter', () => {
    const k = maakKaart(feiten({ herstel: { rustHartslag: 58, rustHartslagHistorie: HARTSLAG, hrv: null, hrvHistorie: [] } }))
    expect(k.training?.advies).toBe('lichter')
    expect(k.feiten).toContain('Je rusthartslag is 6 slagen hoger dan normaal.')
  })

  test('HRV 25% onder normaal telt ook', () => {
    const s = bepaalSignalen(feiten({ herstel: { rustHartslag: null, rustHartslagHistorie: [], hrv: 45, hrvHistorie: HRV } }))
    expect(s.herstelLaag).toBe(true)
    expect(s.aantalLaag).toBe(1)
  })

  test('binnen je normaal of te weinig historie → geen signaal', () => {
    expect(bepaalSignalen(feiten({ herstel: { rustHartslag: 55, rustHartslagHistorie: HARTSLAG, hrv: 55, hrvHistorie: HRV } })).herstelLaag).toBe(false)
    expect(bepaalSignalen(feiten({ herstel: { rustHartslag: 70, rustHartslagHistorie: [52, 53], hrv: null, hrvHistorie: [] } })).herstelLaag).toBe(false)
  })
})
