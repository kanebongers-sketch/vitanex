import { describe, expect, it } from 'vitest'
import { hernoemTag, ledenMetLabel, ledenMetVorm, ledenTekst, losseAbonnementen, losseTags, telLeden, verwijderTag } from './tellen'

const LEDEN = [
  { abonnement: 'All-in 12 maanden', tags: ['pt-interesse', 'nieuw'] },
  { abonnement: 'all-in  12 maanden', tags: ['nieuw'] },
  { abonnement: 'All-in 12 maanden', tags: [] },
  { abonnement: 'Student', tags: ['pt-interesse', 'pt-interesse'] },
  { abonnement: null, tags: ['Ongeldig Label'] },
  { abonnement: '  ', tags: [] },
]

describe('telLeden', () => {
  it('telt abonnementen ongeacht hoofdletters en spaties', () => {
    // Act
    const t = telLeden(LEDEN)
    // Assert
    expect(ledenMetVorm(t, { naam: 'ALL-IN 12 MAANDEN' })).toBe(3)
    expect(ledenMetVorm(t, { naam: 'Student' })).toBe(1)
    expect(ledenMetVorm(t, { naam: 'Senior' })).toBe(0)
    expect(t.leden).toBe(6)
  })

  it('telt een tag een keer per lid', () => {
    const t = telLeden(LEDEN)
    expect(ledenMetLabel(t, { naam: 'pt-interesse' })).toBe(2)
    expect(ledenMetLabel(t, { naam: 'nieuw' })).toBe(2)
  })

  it('onthoudt de meest gebruikte schrijfwijze van een abonnement', () => {
    const t = telLeden(LEDEN)
    expect(t.naamPerAbonnement.get('all-in 12 maanden')).toBe('All-in 12 maanden')
  })
})

describe('losseAbonnementen en losseTags', () => {
  it('geeft abonnementen zonder vorm, meeste leden eerst', () => {
    const t = telLeden(LEDEN)
    expect(losseAbonnementen(t, [])).toEqual([
      { naam: 'All-in 12 maanden', leden: 3 },
      { naam: 'Student', leden: 1 },
    ])
    expect(losseAbonnementen(t, [{ naam: 'all-in 12 MAANDEN' }])).toEqual([{ naam: 'Student', leden: 1 }])
  })

  it('geeft alleen geldige tags zonder label', () => {
    const t = telLeden(LEDEN)
    expect(losseTags(t, [{ naam: 'nieuw' }])).toEqual([{ naam: 'pt-interesse', leden: 2 }])
  })
})

describe('hernoemTag en verwijderTag', () => {
  it('hernoemt op dezelfde plek', () => {
    expect(hernoemTag(['a', 'oud', 'b'], 'oud', 'nieuw')).toEqual(['a', 'nieuw', 'b'])
  })

  it('maakt nooit een dubbele tag', () => {
    expect(hernoemTag(['nieuw', 'oud', 'b'], 'oud', 'nieuw')).toEqual(['nieuw', 'b'])
  })

  it('laat tags zonder het label ongemoeid', () => {
    const tags = ['a', 'b']
    expect(hernoemTag(tags, 'oud', 'nieuw')).toEqual(['a', 'b'])
    expect(tags).toEqual(['a', 'b'])
  })

  it('verwijdert alleen dat label', () => {
    expect(verwijderTag(['a', 'weg', 'b'], 'weg')).toEqual(['a', 'b'])
  })
})

describe('ledenTekst', () => {
  it('schrijft enkelvoud en meervoud', () => {
    expect(ledenTekst(1)).toBe('1 lid')
    expect(ledenTekst(0)).toBe('0 leden')
  })
})
