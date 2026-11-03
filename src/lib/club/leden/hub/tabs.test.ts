import { describe, expect, it } from 'vitest'
import { isOudAdres, KAART_TABS, kiesKaartPlek, kiesLidTab, kwamVanLid, lidKaartPad, metVanLid, plekVan, terugNaar } from './tabs'

const LID = '22222222-2222-4222-8222-222222222222'

describe('drie tabbladen', () => {
  it('de kaart heeft Overzicht, Training en Lidmaatschap', () => {
    expect(KAART_TABS).toEqual(['overzicht', 'training', 'lidmaatschap'])
  })
})

describe('kiesLidTab en kiesKaartPlek', () => {
  it('kent de drie tabbladen uit de URL', () => {
    for (const tab of KAART_TABS) expect(kiesLidTab(tab)).toBe(tab)
  })

  it('valt terug op Overzicht bij iets onbekends, leegs of een lijst', () => {
    expect(kiesLidTab(undefined)).toBe('overzicht')
    expect(kiesLidTab('geld')).toBe('overzicht')
    expect(kiesLidTab('toString')).toBe('overzicht')
    expect(kiesLidTab(['training', 'overzicht'])).toBe('training')
  })

  it('toont nooit een tabblad dat deze persoon niet ziet', () => {
    expect(kiesLidTab('training', ['overzicht', 'lidmaatschap'])).toBe('overzicht')
    expect(kiesKaartPlek('privacy', ['overzicht'])).toEqual({ tab: 'overzicht', anker: null })
  })

  it('oude tabbladen openen het juiste tabblad op het juiste anker', () => {
    expect(kiesKaartPlek('planning')).toEqual({ tab: 'overzicht', anker: 'planning' })
    expect(kiesKaartPlek('contact')).toEqual({ tab: 'overzicht', anker: 'notities' })
    expect(kiesKaartPlek('privacy')).toEqual({ tab: 'lidmaatschap', anker: 'privacy' })
    expect(kiesKaartPlek('training')).toEqual({ tab: 'training', anker: null })
  })

  it('herkent een oud adres', () => {
    expect(isOudAdres('planning')).toBe(true)
    expect(isOudAdres(['contact'])).toBe(true)
    expect(isOudAdres('training')).toBe(false)
    expect(isOudAdres(undefined)).toBe(false)
  })

  it('plekVan geeft een nieuw object (geen gedeelde constante)', () => {
    const a = plekVan('privacy')
    expect(a).toEqual({ tab: 'lidmaatschap', anker: 'privacy' })
    expect(a).not.toBe(plekVan('privacy'))
  })
})

describe('lidKaartPad', () => {
  it('zet Overzicht zonder ?tab= in de URL', () => {
    expect(lidKaartPad(LID, 'budel')).toBe(`/club/leden/${LID}?v=budel`)
  })

  it('zet het tabblad erachter', () => {
    expect(lidKaartPad(LID, 'budel', 'training')).toBe(`/club/leden/${LID}?v=budel&tab=training`)
  })

  it('maakt van een oude tabnaam het nieuwe adres met anker', () => {
    expect(lidKaartPad(LID, 'budel', 'planning')).toBe(`/club/leden/${LID}?v=budel#planning`)
    expect(lidKaartPad(LID, 'budel', 'contact')).toBe(`/club/leden/${LID}?v=budel#notities`)
    expect(lidKaartPad(LID, 'budel', 'privacy')).toBe(`/club/leden/${LID}?v=budel&tab=lidmaatschap#privacy`)
  })

  it('een eigen anker gaat voor', () => {
    expect(lidKaartPad(LID, 'budel', 'overzicht', 'les-boeken')).toBe(`/club/leden/${LID}?v=budel#les-boeken`)
    expect(lidKaartPad(LID, 'budel', 'planning', 'afspraken')).toBe(`/club/leden/${LID}?v=budel#afspraken`)
  })

  it('codeert het id', () => {
    expect(lidKaartPad('a/b', 'budel')).toBe('/club/leden/a%2Fb?v=budel')
  })
})

describe('van=lid', () => {
  it('voegt van=lid toe en houdt de rest van de zoekstring', () => {
    expect(metVanLid('/club/training/intake?v=budel&lid=x')).toBe('/club/training/intake?v=budel&lid=x&van=lid')
    expect(metVanLid('/club/training/schema/__id__?v=budel')).toBe('/club/training/schema/__id__?v=budel&van=lid')
    expect(metVanLid('/club/training')).toBe('/club/training?van=lid')
  })

  it('zet van=lid maar een keer', () => {
    expect(metVanLid(metVanLid('/club/x?v=budel'))).toBe('/club/x?v=budel&van=lid')
  })

  it('herkent alleen precies van=lid', () => {
    expect(kwamVanLid('lid')).toBe(true)
    expect(kwamVanLid(['lid'])).toBe(true)
    expect(kwamVanLid('training')).toBe(false)
    expect(kwamVanLid(undefined)).toBe(false)
  })
})

describe('terugNaar', () => {
  const basis = { vanLid: true, magLeden: true, lidId: LID, vestiging: 'budel', tab: 'training' as const, anders: '/club/training?v=budel' }

  it('gaat terug naar het tabblad van het lid als de actie daar begon', () => {
    expect(terugNaar(basis)).toBe(`/club/leden/${LID}?v=budel&tab=training`)
  })

  it('neemt de eigen weg zonder van=lid, zonder recht op Leden of zonder lid', () => {
    expect(terugNaar({ ...basis, vanLid: false })).toBe(basis.anders)
    expect(terugNaar({ ...basis, magLeden: false })).toBe(basis.anders)
    expect(terugNaar({ ...basis, lidId: null })).toBe(basis.anders)
  })
})
