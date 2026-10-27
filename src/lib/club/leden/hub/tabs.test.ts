import { describe, expect, it } from 'vitest'
import { kiesLidTab, kwamVanLid, LID_TABS, lidKaartPad, metVanLid, terugNaar } from './tabs'

const LID = '22222222-2222-4222-8222-222222222222'

describe('kiesLidTab', () => {
  it('kent alle tabbladen uit de URL', () => {
    for (const tab of LID_TABS) expect(kiesLidTab(tab)).toBe(tab)
  })

  it('valt terug op Overzicht bij iets onbekends, leegs of een lijst', () => {
    expect(kiesLidTab(undefined)).toBe('overzicht')
    expect(kiesLidTab('geld')).toBe('overzicht')
    expect(kiesLidTab(['training', 'planning'])).toBe('training')
  })

  it('toont nooit een tabblad dat deze persoon niet ziet', () => {
    expect(kiesLidTab('training', ['overzicht', 'planning'])).toBe('overzicht')
  })
})

describe('lidKaartPad', () => {
  it('zet Overzicht zonder ?tab= in de URL', () => {
    expect(lidKaartPad(LID, 'budel')).toBe(`/club/leden/${LID}?v=budel`)
  })

  it('zet het tabblad erachter', () => {
    expect(lidKaartPad(LID, 'budel', 'training')).toBe(`/club/leden/${LID}?v=budel&tab=training`)
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
