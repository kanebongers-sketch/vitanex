import { describe, expect, it } from 'vitest'
import { moment, tekstVoor, wanneer } from './sjablonen'
import { SOORTEN, type AfspraakSoort, type LesSoort } from './soorten'

const ontvanger = { voornaam: 'Sanne', sportschool: 'Fit Factory' }
const les = { naam: 'Spinning', start: '2026-10-21T17:00:00.000Z', vestigingNaam: 'Budel', instructeur: 'Joyce', wachtpositie: 3, reden: 'Instructeur ziek.' }
const afspraak = { typeNaam: 'Intake', start: '2026-10-21T07:30:00.000Z', vestigingNaam: 'Budel', trainer: 'Kane' }
const NU = new Date('2026-10-20T10:00:00.000Z')

function alle() {
  return SOORTEN.map((s) => (s.startsWith('les_') ? tekstVoor({ soort: s as LesSoort, les }, ontvanger, NU) : tekstVoor({ soort: s as AfspraakSoort, afspraak }, ontvanger, NU)))
}

describe('tijden in Europe/Amsterdam', () => {
  it('toont de Nederlandse kloktijd, ook in de wintertijd', () => {
    expect(moment('2026-10-21T17:00:00.000Z')).toBe('woensdag 21 oktober om 19:00')
    expect(moment('2026-11-03T18:00:00.000Z')).toBe('dinsdag 3 november om 19:00')
  })

  it('zegt vandaag of morgen op de Nederlandse kalender', () => {
    expect(wanneer('2026-10-20T20:30:00.000Z', NU)).toBe('vandaag om 22:30')
    // 23:30 UTC is in Nederland al de volgende dag (01:30).
    expect(wanneer('2026-10-20T23:30:00.000Z', NU)).toBe('morgen om 01:30')
    expect(wanneer('2026-10-25T09:00:00.000Z', NU)).toBe('op zondag 25 oktober om 10:00')
  })
})

describe('tekstVoor', () => {
  it('heeft voor elke soort een onderwerp, mail en korte regel', () => {
    for (const t of alle()) {
      expect(t.onderwerp.length).toBeGreaterThan(5)
      expect(t.mail).toMatch(/^Hoi Sanne,/)
      expect(t.mail).toMatch(/Fit Factory$/)
      expect(t.kort.length).toBeGreaterThan(5)
    }
  })

  it('schrijft zonder gedachtestreepjes en zonder klemtoon-accenten', () => {
    for (const t of alle()) {
      const tekst = `${t.onderwerp}\n${t.mail}\n${t.kort}`
      expect(tekst).not.toMatch(/[–—]/)
      expect(tekst).not.toMatch(/ - /)
      expect(tekst).not.toMatch(/[éèëáóúíÉ]/)
    }
  })

  it('noemt les, tijd, vestiging en plek op de wachtlijst', () => {
    const t = tekstVoor({ soort: 'les_wachtlijst', les }, ontvanger, NU)
    expect(t.mail).toContain('Spinning morgen om 19:00 in Budel is vol. Je staat op plek 3.')
  })

  it('neemt de reden van een annulering netjes over', () => {
    const t = tekstVoor({ soort: 'les_geannuleerd', les }, ontvanger, NU)
    expect(t.kort).toBe('Spinning morgen om 19:00 gaat niet door. Reden: Instructeur ziek.')
  })

  it('noemt de trainer bij een afspraak', () => {
    const t = tekstVoor({ soort: 'afspraak_geboekt', afspraak }, ontvanger, NU)
    expect(t.kort).toBe('Je afspraak staat: Intake met Kane morgen om 09:30 in Budel.')
  })
})
