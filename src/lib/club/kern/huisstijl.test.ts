import { describe, expect, it } from 'vitest'
import { bruikbaarAccent, contrast, huisstijlVariabelen, inktOp, meng, MIN_CONTRAST_ACCENT, THEMA_BASIS } from './huisstijl'
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
    expect(leesHuisstijl(goed)).toEqual({ ok: true, waarde: { naam: 'Gym Noord', slogan: null, kleurAccent: '#E5484D', thema: 'licht', uit: ['rooster'] } })
  })

  it('weigert lege naam, foute kleur, onbekend thema of onderdeel, en alles uit', () => {
    expect(leesHuisstijl({ ...goed, naam: ' ' }).ok).toBe(false)
    expect(leesHuisstijl({ ...goed, kleurAccent: 'red' }).ok).toBe(false)
    expect(leesHuisstijl({ ...goed, thema: 'paars' }).ok).toBe(false)
    expect(leesHuisstijl({ ...goed, uit: ['kassa'] }).ok).toBe(false)
    expect(leesHuisstijl({ ...goed, uit: ['leden', 'checkin', 'rooster', 'personeel', 'taken', 'leads', 'training', 'cijfers', 'app'] }).ok).toBe(false)
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
    expect(o).toEqual({ id, naam: 'Fit Factory', slogan: null, logo: null, kleurAccent: '#B58E5C', thema: 'donker', uit: ['leads'], demo: true, slug: null })
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
