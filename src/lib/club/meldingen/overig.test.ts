import { describe, expect, it } from 'vitest'
import { mailHtml, platteTekst } from './mail-html'
import { geledenLabel, ledenappMeldingUitRij } from './model'
import { duurLabel, instellingenUitRij, leesInstellingenInvoer, STANDAARD_INSTELLINGEN } from './soorten'

describe('instellingen', () => {
  it('valt terug op de standaard bij een lege of kapotte rij', () => {
    expect(instellingenUitRij(null)).toEqual(STANDAARD_INSTELLINGEN)
    expect(instellingenUitRij({ uit: ['les_geboekt', 'onzin'], les_herinnering_min: 60 })).toEqual({ uit: ['les_geboekt'], lesHerinneringMin: 60, afspraakHerinneringMin: 1440 })
  })

  it('accepteert alleen geldige soorten en herinnertijden', () => {
    expect(leesInstellingenInvoer({ uit: ['les_herinnering'], lesHerinneringMin: 120, afspraakHerinneringMin: 1440 }).ok).toBe(true)
    expect(leesInstellingenInvoer({ uit: ['iets'], lesHerinneringMin: 120, afspraakHerinneringMin: 1440 }).ok).toBe(false)
    expect(leesInstellingenInvoer({ uit: [], lesHerinneringMin: 7, afspraakHerinneringMin: 1440 }).ok).toBe(false)
    expect(leesInstellingenInvoer(null).ok).toBe(false)
  })

  it('schrijft de duur leesbaar', () => {
    expect(duurLabel(120)).toBe('2 uur')
    expect(duurLabel(30)).toBe('30 minuten')
    expect(duurLabel(1440)).toBe('1 dag')
    expect(duurLabel(2880)).toBe('2 dagen')
  })
})

describe('mail', () => {
  const huisstijl = { naam: 'Fit <Factory>', logoUrl: null, accent: '#B58E5C', donker: true }

  it('ontsnapt tekst en toont de naam als woordmerk zonder logo', () => {
    const html = mailHtml(huisstijl, { tekst: 'Hoi <b>Sanne</b>,\n\nTot zo.', knop: null, afmeldUrl: null })
    expect(html).toContain('Fit &lt;Factory&gt;')
    expect(html).toContain('Hoi &lt;b&gt;Sanne&lt;/b&gt;,')
    expect(html).not.toContain('<b>Sanne</b>')
  })

  it('zet alleen https-links in de mail', () => {
    const html = mailHtml({ ...huisstijl, logoUrl: 'javascript:alert(1)' }, { tekst: 'x', knop: null, afmeldUrl: 'http://onveilig.nl' })
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('onveilig')
  })

  it('zet de afmeldlink in de html en de platte tekst', () => {
    const inhoud = { tekst: 'Hoi', knop: null, afmeldUrl: 'https://fitfactorypt.nl/api/club-afmelden/abc' }
    expect(mailHtml(huisstijl, inhoud)).toContain('href="https://fitfactorypt.nl/api/club-afmelden/abc"')
    expect(platteTekst(inhoud)).toContain('Meld je af: https://fitfactorypt.nl/api/club-afmelden/abc')
  })
})

describe('ledenapp', () => {
  it('leest een rij en weigert kapotte rijen', () => {
    const rij = { id: 'm1', soort: 'les_geboekt', onderwerp: 'O', inhoud: 'I', verstuurd_op: '2026-10-20T10:00:00.000Z', gelezen_op: null }
    expect(ledenappMeldingUitRij(rij)).toEqual({ id: 'm1', soort: 'les_geboekt', onderwerp: 'O', inhoud: 'I', op: '2026-10-20T10:00:00.000Z', gelezen: false })
    expect(ledenappMeldingUitRij({ ...rij, soort: 'onbekend' })).toBeNull()
    expect(ledenappMeldingUitRij({ ...rij, verstuurd_op: null })).toBeNull()
  })

  it('zegt hoe lang geleden', () => {
    const nu = new Date('2026-10-20T12:00:00.000Z')
    expect(geledenLabel('2026-10-20T11:59:30.000Z', nu)).toBe('zojuist')
    expect(geledenLabel('2026-10-20T11:30:00.000Z', nu)).toBe('30 minuten geleden')
    expect(geledenLabel('2026-10-20T09:00:00.000Z', nu)).toBe('3 uur geleden')
    expect(geledenLabel('2026-10-19T09:00:00.000Z', nu)).toBe('gisteren')
  })
})
