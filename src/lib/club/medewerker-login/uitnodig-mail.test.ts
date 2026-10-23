import { describe, expect, it } from 'vitest'
import { stuurUitnodigMail, uitnodigMailTekst } from './uitnodig-mail'

const STREEPJES = new RegExp('[\\u2013\\u2014]| - ')

describe('uitnodiging medewerker per e-mail', () => {
  it('noemt de voornaam, de sportschool en de link', () => {
    const { onderwerp, tekst } = uitnodigMailTekst('Sanne de Vries', 'Tester5', 'https://aiyourgym.com/tester5/clubinloggen/medewerker/abc')
    expect(onderwerp).toBe('Je uitnodiging voor Tester5')
    expect(tekst).toContain('Hoi Sanne,')
    expect(tekst).toContain('https://aiyourgym.com/tester5/clubinloggen/medewerker/abc')
    expect(tekst).toContain('7 dagen')
  })

  it('heeft geen gedachtestreepjes', () => {
    const { onderwerp, tekst } = uitnodigMailTekst('Sanne', 'Tester5', 'https://x.nl/a')
    expect(STREEPJES.test(`${onderwerp} ${tekst}`)).toBe(false)
  })

  it('verstuurt niets zonder afzender en zegt dat eerlijk', async () => {
    expect(await stuurUitnodigMail({ naar: 'a@b.nl', naam: 'A', sportschool: 'S', link: 'https://x.nl' }, {})).toBe('niet_ingesteld')
    expect(await stuurUitnodigMail({ naar: 'a@b.nl', naam: 'A', sportschool: 'S', link: 'https://x.nl' }, { AIYOURGYM_RESEND_FROM: 'Club <club@x.nl>' })).toBe('niet_ingesteld')
  })
})
