import { describe, expect, it } from 'vitest'
import { basisVoor, bruikbaarAccent, contrast, huisstijlAutoCss, huisstijlVariabelen, inktOp, meng, mengMet, MIN_CONTRAST_ACCENT, MIN_CONTRAST_VLAK, THEMA_BASIS, themaVan } from './huisstijl'
import { controleerLogo, isVeiligeSvg, leesHuisstijl, modulesNaarJson } from './organisatie-invoer'
import { modulesUit, organisatieUitRij } from './organisatie'

describe('contrast en kleuren', () => {
  it('rekent het WCAG-contrast uit', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
    expect(contrast('#B58E5C', '#0A0B09')).toBeGreaterThan(6)
  })

  it('houdt de eigen kleur op vlakken zolang die 3:1 haalt', () => {
    expect(huisstijlVariabelen('#E5484D', 'licht')['--brand']).toBe('#E5484D')
    expect(huisstijlVariabelen('#E5484D', 'licht')['--brand-tekst']).not.toBe('#E5484D')
  })

  it('laat een goede accentkleur ongemoeid', () => {
    expect(bruikbaarAccent('#B58E5C', 'donker')).toEqual({ kleur: '#B58E5C', aangepast: false })
  })

  it('maakt een te donker accent lichter op donker en een te licht accent donkerder op licht', () => {
    const donker = bruikbaarAccent('#1A1A40', 'donker')
    expect(donker.aangepast).toBe(true)
    expect(contrast(donker.kleur, THEMA_BASIS.donker.bgApp)).toBeGreaterThanOrEqual(MIN_CONTRAST_ACCENT)
    const licht = bruikbaarAccent('#FFE08A', 'licht')
    expect(licht.aangepast).toBe(true)
    expect(contrast(licht.kleur, THEMA_BASIS.licht.bgApp)).toBeGreaterThanOrEqual(MIN_CONTRAST_ACCENT)
  })

  it('kiest zwart of wit voor tekst op het accent', () => {
    expect(inktOp('#FFE08A')).toBe('#0A0B09')
    expect(inktOp('#2D2DA0')).toBe('#FFFFFF')
  })

  it('mengt naar wit en zwart', () => {
    expect(meng('#000000', 1)).toBe('#FFFFFF')
    expect(meng('#FFFFFF', -1)).toBe('#000000')
  })

  it('geeft alle variabelen per thema, met leesbare statuskleuren op licht', () => {
    const donker = huisstijlVariabelen('#B58E5C', 'donker')
    expect(donker['--brand']).toBe('#B58E5C')
    expect(donker['--bg-app']).toBe('#0A0B09')
    expect(donker['--club-ok']).toBeUndefined()
    const licht = huisstijlVariabelen('#B58E5C', 'licht')
    expect(licht['--bg-app']).toBe('#F4F3EF')
    expect(contrast(licht['--club-ok'], '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
    // Ook op het zachte statusvlak (chip) leesbaar.
    expect(contrast(licht['--club-ok'], '#E6EFE9')).toBeGreaterThanOrEqual(4.5)
    expect(contrast(licht['--club-let-op'], '#FFFFFF')).toBeGreaterThanOrEqual(4.5)
    expect(huisstijlVariabelen('rood', 'donker')['--brand']).toBe('#B58E5C')
  })
})

describe('huisstijl-invoer', () => {
  const goed = { naam: '  Gym  Noord ', slogan: '', kleurAccent: '#e5484d', thema: 'licht', uit: ['rooster', 'rooster'] }

  it('leest en schoont geldige invoer', () => {
    expect(leesHuisstijl(goed)).toEqual({ ok: true, waarde: { naam: 'Gym Noord', slogan: null, kleurAccent: '#E5484D', thema: 'licht', kleurTweede: null, kleurTint: null, variant: 'licht', uit: ['rooster'] } })
  })

  it('weigert lege naam, foute kleur, onbekend thema of onderdeel, en alles uit', () => {
    expect(leesHuisstijl({ ...goed, naam: ' ' }).ok).toBe(false)
    expect(leesHuisstijl({ ...goed, kleurAccent: 'red' }).ok).toBe(false)
    expect(leesHuisstijl({ ...goed, thema: 'paars' }).ok).toBe(false)
    expect(leesHuisstijl({ ...goed, uit: ['kassa'] }).ok).toBe(false)
    expect(leesHuisstijl({ ...goed, uit: ['leden', 'checkin', 'rooster', 'afspraken', 'personeel', 'taken', 'leads', 'training', 'cijfers', 'app'] }).ok).toBe(false)
  })

  it('zet onderdelen om naar en van jsonb', () => {
    expect(modulesNaarJson(['rooster', 'leads'])).toEqual({ rooster: false, leads: false })
    expect(modulesUit({ rooster: false, leads: true, kassa: false })).toEqual(['rooster'])
    expect(modulesUit(null)).toEqual([])
  })

  it('controleert logo-type en grootte', () => {
    expect(controleerLogo('image/png', 2000)).toEqual({ ok: true, waarde: 'png' })
    expect(controleerLogo('image/gif', 2000).ok).toBe(false)
    expect(controleerLogo('image/png', 2 * 1024 * 1024).ok).toBe(false)
  })

  it('weigert een SVG met scripts of verwijzingen naar buiten', () => {
    expect(isVeiligeSvg('<svg viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>')).toBe(true)
    expect(isVeiligeSvg('<svg><script>alert(1)</script></svg>')).toBe(false)
    expect(isVeiligeSvg('<svg onload="x()"></svg>')).toBe(false)
    expect(isVeiligeSvg('<svg><image href="https://x.nl/a.png"/></svg>')).toBe(false)
    expect(isVeiligeSvg('<svg><a xlink:href="javascript:x"/></svg>')).toBe(false)
    expect(isVeiligeSvg('geen svg')).toBe(false)
    expect(isVeiligeSvg('<svg/onload=alert(1)>')).toBe(false)
    expect(isVeiligeSvg('<svg><a href="&#106;avascript:x"/></svg>')).toBe(false)
    expect(isVeiligeSvg('<svg><style>@import url(https://x)</style></svg>')).toBe(false)
    expect(isVeiligeSvg('<svg><use href="#a"/></svg>')).toBe(false)
    expect(isVeiligeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 2"><rect width="2" height="2" fill="#B58E5C"/><g transform="scale(1)"><circle r="1"/></g></svg>')).toBe(true)
  })

  it('controleert de eerste bytes van een afbeelding', async () => {
    const { heeftJuisteKop } = await import('./organisatie-invoer')
    expect(heeftJuisteKop(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]), 'png')).toBe(true)
    expect(heeftJuisteKop(new Uint8Array([0x3c, 0x68, 0x74, 0x6d]), 'png')).toBe(false)
    expect(heeftJuisteKop(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), 'jpg')).toBe(true)
  })
})

describe('organisatieUitRij', () => {
  const id = '67b0a700-3f1d-425e-9646-98c237e34fd7'
  it('leest een rij en vangt foute waarden af', () => {
    const o = organisatieUitRij({ id, naam: 'Fit Factory', slogan: '', logo: '../../etc', kleur_accent: 'rood', thema: 'neon', modules: { leads: false }, demo: true })
    expect(o).toMatchObject({ id, naam: 'Fit Factory', slogan: null, logo: null, kleurAccent: '#B58E5C', thema: 'donker', uit: ['leads'], demo: true, slug: null })
    expect(o?.instellingen.ledenapp.qr).toBe(true)
  })
  it('weigert een rij zonder geldig id of naam', () => {
    expect(organisatieUitRij({ id: 'x', naam: 'A' })).toBeNull()
    expect(organisatieUitRij({ id, naam: ' ' })).toBeNull()
  })
})

describe('leesbaarheid van de tekstladder', () => {
  /** Een rgba-inkt over een achtergrond naar een effectieve hex-kleur. */
  function opAchtergrond(rgba: string, bg: string): string {
    const [r, g, b, a] = rgba.match(/[\d.]+/g)!.map(Number)
    const achter = parseInt(bg.slice(1), 16)
    const meng = (v: number, w: number) => Math.round(v * a + w * (1 - a)).toString(16).padStart(2, '0')
    return `#${meng(r, (achter >> 16) & 255)}${meng(g, (achter >> 8) & 255)}${meng(b, achter & 255)}`
  }

  it.each(['donker', 'licht'] as const)('kleine tekst haalt 4.5:1 op het %s thema', (thema) => {
    const v = huisstijlVariabelen('#B58E5C', thema)
    for (const token of ['--text-1', '--text-2', '--text-3', '--text-4']) {
      for (const bg of [v['--bg-app'], v['--bg-card']]) expect(contrast(opAchtergrond(v[token], bg), bg)).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('accent als tekst', () => {
  const STARTKLEUREN = ['#B58E5C', '#E8A33F', '#E5484D', '#FF6B3D', '#30A46C', '#3E63DD', '#8E4EC6', '#12A594']
  it.each(['donker', 'licht'] as const)('elke startkleur is als tekst leesbaar op het %s thema', (thema) => {
    for (const k of STARTKLEUREN) {
      const v = huisstijlVariabelen(k, thema)
      for (const bg of [THEMA_BASIS[thema].bgApp, THEMA_BASIS[thema].bgCard]) {
        expect(contrast(v['--brand-tekst'], bg)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(v['--brand'], bg)).toBeGreaterThanOrEqual(3)
        expect(contrast(v['--brand-inkt'], v['--brand'])).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})

describe('tekst op een accentknop', () => {
  it('is altijd minstens 4.5:1, ook bij een middentoon', () => {
    for (const kleur of ['#2F6BFF', '#3E63DD', '#E5484D', '#12A594', '#B58E5C', '#C9F03E', '#7C3AED', '#FF6B3D']) {
      for (const thema of ['donker', 'licht'] as const) {
        const v = huisstijlVariabelen(kleur, thema)
        expect(contrast(v['--brand'], v['--brand-inkt'])).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})

describe('drie kleuren en meer thema\'s (besluit Kane 30-10-2026)', () => {
  const alle = ['donker', 'diepzwart', 'grafiet', 'licht', 'zacht', 'auto'] as const
  const kleuren = ['#B58E5C', '#FFE14D', '#1E2A78', '#30A46C', '#000000', '#FFFFFF']
  const tinten = [null, '#C8A27A', '#5B7BD5', '#C46B6B', '#FF00FF']

  it('elk thema met elke tint: hoofd- en tweede kleur halten het contrast', () => {
    for (const variant of alle) {
      for (const tint of tinten) {
        const basis = basisVoor(variant, tint)
        for (const k of kleuren) {
          const v = huisstijlVariabelen('#B58E5C', themaVan(variant), { tweede: k, tint, variant })
          expect(Math.min(contrast(v['--brand-2'], basis.bgApp), contrast(v['--brand-2'], basis.bgCard))).toBeGreaterThanOrEqual(MIN_CONTRAST_VLAK)
          expect(Math.min(contrast(v['--brand-2-tekst'], basis.bgApp), contrast(v['--brand-2-tekst'], basis.bgCard))).toBeGreaterThanOrEqual(MIN_CONTRAST_ACCENT)
          expect(v['--bg-app']).toBe(basis.bgApp)
        }
      }
    }
  })

  it('tekst blijft leesbaar op een getinte achtergrond (4.5:1 voor tekst 1 en 2)', () => {
    for (const variant of alle) {
      for (const tint of tinten) {
        const basis = basisVoor(variant, tint)
        const inkt = basis.inkt === '255, 255, 255' ? '#FFFFFF' : '#11110F'
        // tekst-2 is inkt op 74 tot 78 procent: benaderd met een menging naar de achtergrond.
        const tekst2 = mengMet(inkt, basis.bgCard, 0.26)
        expect(contrast(tekst2, basis.bgApp)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(tekst2, basis.bgCard)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('zonder tweede kleur is de tweede kleur de hoofdkleur; zonder tint de gewone vlakken', () => {
    const v = huisstijlVariabelen('#3E63DD', 'donker')
    expect(v['--brand-2']).toBe(v['--brand'])
    expect(v['--bg-app']).toBe(THEMA_BASIS.donker.bgApp)
  })

  it('themaVan en de vlakken per thema', () => {
    expect(themaVan('zacht')).toBe('licht')
    expect(themaVan('diepzwart')).toBe('donker')
    expect(themaVan('auto')).toBe('donker')
    expect(huisstijlVariabelen('#B58E5C', 'donker', { variant: 'diepzwart' })['--bg-app']).toBe('#000000')
    expect(huisstijlVariabelen('#B58E5C', 'licht', { variant: 'zacht' }).colorScheme).toBe('light')
  })

  it('Automatisch: alleen onze eigen waarden in de CSS, licht in een media query', () => {
    const css = huisstijlAutoCss('#B58E5C', { tweede: '#30A46C', tint: '#C8A27A', variant: 'auto' })
    expect(css.startsWith('@media (prefers-color-scheme: light){[data-huisstijl-auto]{')).toBe(true)
    expect(css).toContain('color-scheme:light !important')
    expect(css).not.toMatch(/[<>{]\s*script|url\(|expression/i)
  })
})

describe('leesHuisstijl met drie kleuren', () => {
  const basis = { naam: 'Tester5', slogan: '', kleurAccent: '#B58E5C', uit: [] }
  it('neemt thema, tweede kleur en tint over; thema volgt de variant', () => {
    const u = leesHuisstijl({ ...basis, variant: 'zacht', kleurTweede: '#30a46c', kleurTint: '' })
    expect(u).toMatchObject({ ok: true, waarde: { variant: 'zacht', thema: 'licht', kleurTweede: '#30A46C', kleurTint: null } })
  })
  it('oude invoer met alleen thema werkt nog', () => {
    expect(leesHuisstijl({ ...basis, thema: 'licht' })).toMatchObject({ ok: true, waarde: { variant: 'licht', thema: 'licht', kleurTweede: null } })
  })
  it('weigert een onbekend thema of een kapotte kleur', () => {
    expect(leesHuisstijl({ ...basis, variant: 'neon' })).toMatchObject({ ok: false })
    expect(leesHuisstijl({ ...basis, variant: 'donker', kleurTint: 'rood' })).toMatchObject({ ok: false })
  })
  it('leest de nieuwe kolommen uit de rij', () => {
    const o = organisatieUitRij({ id: 'de000000-0000-4000-8000-0000000000c1', naam: 'X', kleur_accent: '#B58E5C', thema: 'donker', kleur_tweede: '#30a46c', kleur_tint: 'fout', thema_variant: 'grafiet' })
    expect(o).toMatchObject({ kleurTweede: '#30A46C', kleurTint: null, variant: 'grafiet' })
    expect(organisatieUitRij({ id: 'de000000-0000-4000-8000-0000000000c1', naam: 'X', thema: 'licht' })?.variant).toBe('licht')
  })
})
