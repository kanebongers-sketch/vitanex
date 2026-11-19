import { describe, expect, it } from 'vitest'
import { demoMeldingMail, hulpMeldingMail, meldingOntvangers, onderwerpDeel } from './aanvraag-melding'
import type { DemoAanvraag } from './demo-aanvraag'

const DEMO: DemoAanvraag = {
  naam: 'Mark de Vries',
  sportschool: 'Kernhal',
  email: 'mark@kernhal.nl',
  telefoon: '0612345678',
  vestigingen: 2,
  soort: 'zelfstandig',
  moment: 'ochtend',
  opmerking: 'Graag na 10 uur.',
}

describe('aanvraag-melding', () => {
  it('demo-aanvraag: alle gegevens en de link naar het overzicht', () => {
    // Arrange en Act
    const m = demoMeldingMail(DEMO, false, 'https://aiyourgym.com/club/platform')
    // Assert
    expect(m.onderwerp).toBe('Demo-aanvraag: Kernhal')
    for (const stuk of ['Mark de Vries', 'mark@kernhal.nl', '0612345678', 'Vestigingen: 2', 'Zelfstandige sportschool', 'Voorkeur: Ochtend', 'Graag na 10 uur.', 'https://aiyourgym.com/club/platform']) {
      expect(m.tekst).toContain(stuk)
    }
  })

  it('prijsaanvraag: eigen onderwerp en geen voorkeursmoment', () => {
    const m = demoMeldingMail({ ...DEMO, moment: 'maakt-niet-uit', opmerking: 'Prijs op maat. Leden: 250 tot 750.' }, true, 'https://x')
    expect(m.onderwerp).toBe('Prijsaanvraag: Kernhal')
    expect(m.tekst).not.toContain('Voorkeur')
    expect(m.tekst).toContain('Prijs op maat.')
  })

  it('hulpmelding: soort, sportschool, melder en de beschrijving', () => {
    const m = hulpMeldingMail(
      { soort: 'probleem', onderwerp: 'Rooster laadt niet', beschrijving: 'Na inloggen blijft het rooster leeg.', pagina: '/club/rooster' },
      { sportschool: 'Kernhal', melder: 'Lisa' },
      'https://aiyourgym.com/club/hulp/meldingen',
    )
    expect(m.onderwerp).toBe('Probleem van Kernhal: Rooster laadt niet')
    expect(m.tekst).toContain('Van: Lisa')
    expect(m.tekst).toContain('Pagina: /club/rooster')
    expect(m.tekst).toContain('Na inloggen blijft het rooster leeg.')
  })

  it('onderwerp: geen regeleinden (kopinjectie) en ingekort', () => {
    expect(onderwerpDeel('Gym\r\nBcc: x@y.nl')).toBe('Gym Bcc: x@y.nl')
    expect(onderwerpDeel('a'.repeat(100)).length).toBe(60)
    const m = demoMeldingMail({ ...DEMO, sportschool: 'Gym\nX' }, false, 'https://x')
    expect(m.onderwerp).not.toMatch(/[\r\n]/)
  })

  it('schrijfstijl: geen gedachtestreepjes in de vaste teksten', () => {
    const teksten = [demoMeldingMail(DEMO, false, 'u'), demoMeldingMail(DEMO, true, 'u'), hulpMeldingMail({ soort: 'wens', onderwerp: 'o', beschrijving: 'b', pagina: null }, { sportschool: 's', melder: 'm' }, 'u')]
    for (const t of teksten) expect(`${t.onderwerp}\n${t.tekst}`).not.toMatch(/[–—]| - /)
  })

  it('ontvangers: eigen instelling gaat voor, anders de platform-accounts', () => {
    expect(meldingOntvangers({ AIYOURGYM_MELDINGEN_AAN: 'A@b.nl, fout, c@d.nl' }, ['p@q.nl'])).toEqual(['a@b.nl', 'c@d.nl'])
    expect(meldingOntvangers({}, ['P@q.nl', 'p@q.nl'])).toEqual(['p@q.nl'])
    expect(meldingOntvangers({ AIYOURGYM_MELDINGEN_AAN: 'geen-adres' }, ['p@q.nl'])).toEqual(['p@q.nl'])
    expect(meldingOntvangers({}, [])).toEqual([])
  })
})
