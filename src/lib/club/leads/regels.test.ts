import { describe, expect, it } from 'vitest'
import { dagPlus, dagVan, isDagSleutel, opvolgSnelkeuzes, opvolgStatus, proeflesStand, telLink, toonDag, vandaagOpvolgen } from './regels'
import { maakLead } from './testdata'

// Dinsdag 14 oktober 2026, 10:00 Nederlandse tijd (CEST = UTC+2).
const NU = new Date('2026-10-14T08:00:00Z')
const VANDAAG = '2026-10-14'

describe('dagen', () => {
  it('rekent in Nederlandse tijd, ook vlak na middernacht', () => {
    expect(dagVan(new Date('2026-10-13T22:30:00Z'))).toBe('2026-10-14')
  })

  it('telt dagen op over de maandgrens heen', () => {
    expect(dagPlus('2026-10-30', 3)).toBe('2026-11-02')
    expect(dagPlus('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('accepteert alleen echte datums', () => {
    expect(isDagSleutel('2026-10-14')).toBe(true)
    expect(isDagSleutel('2026-02-30')).toBe(false)
    expect(isDagSleutel('14-10-2026')).toBe(false)
  })

  it('geeft snelkeuzes morgen, over 3 dagen en volgende week', () => {
    expect(opvolgSnelkeuzes(VANDAAG).map((s) => s.dag)).toEqual(['2026-10-15', '2026-10-17', '2026-10-21'])
  })

  it('toont vandaag, morgen en gisteren als woord', () => {
    expect(toonDag(VANDAAG, VANDAAG)).toBe('vandaag')
    expect(toonDag('2026-10-15', VANDAAG)).toBe('morgen')
    expect(toonDag('2026-10-13', VANDAAG)).toBe('gisteren')
  })
})

describe('opvolgStatus', () => {
  it('is te laat als de opvolgdatum voorbij is', () => {
    expect(opvolgStatus({ status: 'contact', opvolgenOp: '2026-10-13' }, VANDAAG)).toBe('te_laat')
  })

  it('is vandaag, gepland of geen', () => {
    expect(opvolgStatus({ status: 'nieuw', opvolgenOp: VANDAAG }, VANDAAG)).toBe('vandaag')
    expect(opvolgStatus({ status: 'nieuw', opvolgenOp: '2026-10-20' }, VANDAAG)).toBe('gepland')
    expect(opvolgStatus({ status: 'nieuw', opvolgenOp: null }, VANDAAG)).toBe('geen')
  })

  it('is nooit te laat voor een afgesloten lead', () => {
    expect(opvolgStatus({ status: 'lid', opvolgenOp: '2026-10-01' }, VANDAAG)).toBe('geen')
    expect(opvolgStatus({ status: 'verloren', opvolgenOp: '2026-10-01' }, VANDAAG)).toBe('geen')
  })
})

describe('proeflesStand', () => {
  it('vraagt om een uitkomst als het tijdstip voorbij is', () => {
    expect(proeflesStand({ status: 'proefles', proeflesOp: '2026-10-13T16:00:00Z' }, NU)).toBe('uitkomst_nodig')
  })

  it('weet of de proefles vandaag of later is', () => {
    expect(proeflesStand({ status: 'proefles', proeflesOp: '2026-10-14T16:00:00Z' }, NU)).toBe('vandaag')
    expect(proeflesStand({ status: 'proefles', proeflesOp: '2026-10-16T16:00:00Z' }, NU)).toBe('komt')
    expect(proeflesStand({ status: 'contact', proeflesOp: '2026-10-14T16:00:00Z' }, NU)).toBe('geen')
  })
})

describe('vandaagOpvolgen', () => {
  it('zet uitkomsten en proeflessen bovenaan, daarna te laat en vandaag', () => {
    const leads = [
      maakLead({ naam: 'Vandaag', status: 'contact', opvolgenOp: VANDAAG }),
      maakLead({ naam: 'Te laat', status: 'nieuw', opvolgenOp: '2026-10-10' }),
      maakLead({ naam: 'Later', status: 'nieuw', opvolgenOp: '2026-10-20' }),
      maakLead({ naam: 'Proefles', status: 'proefles', proeflesOp: '2026-10-14T17:00:00Z' }),
      maakLead({ naam: 'Uitkomst', status: 'proefles', proeflesOp: '2026-10-12T17:00:00Z' }),
      maakLead({ naam: 'Lid', status: 'lid', opvolgenOp: '2026-10-01' }),
    ]
    const lijst = vandaagOpvolgen(leads, NU)
    expect(lijst.map((i) => [i.lead.naam, i.reden])).toEqual([
      ['Uitkomst', 'uitkomst'],
      ['Proefles', 'proefles'],
      ['Te laat', 'te_laat'],
      ['Vandaag', 'opvolgen'],
    ])
  })
})

describe('telLink', () => {
  it('haalt spaties en streepjes weg maar houdt de plus', () => {
    expect(telLink('+31 6 12-34 56 78')).toBe('tel:+31612345678')
  })
})

describe('leadUitJson', () => {
  it('leest een lead terug zoals de API hem geeft, en weigert onzin', async () => {
    const { leadUitJson } = await import('./model')
    const lead = maakLead({ status: 'contact', opvolgenOp: VANDAAG })
    expect(leadUitJson(JSON.parse(JSON.stringify(lead)))).toEqual(lead)
    expect(leadUitJson({ id: 'x' })).toBeNull()
  })
})
