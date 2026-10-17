import { describe, expect, it } from 'vitest'
import { binnenDaluren, magBinnen, magLesBoeken, momentVan, regelsTekst, vormVoorLid, type ToegangRegel } from './regels'

const ALLES: ToegangRegel = { naam: 'Onbeperkt', vestigingen: null, groepslessen: true, maxLessenPerWeek: null, dalVan: null, dalTot: null, dalWeekendVrij: false }
const DAL: ToegangRegel = { ...ALLES, naam: 'Dal-uren', dalVan: '09:00', dalTot: '16:00', dalWeekendVrij: true }
const CENTRUM: ToegangRegel = { ...ALLES, naam: 'Fitness flex', vestigingen: ['centrum'], groepslessen: false }
const STUDENT: ToegangRegel = { ...ALLES, naam: 'Student', maxLessenPerWeek: 2 }

const dinsdag = (u: number, m = 0) => ({ weekdag: 2, minuten: u * 60 + m })
const zaterdag = (u: number) => ({ weekdag: 6, minuten: u * 60 })

describe('vormVoorLid', () => {
  it('vindt de vorm ongeacht hoofdletters en spaties', () => {
    // Arrange
    const vormen = [{ naam: 'All-in 12 maanden' }, { naam: 'Student' }]
    // Act
    const vorm = vormVoorLid(vormen, '  all-in   12 Maanden ')
    // Assert
    expect(vorm?.naam).toBe('All-in 12 maanden')
  })

  it('geeft null zonder abonnement of zonder passende vorm', () => {
    expect(vormVoorLid([{ naam: 'Student' }], null)).toBeNull()
    expect(vormVoorLid([{ naam: 'Student' }], '  ')).toBeNull()
    expect(vormVoorLid([{ naam: 'Student' }], 'Senior')).toBeNull()
  })
})

describe('magBinnen', () => {
  it('laat een lid zonder bekende vorm door: Sportivity beslist', () => {
    expect(magBinnen(null, 'noord', dinsdag(22))).toEqual({ mag: true })
  })

  it('weigert een vestiging die niet bij de vorm hoort', () => {
    const uit = magBinnen(CENTRUM, 'noord', dinsdag(10))
    expect(uit).toMatchObject({ mag: false, waarom: 'vestiging' })
  })

  it('laat binnen op een vestiging van de vorm', () => {
    expect(magBinnen(CENTRUM, 'centrum', dinsdag(10)).mag).toBe(true)
  })

  it('houdt daluren aan doordeweeks, met de grenzen erbij', () => {
    expect(magBinnen(DAL, 'noord', dinsdag(9)).mag).toBe(true)
    expect(magBinnen(DAL, 'noord', dinsdag(16)).mag).toBe(true)
    expect(magBinnen(DAL, 'noord', dinsdag(8, 59))).toMatchObject({ mag: false, waarom: 'daluren' })
    expect(magBinnen(DAL, 'noord', dinsdag(16, 1)).mag).toBe(false)
  })

  it('laat in het weekend de hele dag binnen als dat zo is ingesteld', () => {
    expect(magBinnen(DAL, 'noord', zaterdag(20)).mag).toBe(true)
    expect(magBinnen({ ...DAL, dalWeekendVrij: false }, 'noord', zaterdag(20)).mag).toBe(false)
  })
})

describe('magLesBoeken', () => {
  const les = { vestiging: 'centrum', start: dinsdag(10), eindMinuten: 11 * 60, lessenDezeWeek: 0 }

  it('weigert een vorm zonder groepslessen', () => {
    expect(magLesBoeken(CENTRUM, les)).toMatchObject({ mag: false, waarom: 'groepslessen' })
  })

  it('weigert een les die over het einde van de daluren loopt', () => {
    const uit = magLesBoeken(DAL, { ...les, start: dinsdag(15, 30), eindMinuten: 16 * 60 + 30 })
    expect(uit).toMatchObject({ mag: false, waarom: 'daluren' })
  })

  it('staat een les binnen de daluren toe', () => {
    expect(magLesBoeken(DAL, { ...les, start: dinsdag(15), eindMinuten: 16 * 60 }).mag).toBe(true)
  })

  it('houdt het maximum per week aan', () => {
    expect(magLesBoeken(STUDENT, { ...les, lessenDezeWeek: 1 }).mag).toBe(true)
    const uit = magLesBoeken(STUDENT, { ...les, lessenDezeWeek: 2 })
    expect(uit).toMatchObject({ mag: false, waarom: 'maximum' })
    expect(uit.mag ? '' : uit.reden).toContain('maximaal 2 lessen per week')
  })

  it('laat zonder vorm alles toe', () => {
    expect(magLesBoeken(null, { ...les, lessenDezeWeek: 99 }).mag).toBe(true)
  })
})

describe('binnenDaluren en momentVan', () => {
  it('geldt altijd zonder daluren', () => {
    expect(binnenDaluren(ALLES, 2, 0, 24 * 60)).toBe(true)
  })

  it('rekent op de Nederlandse klok', () => {
    // 2026-10-20 is een dinsdag; 08:30 UTC is 10:30 in Nederland (zomertijd).
    expect(momentVan(new Date('2026-10-20T08:30:00Z'))).toEqual({ weekdag: 2, minuten: 10 * 60 + 30 })
  })
})

describe('regelsTekst', () => {
  it('vat de regels kort samen', () => {
    const naam = (s: string) => (s === 'centrum' ? 'Centrum' : s)
    expect(regelsTekst(CENTRUM, naam)).toEqual(['Centrum', 'Geen groepslessen'])
    expect(regelsTekst(DAL, naam)).toEqual(['Alle vestigingen', 'Groepslessen onbeperkt', 'Daluren 09:00 tot 16:00, weekend vrij'])
    expect(regelsTekst({ ...STUDENT, maxLessenPerWeek: 1 }, naam)).toContain('Max 1 les per week')
  })
})
