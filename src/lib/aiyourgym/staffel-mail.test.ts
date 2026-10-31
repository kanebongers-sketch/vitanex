import { describe, expect, it } from 'vitest'
import { staffelMailTekst } from './staffel-mail'
import { staffelOverzicht } from './staffel-weergave'

describe('mail bij een andere staffel (besluit Kane 31-10-2026)', () => {
  const m = staffelMailTekst({ voornaam: 'Sanne', sportschool: 'Kernhal', vestiging: 'Budel', actieveLeden: 120, oud: 84, nieuw: 120, adres: 'https://aiyourgym.com/kernhal/club/beheer/abonnement' })

  it('noemt de vestiging, het aantal, oude en nieuwe staffel en de plek in Club, in NL en EN', () => {
    expect(m.onderwerp).toBe('Andere staffel voor Budel | New tier for Budel')
    expect(m.tekst).toContain('Hoi Sanne,')
    expect(m.tekst).toContain('120 actieve leden')
    expect(m.tekst).toContain('Tot 200 leden (was Tot 100 leden)')
    expect(m.tekst).toContain('volgende maandfactuur')
    expect(m.tekst).toContain('Up to 200 members (was Up to 100 members)')
    expect(m.tekst).toContain('https://aiyourgym.com/kernhal/club/beheer/abonnement')
  })

  it('geen bedrag, geen gedachtestreepjes en geen klemtoon-accenten', () => {
    const alles = `${m.onderwerp}${m.tekst}`
    expect(alles).not.toMatch(/€|\beuro\b/i)
    expect(alles).not.toMatch(/[–—]| - /)
    expect(alles).not.toMatch(/[éèëáàóòúù]/)
  })

  it('het overzicht per vestiging: telling, staffel en bedrag als Stripe het gaf', () => {
    const r = staffelOverzicht([{ sleutel: 'budel', naam: 'Budel' }, { sleutel: 'eersel', naam: 'Eersel' }], { budel: 84 }, new Set(['budel']), { budel: '39,00 per maand' }, 'nl')
    expect(r).toEqual([
      { sleutel: 'budel', naam: 'Budel', actieveLeden: 84, staffel: 'Tot 100 leden', bedrag: '39,00 per maand', abonnement: true },
      { sleutel: 'eersel', naam: 'Eersel', actieveLeden: 0, staffel: 'Tot 25 leden', bedrag: null, abonnement: false },
    ])
    expect(staffelOverzicht([{ sleutel: 'budel', naam: 'Budel' }], null, new Set(), {}, 'en')[0]).toMatchObject({ actieveLeden: null, staffel: null })
  })
})
