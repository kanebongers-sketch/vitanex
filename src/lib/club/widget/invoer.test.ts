import { describe, expect, it } from 'vitest'
import { STANDAARD_WIDGET, leesPrivacyUrl, leesWidgetAanvraag, leesWidgetInstellingen, widgetInstellingenUitRij } from './invoer'

const LES = '6f1c2a4e-1b2c-4d3e-8f9a-0b1c2d3e4f5a'
const GOED = { soort: 'proefles', lesId: LES, naam: '  Sanne   de Vries ', email: 'Sanne@Voorbeeld.nl', telefoon: '06 12345678', akkoord: true, website: '' }

describe('leesWidgetAanvraag', () => {
  it('leest een proefles en een kennismaking', () => {
    expect(leesWidgetAanvraag(GOED)).toEqual({ ok: true, waarde: { soort: 'proefles', lesId: LES, naam: 'Sanne de Vries', email: 'sanne@voorbeeld.nl', telefoon: '06 12345678' } })
    const k = leesWidgetAanvraag({ ...GOED, soort: 'kennismaking', lesId: 'onzin' })
    expect(k.ok === true && k.waarde.lesId).toBeNull()
  })

  it('honeypot ingevuld = spam, nog voor de rest', () => {
    expect(leesWidgetAanvraag({ website: 'https://spam.nl' })).toEqual({ ok: 'spam' })
  })

  it('alles is verplicht en wordt gecontroleerd', () => {
    const fouten: unknown[] = [
      null,
      [],
      'tekst',
      { ...GOED, soort: 'reservering' },
      { ...GOED, lesId: 'x' },
      { ...GOED, naam: 'S' },
      { ...GOED, naam: 'a'.repeat(121) },
      { ...GOED, email: 'geen-mail' },
      { ...GOED, email: 'a@b' },
      { ...GOED, email: 'a"<x>@b.nl' },
      { ...GOED, telefoon: '123' },
      { ...GOED, telefoon: '06-1234<script>' },
      { ...GOED, akkoord: 'true' },
      { ...GOED, akkoord: false },
    ]
    for (const f of fouten) expect(leesWidgetAanvraag(f).ok, JSON.stringify(f)).toBe(false)
  })

  it('stuurtekens worden spaties', () => {
    const u = leesWidgetAanvraag({ ...GOED, naam: 'Sanne\u0000\nde Vries' })
    expect(u.ok === true && u.waarde.naam).toBe('Sanne de Vries')
  })
})

describe('leesPrivacyUrl', () => {
  it('leeg mag, anders https', () => {
    expect(leesPrivacyUrl('')).toEqual({ ok: true, waarde: null })
    expect(leesPrivacyUrl('https://fitfactory.nl/privacy')).toEqual({ ok: true, waarde: 'https://fitfactory.nl/privacy' })
    expect(leesPrivacyUrl('http://fitfactory.nl/privacy').ok).toBe(false)
    expect(leesPrivacyUrl('javascript:alert(1)').ok).toBe(false)
    expect(leesPrivacyUrl('https://a:b@fitfactory.nl').ok).toBe(false)
    expect(leesPrivacyUrl(`https://a.nl/${'x'.repeat(300)}`).ok).toBe(false)
  })
})

describe('leesWidgetInstellingen', () => {
  const basis = { vestiging: 'budel', aan: true, domeinen: 'fitfactory.nl\nwww.fitfactory.nl', lestypeIds: [LES, LES], kleurmodus: 'licht', privacyUrl: '' }

  it('leest en ontdubbelt', () => {
    expect(leesWidgetInstellingen(basis)).toEqual({
      ok: true,
      waarde: { vestiging: 'budel', aan: true, domeinen: ['fitfactory.nl', 'www.fitfactory.nl'], lestypeIds: [LES], kleurmodus: 'licht', privacyUrl: null },
    })
  })

  it('weigert foute invoer', () => {
    for (const f of [{ ...basis, vestiging: 'Budel!' }, { ...basis, aan: 'ja' }, { ...basis, domeinen: 'http://x.nl' }, { ...basis, lestypeIds: ['x'] }, { ...basis, kleurmodus: 'paars' }, { ...basis, privacyUrl: 'http://x.nl' }]) {
      expect(leesWidgetInstellingen(f).ok, JSON.stringify(f)).toBe(false)
    }
  })
})

describe('widgetInstellingenUitRij', () => {
  it('geen rij is de standaard: uit', () => {
    expect(widgetInstellingenUitRij(null)).toEqual(STANDAARD_WIDGET)
    expect(STANDAARD_WIDGET.aan).toBe(false)
  })

  it('narrowt een rij en laat foute waarden vallen', () => {
    expect(widgetInstellingenUitRij({ aan: true, domeinen: ['fitfactory.nl'], lestype_ids: [LES, 'x'], kleurmodus: 'donker', privacy_url: 'https://fitfactory.nl/privacy' })).toEqual({
      aan: true,
      domeinen: ['fitfactory.nl'],
      lestypeIds: [LES],
      kleurmodus: 'donker',
      privacyUrl: 'https://fitfactory.nl/privacy',
    })
    expect(widgetInstellingenUitRij({ aan: 'ja', kleurmodus: 'paars' })).toEqual(STANDAARD_WIDGET)
  })
})
