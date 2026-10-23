import { describe, expect, it } from 'vitest'
import { PROEFMAIL_SOORTEN, planProefmail, proefmailsAan, vensters, type ProefmailSoort } from './planner'
import { DAG_MS, proefTeller, proefTotVan } from './proefperiode'
import { proefmailTekst, type ProefmailGegevens } from './teksten'
import type { StripeAbonnement } from '../abonnement'

const START = new Date('2026-11-01T09:00:00.000Z')
const EINDE = new Date(START.getTime() + 14 * DAG_MS)
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
  const plan = (n: number, verstuurd: ReadonlySet<ProefmailSoort> = niets) => planProefmail({ start: START, einde: EINDE, verstuurd, nu: dag(n) })

  it('stuurt niets op de eerste dag (dan is er de welkomstmail)', () => {
    expect(plan(0.5)).toBeNull()
  })

  it('volgt dag 1, 3, 7 en de herinnering', () => {
    expect(plan(1)).toBe('dag1')
    expect(plan(3.2)).toBe('dag3')
    expect(plan(7)).toBe('dag7')
    expect(plan(11)).toBe('einde')
    expect(plan(13.9)).toBe('einde')
  })

  it('stuurt nooit twee keer dezelfde', () => {
    expect(plan(1.5, new Set(['dag1']))).toBeNull()
  })

  it('slaat een gemiste tip over in plaats van alles tegelijk te sturen', () => {
    expect(plan(5)).toBe('dag3')
    expect(plan(10.5)).toBeNull()
  })

  it('stuurt niets na het einde of zonder bekend einde', () => {
    expect(plan(14)).toBeNull()
    expect(planProefmail({ start: START, einde: null, verstuurd: niets, nu: dag(11) })).toBeNull()
  })

  it('laat een tip nooit doorlopen in de herinnering bij een korte proefperiode', () => {
    const kort = new Date(START.getTime() + 8 * DAG_MS)
    const v = vensters(START.getTime(), kort.getTime())
    const herinnering = v.find((x) => x.soort === 'einde')
    expect(v.filter((x) => x.soort !== 'einde').every((x) => x.tot <= (herinnering?.van ?? 0))).toBe(true)
    expect(planProefmail({ start: START, einde: kort, verstuurd: niets, nu: dag(7) })).toBe('einde')
  })
})

describe('proefTotVan en proefTeller', () => {
  const stripe = (status: string, proefTot: Date | null): StripeAbonnement => ({ status, proefTot, periodeTot: null, stoptOp: null, stoptAanEindPeriode: false, aantal: 1 })

  it('zonder Stripe: aanmelding plus de proefdagen', () => {
    expect(proefTotVan({ status: 'actief', aangemaaktOp: START.toISOString(), metStripe: false }, null)?.toISOString()).toBe(EINDE.toISOString())
  })

  it('met Stripe: alleen het einde dat Stripe noemt, zolang het trialing is', () => {
    const eigen = dag(15)
    expect(proefTotVan({ status: 'actief', aangemaaktOp: START.toISOString(), metStripe: true }, stripe('trialing', eigen))).toBe(eigen)
    expect(proefTotVan({ status: 'actief', aangemaaktOp: START.toISOString(), metStripe: true }, stripe('active', eigen))).toBeNull()
    expect(proefTotVan({ status: 'actief', aangemaaktOp: START.toISOString(), metStripe: true }, null)).toBeNull()
  })

  it('geen proefperiode voor een testaccount of opgezegde sportschool', () => {
    expect(proefTotVan({ status: 'test', aangemaaktOp: START.toISOString(), metStripe: false }, null)).toBeNull()
    expect(proefTotVan({ status: 'opgezegd', aangemaaktOp: START.toISOString(), metStripe: false }, null)).toBeNull()
  })

  it('toont rustig de datum en de dagen', () => {
    expect(proefTeller(EINDE, dag(5))).toEqual({ kop: 'Proefperiode tot 15 november 2026', dagen: 'nog 9 dagen' })
    expect(proefTeller(EINDE, dag(13.5))?.dagen).toBe('nog een dag')
    expect(proefTeller(EINDE, dag(14))).toBeNull()
    expect(proefTeller(null, dag(1))).toBeNull()
  })
})

describe('proefmailTekst', () => {
  const g: ProefmailGegevens = { voornaam: 'Mark', sportschool: 'Gym Noord', inlogUrl: 'https://aiyourgym.com/noord/inloggen', abonnementUrl: 'https://aiyourgym.com/noord/club/beheer/abonnement', einde: EINDE, metBetaling: true }

  it('geeft elke mail een onderwerp, de aanhef en het volgnummer', () => {
    PROEFMAIL_SOORTEN.forEach((s, i) => {
      const m = proefmailTekst(s, g)
      expect(m.onderwerp.length).toBeGreaterThan(5)
      expect(m.tekst.startsWith('Hoi Mark,')).toBe(true)
      expect(m.tekst).toContain(`mail ${i + 1} van 4`)
    })
  })

  it('zegt in de herinnering eerlijk wat er gebeurt, met en zonder betaling', () => {
    expect(proefmailTekst('einde', g).tekst).toContain('volgt de eerste betaling vanzelf')
    expect(proefmailTekst('einde', g).tekst).toContain(g.abonnementUrl)
    expect(proefmailTekst('einde', { ...g, metBetaling: false }).tekst).toContain('er wordt niets afgeschreven')
  })

  it('schrijft zonder druk, streepjes of klemtoon-accenten', () => {
    for (const s of PROEFMAIL_SOORTEN) {
      for (const metBetaling of [true, false]) {
        const { onderwerp, tekst } = proefmailTekst(s, { ...g, metBetaling })
        const alles = `${onderwerp}\n${tekst}`
        expect(alles).not.toMatch(/[–—]| - /)
        expect(alles).not.toMatch(/[éèëáóú]/)
        expect(alles.toLowerCase()).not.toMatch(/laatste kans|haast|nu of nooit|snel zijn/)
        expect(alles).not.toMatch(/wachtwoord/i)
      }
    }
  })
})
