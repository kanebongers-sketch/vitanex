import { describe, expect, it } from 'vitest'
import { eersteStapMetPrijsFout, isPrijsAanvraag, leesPrijsAanvraag, prijsFoutenVanStap, PRIJS_LEDEN, PRIJS_PAKKETTEN } from './prijs-aanvraag'

const GOED = {
  doel: 'prijs',
  soort: 'boutique',
  pakket: 'club',
  vestigingen: '2',
  leden: '250-750',
  naam: 'Sam de Vries',
  sportschool: 'Sterk Gym',
  email: 'sam@sterkgym.nl',
  telefoon: '06 12345678',
  akkoord: true,
}

describe('leesPrijsAanvraag', () => {
  it('maakt een gewone aanvraag met pakket en leden in de opmerking', () => {
    const uit = leesPrijsAanvraag(GOED)
    expect(uit.ok).toBe(true)
    if (!uit.ok) return
    expect(uit.waarde).toMatchObject({ soort: 'boutique', vestigingen: 2, moment: 'maakt-niet-uit', opmerking: 'Prijs op maat. Pakket: Club. Leden: 250 tot 750.' })
  })
  it('negeert een meegestuurde opmerking en een ander moment', () => {
    const uit = leesPrijsAanvraag({ ...GOED, opmerking: '<script>', moment: 'avond' })
    expect(uit.ok && uit.waarde.opmerking?.startsWith('Prijs op maat.')).toBe(true)
    expect(uit.ok && uit.waarde.moment).toBe('maakt-niet-uit')
  })
  it('geeft fouten per veld en de eerste stap met een fout', () => {
    const uit = leesPrijsAanvraag({ ...GOED, pakket: 'goud', leden: '', email: 'x' })
    expect(uit.ok).toBe(false)
    if (uit.ok) return
    expect(Object.keys(uit.fouten).sort()).toEqual(['email', 'leden', 'pakket'])
    expect(eersteStapMetPrijsFout(uit.fouten)).toBe(0)
    expect(prijsFoutenVanStap(1, uit.fouten)).toEqual({ leden: uit.fouten.leden })
  })
  it('herkent alleen verzoeken van het prijsformulier', () => {
    expect(isPrijsAanvraag(GOED)).toBe(true)
    expect(isPrijsAanvraag({ ...GOED, doel: 'demo' })).toBe(false)
    expect(isPrijsAanvraag(null)).toBe(false)
  })
  it('noemt nergens een bedrag en houdt zich aan de schrijfregels', () => {
    const tekst = JSON.stringify({ PRIJS_PAKKETTEN, PRIJS_LEDEN })
    expect(tekst).not.toMatch(/€|euro|[–—]| - /i)
  })
})
