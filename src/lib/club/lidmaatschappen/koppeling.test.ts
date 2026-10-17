import { describe, expect, it } from 'vitest'
import { appMelding, besluitBoeking, checkinWaarschuwing, lesAanvraag, telLessenInWeek, weekVanLes, type WeekBoeking } from './koppeling'
import { magLesBoeken, type ToegangRegel } from './regels'

const ALLES: ToegangRegel = { naam: 'Onbeperkt', vestigingen: null, groepslessen: true, maxLessenPerWeek: null, dalVan: null, dalTot: null, dalWeekendVrij: false }
const DAL: ToegangRegel = { ...ALLES, naam: 'Dal-uren', dalVan: '09:00', dalTot: '16:00' }
const BUDEL: ToegangRegel = { ...ALLES, naam: 'Budel only', vestigingen: ['budel'] }
const STUDENT: ToegangRegel = { ...ALLES, naam: 'Student', maxLessenPerWeek: 2 }
const FITNESS: ToegangRegel = { ...ALLES, naam: 'Fitness', groepslessen: false }

// Dinsdag 20 oktober 2026, zomertijd: Nederland = UTC + 2.
const DI_1030 = new Date('2026-10-20T08:30:00Z')
const DI_1900 = new Date('2026-10-20T17:00:00Z')

describe('checkinWaarschuwing', () => {
  it('geeft geen waarschuwing zonder vorm of als het mag', () => {
    expect(checkinWaarschuwing(null, 'eersel', DI_1900)).toBeNull()
    expect(checkinWaarschuwing(DAL, 'budel', DI_1030)).toBeNull()
  })

  it('waarschuwt buiten de daluren en in een andere vestiging', () => {
    // Arrange en Act
    const dal = checkinWaarschuwing(DAL, 'budel', DI_1900)
    const elders = checkinWaarschuwing(BUDEL, 'eersel', DI_1030)
    // Assert
    expect(dal).toContain('Buiten de daluren')
    expect(elders).toContain('geen toegang tot deze vestiging')
  })
})

describe('besluitBoeking', () => {
  const nee = { mag: false as const, waarom: 'maximum' as const, reden: 'Met Student boek je maximaal 2 lessen per week, en die zijn al geboekt.' }

  it('laat door als het mag, uit elke bron', () => {
    expect(besluitBoeking({ mag: true }, 'app', false)).toEqual({ soort: 'door', ondanks: null })
    expect(besluitBoeking({ mag: true }, 'balie', true)).toEqual({ soort: 'door', ondanks: null })
  })

  it('weigert in de ledenapp met een vriendelijke melding, ook met toch', () => {
    const uit = besluitBoeking(nee, 'app', true)
    expect(uit).toMatchObject({ soort: 'weiger' })
    expect(uit.soort === 'weiger' && uit.melding).toContain('Volgende week kun je weer boeken')
  })

  it('waarschuwt aan de balie en boekt met toch, met de reden voor het logboek', () => {
    expect(besluitBoeking(nee, 'balie', false)).toEqual({ soort: 'waarschuw', reden: nee.reden })
    expect(besluitBoeking(nee, 'instructeur', true)).toEqual({ soort: 'door', ondanks: nee.reden })
  })
})

describe('appMelding', () => {
  it('noemt de uren bij daluren', () => {
    const reden = 'Deze les valt buiten de daluren: Dal-uren geldt van 09:00 tot 16:00.'
    expect(appMelding('daluren', reden)).toBe('Deze les valt buiten de uren van je lidmaatschap. Je kunt lessen boeken tussen 09:00 en 16:00.')
  })

  it('heeft voor elke weigering een eigen zin zonder interne termen', () => {
    expect(appMelding('groepslessen', '')).toContain('Groepslessen zitten niet in je lidmaatschap')
    expect(appMelding('vestiging', '')).toContain('niet in deze vestiging')
    expect(appMelding('daluren', 'onbekend')).toBe('Deze les valt buiten de uren van je lidmaatschap.')
  })
})

describe('telLessenInWeek', () => {
  const b = (lesId: string, iso: string, status = 'geboekt'): WeekBoeking => ({ lesId, status, start: new Date(iso) })

  it('telt boekingen in dezelfde week (ma tot en met zo, Nederlandse tijd), zonder deze les', () => {
    // Arrange: week van maandag 19 tot en met zondag 25 oktober 2026.
    const boekingen = [
      b('a', '2026-10-18T22:30:00Z'), // maandag 19 oktober 00:30 NL: telt
      b('b', '2026-10-25T20:00:00Z', 'aanwezig'), // zondag 21:00 NL: telt
      b('c', '2026-10-18T21:00:00Z'), // zondag 18 oktober 23:00 NL: vorige week
      b('d', '2026-10-21T17:00:00Z', 'geannuleerd'), // telt niet
      b('e', '2026-10-22T17:00:00Z', 'wachtlijst'), // telt (kan doorschuiven)
      b('les', '2026-10-20T17:00:00Z'), // de les zelf
    ]
    // Act
    const aantal = telLessenInWeek(boekingen, 'les', DI_1900)
    // Assert
    expect(aantal).toBe(3)
  })

  it('geeft de weekgrenzen op de Nederlandse klok', () => {
    const { van, tot } = weekVanLes(DI_1900)
    expect(van.toISOString()).toBe('2026-10-18T22:00:00.000Z')
    // Na de omschakeling naar wintertijd (25 oktober) is middernacht 23:00 UTC.
    expect(tot.toISOString()).toBe('2026-10-25T23:00:00.000Z')
  })
})

describe('lesAanvraag met magLesBoeken', () => {
  it('rekent begin en einde op de Nederlandse klok', () => {
    const aanvraag = lesAanvraag({ vestiging: 'budel', start: DI_1030, eind: new Date('2026-10-20T09:30:00Z') }, 0)
    expect(aanvraag).toEqual({ vestiging: 'budel', start: { weekdag: 2, minuten: 630 }, eindMinuten: 690, lessenDezeWeek: 0 })
  })

  it('zet het einde op middernacht als de les over de dag heen loopt', () => {
    const aanvraag = lesAanvraag({ vestiging: 'budel', start: new Date('2026-10-20T21:30:00Z'), eind: new Date('2026-10-20T22:30:00Z') }, 0)
    expect(aanvraag.eindMinuten).toBe(24 * 60)
  })

  it('weigert het maximum en een vorm zonder groepslessen, laat zonder vorm alles toe', () => {
    const vol = lesAanvraag({ vestiging: 'budel', start: DI_1030, eind: new Date('2026-10-20T09:30:00Z') }, 2)
    expect(magLesBoeken(STUDENT, vol)).toMatchObject({ mag: false, waarom: 'maximum' })
    expect(magLesBoeken(FITNESS, vol)).toMatchObject({ mag: false, waarom: 'groepslessen' })
    expect(magLesBoeken(null, vol)).toEqual({ mag: true })
  })
})
