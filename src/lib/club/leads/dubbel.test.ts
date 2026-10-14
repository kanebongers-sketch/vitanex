import { describe, expect, it } from 'vitest'
import { normaliseerEmail, normaliseerTelefoon, telefoonZoekpatroon, vindDubbelen } from './dubbel'

const leden = [
  { id: 'a', voornaam: 'Sanne', achternaam: 'de Vries', email: 'Sanne@Voorbeeld.nl', telefoon: '06 12 34 56 78', status: 'actief' },
  { id: 'b', voornaam: 'Lars', achternaam: 'Jansen', email: 'lars@voorbeeld.nl', telefoon: null, status: 'actief' },
  { id: 'c', voornaam: 'Emma', achternaam: 'Bakker', email: null, telefoon: '+31 6 87654321', status: 'gestopt' },
]

describe('normaliseren', () => {
  it('maakt e-mail klein en weigert iets zonder @', () => {
    expect(normaliseerEmail('  Sanne@Voorbeeld.NL ')).toBe('sanne@voorbeeld.nl')
    expect(normaliseerEmail('sanne')).toBeNull()
    expect(normaliseerEmail(null)).toBeNull()
  })

  it('maakt +31, 0031 en 06 gelijk', () => {
    expect(normaliseerTelefoon('+31 6 12345678')).toBe('0612345678')
    expect(normaliseerTelefoon('0031612345678')).toBe('0612345678')
    expect(normaliseerTelefoon('06-12345678')).toBe('0612345678')
    expect(normaliseerTelefoon('123')).toBeNull()
  })
})

describe('vindDubbelen', () => {
  it('vindt op e-mail ongeacht hoofdletters', () => {
    expect(vindDubbelen({ email: 'sanne@voorbeeld.nl', telefoon: null }, leden).map((t) => [t.lid.id, t.op])).toEqual([['a', ['email']]])
  })

  it('vindt op telefoon ongeacht notatie, en op beide', () => {
    expect(vindDubbelen({ email: null, telefoon: '0687654321' }, leden).map((t) => t.lid.id)).toEqual(['c'])
    expect(vindDubbelen({ email: 'sanne@voorbeeld.nl', telefoon: '+31612345678' }, leden)[0].op).toEqual(['email', 'telefoon'])
  })

  it('vindt niets zonder contactgegevens of zonder overeenkomst', () => {
    expect(vindDubbelen({ email: null, telefoon: null }, leden)).toEqual([])
    expect(vindDubbelen({ email: 'nieuw@voorbeeld.nl', telefoon: '0611111111' }, leden)).toEqual([])
  })
})

describe('telefoonZoekpatroon', () => {
  it('maakt een los patroon van de laatste 9 cijfers', () => {
    expect(telefoonZoekpatroon('06 12 34 56 78')).toBe('%6%1%2%3%4%5%6%7%8%')
    expect(telefoonZoekpatroon(null)).toBeNull()
  })
})

describe('treffersUitJson', () => {
  it('leest treffers terug en slaat kapotte items over', async () => {
    const { treffersUitJson } = await import('./dubbel')
    const goed = vindDubbelen({ email: 'lars@voorbeeld.nl', telefoon: null }, leden)
    expect(treffersUitJson(JSON.parse(JSON.stringify(goed)))).toEqual(goed)
    expect(treffersUitJson([{ lid: { id: 1 } }, null, 'x'])).toEqual([])
    expect(treffersUitJson(undefined)).toEqual([])
  })
})
