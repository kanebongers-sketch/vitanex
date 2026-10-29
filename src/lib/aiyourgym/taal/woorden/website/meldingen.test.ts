import { describe, expect, it } from 'vitest'
import { leesAanmelding } from '@/lib/aiyourgym/aanmelding'
import { leesDemoAanvraag } from '@/lib/aiyourgym/demo-aanvraag'
import { leesPrijsAanvraag } from '@/lib/aiyourgym/prijs-aanvraag'
import { NIET_OPEN } from '@/lib/aiyourgym/config'
import { wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { leesSlug } from '@/lib/club/kern/subdomein'
import { foutenIn, heeftVertaling, kiesMeldingen, meldingIn, metEngels } from './meldingen'

// Elke melding die de controles van de website kunnen geven, heeft een Engelse
// vertaling. Komt er een nieuwe melding bij zonder vertaling, dan faalt dit.

function alleFouten(): string[] {
  const lang = 'x'.repeat(200)
  const invoer: unknown[] = [
    {},
    { pakket: 'start', sportschoolNaam: 'a', aantalVestigingen: 9, slug: '-x', eigenaarNaam: lang, eigenaarEmail: 'x', eigenaarTelefoon: '1', wachtwoord: 'kort', wachtwoordHerhaal: 'anders' },
    { pakket: 'club', sportschoolNaam: '<b>', aantalVestigingen: 99, slug: 'a--b', wachtwoord: 'x'.repeat(200) },
    { pakket: 'start', slug: 'club', wachtwoord: 'aaaaaaaaaaaaaaa' },
    { slug: 'goede-naam', wachtwoord: 'mijnwachtwoord123!' },
    { eigenaarNaam: 'Jan Jansen', eigenaarEmail: 'jan@voorbeeld.nl', wachtwoord: 'janjansen-1234' },
    { wachtwoord: 'abcdefghijklm' },
  ]
  const uit: string[] = []
  for (const b of invoer) {
    const a = leesAanmelding(b)
    if (!a.ok) uit.push(...Object.values(a.fouten).filter((x): x is string => typeof x === 'string'))
    const d = leesDemoAanvraag({ ...(b as object), opmerking: '<x>', vestigingen: 900 })
    if (!d.ok) uit.push(...Object.values(d.fouten).filter((x): x is string => typeof x === 'string'))
    const p = leesPrijsAanvraag(b)
    if (!p.ok) uit.push(...Object.values(p.fouten).filter((x): x is string => typeof x === 'string'))
  }
  for (const w of ['', 'kort', 'x'.repeat(200), 'aaaaaaaaaaaaaaa', 'password12345!', 'abcdefghijklm']) {
    const f = wachtwoordFout(w)
    if (f) uit.push(f)
  }
  for (const s of ['-x', 'a--b', 'club']) {
    const r = leesSlug(s)
    if (!r.ok) uit.push(r.fout)
  }
  return [...new Set(uit)]
}

describe('foutmeldingen in het Engels', () => {
  it('vindt genoeg meldingen om te controleren', () => {
    expect(alleFouten().length).toBeGreaterThanOrEqual(15)
  })

  it.each(alleFouten())('"%s" heeft een vertaling', (nl) => {
    expect(heeftVertaling(nl)).toBe(true)
    expect(meldingIn(nl, 'en')).not.toMatch(/[–—]| - | [,.;:!?]/)
  })

  it('vertaalt meldingen met een getal en laat onbekende Nederlands', () => {
    expect(meldingIn('Maximaal 60 tekens.', 'en')).toBe('No more than 60 characters.')
    expect(meldingIn('Kies 1 tot 3 vestigingen.', 'en')).toBe('Choose 1 to 3 locations.')
    expect(meldingIn(`${NIET_OPEN} We hebben je gegevens ontvangen en nemen zelf contact met je op.`, 'en')).toMatch(/^Sign-up is not open yet\./)
    expect(meldingIn('Iets nieuws.', 'en')).toBe('Iets nieuws.')
    expect(meldingIn('Kies een pakket.', 'nl')).toBe('Kies een pakket.')
  })

  it('geeft API-antwoorden in beide talen en de browser kiest de goede', () => {
    const json = metEngels({ fout: 'Controleer de gemarkeerde velden.', fouten: { slug: 'Dit adres is al bezet. Kies een ander.' } })
    expect(json.fout).toBe('Controleer de gemarkeerde velden.')
    expect(json.en?.fouten?.slug).toBe('This address is already taken. Choose another one.')
    expect(kiesMeldingen(json, 'en').fout).toBe('Please check the highlighted fields.')
    expect(kiesMeldingen(json, 'nl').fouten?.slug).toBe('Dit adres is al bezet. Kies een ander.')
    // Zonder `en` (bijvoorbeeld een API van Club) vertaalt de browser zelf.
    expect(kiesMeldingen({ fout: 'Het verzoek is te groot.' }, 'en').fout).toBe('The request is too large.')
    expect(kiesMeldingen(null, 'en')).toEqual({})
    expect(foutenIn({ akkoord: 'Kies minstens een pakket.' }, 'en')).toEqual({ akkoord: 'Choose at least one package.' })
  })
})
