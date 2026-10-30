import { describe, expect, it } from 'vitest'
import { DAG_MS, LAATSTE_DAG, PROEFMAIL_SOORTEN, planProefmail, proefmailsAan, type ProefmailSoort } from './planner'
import { proefmailTekst, type ProefmailGegevens } from './teksten'

// Startmails na het aanmelden. Geen proefperiode meer (besluit Kane 30-10-2026).

const START = new Date('2026-11-01T09:00:00.000Z')
const dag = (n: number) => new Date(START.getTime() + n * DAG_MS)
const niets = new Set<ProefmailSoort>()

describe('proefmailsAan', () => {
  it('staat standaard uit en alleen aan met 1', () => {
    expect(proefmailsAan({})).toBe(false)
    expect(proefmailsAan({ AIYOURGYM_PROEFMAILS: 'true' })).toBe(false)
    expect(proefmailsAan({ AIYOURGYM_PROEFMAILS: '1' })).toBe(true)
  })
})

describe('planProefmail', () => {
  const plan = (n: number, verstuurd: ReadonlySet<ProefmailSoort> = niets) => planProefmail({ start: START, verstuurd, nu: dag(n) })

  it('stuurt niets op de eerste dag (dan is er de welkomstmail)', () => {
    expect(plan(0.5)).toBeNull()
    expect(plan(-1)).toBeNull()
  })

  it('volgt dag 1, 3 en 7', () => {
    expect(plan(1)).toBe('dag1')
    expect(plan(3.2)).toBe('dag3')
    expect(plan(7)).toBe('dag7')
  })

  it('stuurt nooit twee keer dezelfde', () => {
    expect(plan(1.5, new Set(['dag1']))).toBeNull()
  })

  it('slaat een gemiste tip over in plaats van alles tegelijk te sturen', () => {
    expect(plan(5)).toBe('dag3')
    expect(plan(LAATSTE_DAG)).toBeNull()
    expect(plan(30)).toBeNull()
  })

  it('stuurt niets bij een ongeldige startdatum', () => {
    expect(planProefmail({ start: new Date('x'), verstuurd: niets, nu: dag(2) })).toBeNull()
  })
})

describe('proefmailTekst', () => {
  const g: ProefmailGegevens = { voornaam: 'Mark', sportschool: 'Gym Noord', inlogUrl: 'https://aiyourgym.com/noord/inloggen' }

  it('geeft elke mail een onderwerp, de aanhef en het volgnummer', () => {
    PROEFMAIL_SOORTEN.forEach((s, i) => {
      const m = proefmailTekst(s, g)
      expect(m.onderwerp.length).toBeGreaterThan(5)
      expect(m.tekst.startsWith('Hoi Mark,')).toBe(true)
      expect(m.tekst).toContain(`mail ${i + 1} van 3`)
    })
  })

  it('noemt nergens een proefperiode', () => {
    for (const s of PROEFMAIL_SOORTEN) {
      const { onderwerp, tekst } = proefmailTekst(s, g)
      expect(`${onderwerp}\n${tekst}`.toLowerCase()).not.toMatch(/proef|gratis|trial/)
    }
  })

  it('schrijft zonder druk, streepjes of klemtoon-accenten', () => {
    for (const s of PROEFMAIL_SOORTEN) {
      const { onderwerp, tekst } = proefmailTekst(s, g)
      const alles = `${onderwerp}\n${tekst}`
      expect(alles).not.toMatch(/[–—]| - /)
      expect(alles).not.toMatch(/[éèëáóú]/)
      expect(alles.toLowerCase()).not.toMatch(/laatste kans|haast|nu of nooit|snel zijn/)
      expect(alles).not.toMatch(/wachtwoord/i)
    }
  })
})
