import { describe, expect, it } from 'vitest'
import { embedCode, frameAncestors, kaderUitJson, leesDomein, leesDomeinen, leesWidgetPad, widgetCsp, widgetOrigin, widgetPad } from './kader'

describe('leesWidgetPad', () => {
  it('herkent alleen /widget/<sportschool>/<vestiging>/rooster', () => {
    expect(leesWidgetPad('/widget/fitfactory/budel/rooster')).toEqual({ sportschool: 'fitfactory', vestiging: 'budel' })
    expect(leesWidgetPad('/widget/fit-factory/eindhoven_tongelre/rooster/')).toEqual({ sportschool: 'fit-factory', vestiging: 'eindhoven_tongelre' })
    expect(leesWidgetPad(widgetPad('voorbeeldgym', 'centrum'))).toEqual({ sportschool: 'voorbeeldgym', vestiging: 'centrum' })
  })

  it('weigert al het andere', () => {
    for (const p of ['/widget/aiyourgym-widget.js', '/widget/Fit/budel/rooster', '/widget/fitfactory/budel', '/widget/fitfactory/budel/rooster/x', '/widget/../x/rooster', '/widget/-a/budel/rooster']) {
      expect(leesWidgetPad(p), p).toBeNull()
    }
  })
})

describe('leesDomein', () => {
  it('maakt van wat de sportschool intypt een kale https-host', () => {
    expect(leesDomein('https://www.FitFactory.nl/')).toEqual({ ok: true, domein: 'www.fitfactory.nl' })
    expect(leesDomein(' fitfactory.nl ')).toEqual({ ok: true, domein: 'fitfactory.nl' })
    expect(leesDomein('*.fitfactory.nl')).toEqual({ ok: true, domein: '*.fitfactory.nl' })
  })

  it('weigert alles waarmee de CSP te misbruiken is', () => {
    for (const d of ['http://fitfactory.nl', 'fitfactory.nl/pagina', "fitfactory.nl 'unsafe-inline'", 'fitfactory.nl;script-src *', 'fitfactory.nl:8080', 'localhost', '*', '*.nl.', 'javascript:alert(1)', 'fit_factory.nl', '-a.nl', '1.2.3.4', '']) {
      expect(leesDomein(d).ok, d).toBe(false)
    }
    expect(leesDomein(42).ok).toBe(false)
  })
})

describe('leesDomeinen', () => {
  it('leest een lijst of tekst met regels en komma\'s, uniek', () => {
    expect(leesDomeinen('fitfactory.nl\nwww.fitfactory.nl, fitfactory.nl\n\n')).toEqual({ ok: true, domeinen: ['fitfactory.nl', 'www.fitfactory.nl'] })
    expect(leesDomeinen([])).toEqual({ ok: true, domeinen: [] })
  })

  it('maximaal 10 en een fout domein maakt alles fout', () => {
    expect(leesDomeinen(Array.from({ length: 11 }, (_, i) => `a${i}.nl`)).ok).toBe(false)
    expect(leesDomeinen(['fitfactory.nl', 'http://x.nl']).ok).toBe(false)
    expect(leesDomeinen(5).ok).toBe(false)
  })
})

describe('frameAncestors (de headers-beslissing)', () => {
  const aan = { aan: true, domeinen: ['fitfactory.nl', '*.fitfactory.nl'] }

  it('schakelaar uit, onbekend of widget uit: alleen onze eigen site (voorvertoning)', () => {
    expect(frameAncestors(false, aan)).toBe("'self'")
    expect(frameAncestors(true, null)).toBe("'self'")
    expect(frameAncestors(true, { aan: false, domeinen: ['fitfactory.nl'] })).toBe("'self'")
  })

  it('aan zonder domeinen: elke site', () => {
    expect(frameAncestors(true, { aan: true, domeinen: [] })).toBe('*')
  })

  it('aan met domeinen: alleen die, altijd via https, plus onze eigen site', () => {
    expect(frameAncestors(true, aan)).toBe("'self' https://fitfactory.nl https://*.fitfactory.nl")
  })
})

describe('widgetCsp', () => {
  it('zet frame-ancestors en blijft verder streng', () => {
    const csp = widgetCsp("'self' https://fitfactory.nl", true)
    expect(csp).toContain("frame-ancestors 'self' https://fitfactory.nl")
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("connect-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).not.toContain('unsafe-eval')
    expect(widgetCsp("'self'", false)).toContain('unsafe-eval')
  })
})

describe('kaderUitJson', () => {
  it('narrowt het antwoord van de database en filtert foute domeinen', () => {
    expect(kaderUitJson({ aan: true, domeinen: ['fitfactory.nl', "x.nl 'unsafe-inline'"] })).toEqual({ aan: true, domeinen: ['fitfactory.nl'] })
    expect(kaderUitJson(null)).toBeNull()
    expect(kaderUitJson({ aan: 'ja', domeinen: [] })).toBeNull()
    expect(kaderUitJson([])).toBeNull()
  })
})

describe('embedCode en widgetOrigin', () => {
  it('maakt de regel om te plakken', () => {
    expect(embedCode('https://fitfactorypt.nl/', 'fitfactory', 'budel')).toBe(
      '<script src="https://fitfactorypt.nl/widget/aiyourgym-widget.js" data-sportschool="fitfactory" data-vestiging="budel" async></script>',
    )
  })

  it('https, behalve lokaal; rare hosts geven null', () => {
    expect(widgetOrigin('fitfactorypt.nl')).toBe('https://fitfactorypt.nl')
    expect(widgetOrigin('localhost:3000')).toBe('http://localhost:3000')
    expect(widgetOrigin('fitfactory.club.localhost:3000')).toBe('http://fitfactory.club.localhost:3000')
    expect(widgetOrigin('evil.nl"><script>')).toBeNull()
    expect(widgetOrigin(null)).toBeNull()
  })
})
