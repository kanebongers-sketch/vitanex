import { describe, expect, it } from 'vitest'
import { aygIndexeren } from './schakelaar'
import { moetNoindex, robotsRegels } from './indexeren'

describe('aygIndexeren', () => {
  it('staat standaard uit en alleen aan met precies 1', () => {
    expect(aygIndexeren({})).toBe(false)
    expect(aygIndexeren({ AIYOURGYM_INDEXEREN: 'true' })).toBe(false)
    expect(aygIndexeren({ AIYOURGYM_INDEXEREN: '1' })).toBe(true)
  })
  it('hangt niet af van de site-schakelaar', () => {
    expect(aygIndexeren({ AIYOURGYM_SITE_ACTIEF: '1' })).toBe(false)
  })
})

describe('moetNoindex', () => {
  it('schermt de website af op elke host zolang indexeren uit staat', () => {
    expect(moetNoindex('fitfactorypt.nl', '/aiyourgym', false)).toBe(true)
    expect(moetNoindex('fitfactorypt.nl', '/aiyourgym/functies', false)).toBe(true)
    expect(moetNoindex('fitfactorypt.nl', '/api/aiyourgym/demo-aanvraag', false)).toBe(true)
    expect(moetNoindex('aiyourgym.com', '/', false)).toBe(true)
    expect(moetNoindex('www.aiyourgym.com:443', '/prijzen', false)).toBe(true)
  })
  it('raakt andere paden en hosts niet', () => {
    expect(moetNoindex('releasev.nl', '/', false)).toBe(false)
    expect(moetNoindex('fitfactorypt.nl', '/aiyourgymx', false)).toBe(false)
    expect(moetNoindex('fitfactorypt.nl', '/club', false)).toBe(false)
  })
  it('laat alles door als indexeren aan staat', () => {
    expect(moetNoindex('aiyourgym.com', '/', true)).toBe(false)
    expect(moetNoindex('fitfactorypt.nl', '/aiyourgym', true)).toBe(false)
  })
})

describe('robotsRegels', () => {
  it('schermt aiyourgym.com helemaal af zolang indexeren uit staat', () => {
    expect(robotsRegels('aiyourgym.com', false)).toEqual({ rules: { userAgent: '*', disallow: '/' } })
    expect(robotsRegels('www.aiyourgym.com', false)).toEqual({ rules: { userAgent: '*', disallow: '/' } })
  })
  it('laat andere domeinen crawlen (daar regelt de noindex-kop het)', () => {
    expect(robotsRegels('fitfactorypt.nl', false)).toEqual({ rules: { userAgent: '*', allow: '/' } })
    expect(robotsRegels(null, false)).toEqual({ rules: { userAgent: '*', allow: '/' } })
  })
  it('opent aiyourgym.com als indexeren aan staat', () => {
    expect(robotsRegels('aiyourgym.com', true)).toEqual({ rules: { userAgent: '*', allow: '/' } })
  })
})
