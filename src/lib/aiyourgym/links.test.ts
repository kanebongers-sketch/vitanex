import { describe, expect, it } from 'vitest'
import { checkoutAdressen, oorsprongVan, portaalLink } from './links'
import { naamMetAdres } from './sportschool-naam'

const CODE = 'abcdefghijklmnopqrstuvwx'

describe('oorsprongVan', () => {
  it('https, behalve lokaal', () => {
    expect(oorsprongVan('aiyourgym.com')).toBe('https://aiyourgym.com')
    expect(oorsprongVan('aiyourgym.localhost:3000')).toBe('http://aiyourgym.localhost:3000')
    expect(oorsprongVan('evil.nl/pad')).toBeNull()
    expect(oorsprongVan('evil.nl')).toBeNull()
    expect(oorsprongVan('aiyourgym.com.evil.nl')).toBeNull()
    expect(oorsprongVan('fitfactorypt.nl')).toBe('https://fitfactorypt.nl')
    expect(oorsprongVan('')).toBeNull()
  })
})

describe('checkoutAdressen', () => {
  it('op aiyourgym.com zonder voorvoegsel, elders met', () => {
    expect(checkoutAdressen('https://aiyourgym.com', 'aiyourgym.com', true).succes).toBe('https://aiyourgym.com/welkom?sessie={CHECKOUT_SESSION_ID}')
    expect(checkoutAdressen('https://fitfactorypt.nl', 'fitfactorypt.nl', false)).toEqual({
      succes: 'https://fitfactorypt.nl/aiyourgym/welkom?sessie={CHECKOUT_SESSION_ID}',
      terug: 'https://fitfactorypt.nl/aiyourgym/aanmelden?geannuleerd=1',
    })
  })
  it('met de site aan altijd terug naar aiyourgym.com, nooit naar een ander domein', () => {
    expect(checkoutAdressen('https://fitfactorypt.nl', 'fitfactorypt.nl', true)).toEqual({
      succes: 'https://aiyourgym.com/welkom?sessie={CHECKOUT_SESSION_ID}',
      terug: 'https://aiyourgym.com/aanmelden?geannuleerd=1',
    })
    expect(checkoutAdressen('http://localhost:3000', 'localhost:3000', true).succes).toBe('http://localhost:3000/aiyourgym/welkom?sessie={CHECKOUT_SESSION_ID}')
  })
})

describe('portaalLink', () => {
  const basis = { code: CODE, slug: 'sterk', subdomeinenAan: false, portaalUrl: null, oorsprong: 'https://fitfactorypt.nl', host: 'fitfactorypt.nl', siteAan: false }
  it('met subdomeinen op het eigen adres', () => {
    expect(portaalLink({ ...basis, subdomeinenAan: true })).toBe(`https://sterk.aiyourgym.com/clubinloggen/${CODE}`)
  })
  it('anders de ingestelde portaal-url, of de app zelf', () => {
    expect(portaalLink({ ...basis, portaalUrl: 'https://app.voorbeeld.nl/' })).toBe(`https://app.voorbeeld.nl/clubinloggen/${CODE}`)
    expect(portaalLink(basis)).toBe(`https://fitfactorypt.nl/clubinloggen/${CODE}`)
  })
  it('op aiyourgym.com zonder subdomeinen of portaal-url geen link (bestaat daar niet)', () => {
    expect(portaalLink({ ...basis, oorsprong: 'https://aiyourgym.com', host: 'aiyourgym.com' })).toBeNull()
    expect(portaalLink({ ...basis, portaalUrl: 'javascript:alert(1)', oorsprong: null })).toBeNull()
  })
  it('met de site aan nooit een link buiten AI Your Gym', () => {
    const aan = { ...basis, siteAan: true }
    expect(portaalLink(aan)).toBeNull()
    expect(portaalLink({ ...aan, portaalUrl: 'https://fitfactorypt.nl' })).toBeNull()
    expect(portaalLink({ ...aan, portaalUrl: 'https://aiyourgym.com.evil.nl' })).toBeNull()
    expect(portaalLink({ ...aan, portaalUrl: 'https://app.aiyourgym.com/' })).toBe(`https://app.aiyourgym.com/clubinloggen/${CODE}`)
    expect(portaalLink({ ...aan, subdomeinenAan: true })).toBe(`https://sterk.aiyourgym.com/clubinloggen/${CODE}`)
    expect(portaalLink({ ...aan, oorsprong: 'http://localhost:3000', host: 'localhost:3000' })).toBe(`http://localhost:3000/clubinloggen/${CODE}`)
  })
})

describe('naamMetAdres', () => {
  it('blijft binnen 60 tekens', () => {
    expect(naamMetAdres('Sterk Gym', 'sterkgym')).toBe('Sterk Gym (sterkgym)')
    expect(naamMetAdres('x'.repeat(60), 'sterkgym').length).toBe(60)
  })
})
