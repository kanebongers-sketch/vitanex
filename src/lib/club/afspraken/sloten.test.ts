import { describe, expect, it } from 'vitest'
import type { Beschikbaarheid } from '@/lib/club/personeel/typen'
import { blokOpDag, blokUitTijden, combineer, isVrij, voegSamen, vrijeTijden, werkvensters, type SlotInvoer } from './sloten'

// Dinsdag 20 oktober 2026: zomertijd, Nederland = UTC+2.
const DINSDAG = '2026-10-20'
const OPEN = { van: '07:00', tot: '22:00' }
const M = 'mw-1'

function regel(deel: Partial<Beschikbaarheid>): Beschikbaarheid {
  return { id: 'b', medewerkerId: M, weekdag: null, datum: null, datumTot: null, beschikbaar: true, van: null, tot: null, reden: null, notitie: null, ...deel }
}

function invoer(deel: Partial<SlotInvoer> = {}): SlotInvoer {
  return { datum: DINSDAG, duurMin: 60, bufferMin: 0, vensters: [{ van: 9 * 60, tot: 12 * 60 }], bezet: [], vanaf: null, ...deel }
}

describe('voegSamen', () => {
  it('voegt overlappende en aansluitende vensters samen en sorteert', () => {
    // Arrange
    const lijst = [{ van: 600, tot: 700 }, { van: 100, tot: 200 }, { van: 200, tot: 300 }, { van: 650, tot: 800 }]
    // Act
    const uit = voegSamen(lijst)
    // Assert
    expect(uit).toEqual([{ van: 100, tot: 300 }, { van: 600, tot: 800 }])
  })

  it('laat lege vensters weg', () => {
    expect(voegSamen([{ van: 300, tot: 300 }])).toEqual([])
  })
})

describe('werkvensters', () => {
  it('geeft de hele openingstijd als er niets is ingesteld', () => {
    expect(werkvensters(M, DINSDAG, OPEN, [])).toEqual([{ van: 420, tot: 1320 }])
  })

  it('geeft niets als de vestiging dicht is', () => {
    expect(werkvensters(M, DINSDAG, null, [])).toEqual([])
  })

  it('beperkt tot de vaste tijden op die weekdag', () => {
    // Arrange: dinsdag = weekdag 2, alleen 16:00 tot 22:00
    const regels = [regel({ weekdag: 2, van: '16:00', tot: '22:00' })]
    // Act + Assert
    expect(werkvensters(M, DINSDAG, OPEN, regels)).toEqual([{ van: 960, tot: 1320 }])
  })

  it('knipt vaste tijden af op de openingstijd', () => {
    const regels = [regel({ weekdag: 2, van: '05:00', tot: '23:30' })]
    expect(werkvensters(M, DINSDAG, OPEN, regels)).toEqual([{ van: 420, tot: 1320 }])
  })

  it('geeft niets bij een vaste niet-beschikbare weekdag', () => {
    expect(werkvensters(M, DINSDAG, OPEN, [regel({ weekdag: 2, beschikbaar: false })])).toEqual([])
  })

  it('laat een losse datum (verlof) voor de vaste weekdag gaan', () => {
    const regels = [regel({ weekdag: 2, van: '16:00', tot: '22:00' }), regel({ datum: '2026-10-19', datumTot: '2026-10-21', beschikbaar: false, reden: 'verlof' })]
    expect(werkvensters(M, DINSDAG, OPEN, regels)).toEqual([])
  })

  it('negeert regels van andere medewerkers en andere weekdagen', () => {
    const regels = [regel({ medewerkerId: 'ander', weekdag: 2, beschikbaar: false }), regel({ weekdag: 3, beschikbaar: false })]
    expect(werkvensters(M, DINSDAG, OPEN, regels)).toEqual([{ van: 420, tot: 1320 }])
  })

  it('voegt twee blokken op een dag samen tot losse vensters', () => {
    const regels = [regel({ weekdag: 2, van: '07:00', tot: '10:00' }), regel({ weekdag: 2, van: '18:00', tot: '21:00' })]
    expect(werkvensters(M, DINSDAG, OPEN, regels)).toEqual([{ van: 420, tot: 600 }, { van: 1080, tot: 1260 }])
  })
})

describe('blokOpDag', () => {
  it('zet UTC-tijden om naar minuten op de Nederlandse klok', () => {
    // 08:00 UTC = 10:00 in Nederland (zomertijd)
    expect(blokOpDag(DINSDAG, '2026-10-20T08:00:00.000Z', '2026-10-20T09:15:00.000Z')).toEqual({ van: 600, tot: 675 })
  })

  it('geeft null voor een andere dag', () => {
    expect(blokOpDag(DINSDAG, '2026-10-21T08:00:00.000Z', '2026-10-21T09:00:00.000Z')).toBeNull()
  })

  it('knipt een blok over middernacht af op deze dag', () => {
    // 21:00 UTC = 23:00 NL tot 23:30 UTC = 01:30 NL de volgende dag
    expect(blokOpDag(DINSDAG, '2026-10-20T21:00:00.000Z', '2026-10-20T23:30:00.000Z')).toEqual({ van: 1380, tot: 1440 })
  })

  it('rekent in de winter met UTC+1', () => {
    expect(blokOpDag('2026-11-03', '2026-11-03T09:00:00.000Z', '2026-11-03T10:00:00.000Z')).toEqual({ van: 600, tot: 660 })
  })
})

describe('blokUitTijden', () => {
  it('maakt van null de hele dag', () => {
    expect(blokUitTijden(null, null)).toEqual({ van: 0, tot: 1440 })
  })

  it('gebruikt de kloktijden', () => {
    expect(blokUitTijden('19:00', '20:00')).toEqual({ van: 1140, tot: 1200 })
  })
})

describe('vrijeTijden', () => {
  it('geeft elk kwartier waarin de afspraak past', () => {
    expect(vrijeTijden(invoer())).toEqual(['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00'])
  })

  it('slaat tijden over die een bestaande afspraak raken', () => {
    // Arrange: 10:00 tot 10:30 bezet
    const inv = invoer({ bezet: [{ van: 600, tot: 630 }] })
    // Act
    const uit = vrijeTijden(inv)
    // Assert: 09:00 eindigt precies om 10:00 (mag), 10:30 begint precies na afloop (mag)
    expect(uit).toEqual(['09:00', '10:30', '10:45', '11:00'])
  })

  it('houdt rekening met de eigen buffer na afloop', () => {
    // 60 min plus 15 min buffer: 09:00 zou tot 10:15 bezet zijn en raakt 10:00
    const inv = invoer({ bufferMin: 15, bezet: [{ van: 600, tot: 630 }] })
    expect(vrijeTijden(inv)).toEqual(['10:30', '10:45', '11:00'])
  })

  it('laat de buffer na sluiten wel toe', () => {
    const inv = invoer({ bufferMin: 30 })
    expect(vrijeTijden(inv)).toContain('11:00')
  })

  it('geeft niets als de afspraak nergens in past', () => {
    expect(vrijeTijden(invoer({ duurMin: 240 }))).toEqual([])
  })

  it('begint op een kwartier, ook als het venster scheef begint', () => {
    const inv = invoer({ vensters: [{ van: 9 * 60 + 5, tot: 10 * 60 + 30 }], duurMin: 30 })
    expect(vrijeTijden(inv)).toEqual(['09:15', '09:30', '09:45', '10:00'])
  })

  it('volgt de grens vanaf (in UTC)', () => {
    // vanaf 08:20 UTC = 10:20 NL: eerste tijd 10:30
    const inv = invoer({ vanaf: new Date('2026-10-20T08:20:00.000Z') })
    expect(vrijeTijden(inv)[0]).toBe('10:30')
  })

  it('volgt de grens tot', () => {
    const inv = invoer({ tot: new Date('2026-10-20T07:30:00.000Z') })
    expect(vrijeTijden(inv)).toEqual(['09:00', '09:15', '09:30'])
  })

  it('gebruikt een andere stap als die is opgegeven', () => {
    expect(vrijeTijden(invoer({ stapMin: 30 }))).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00'])
  })

  it('combineert meerdere vensters zonder dubbelen', () => {
    const inv = invoer({ duurMin: 30, vensters: [{ van: 540, tot: 600 }, { van: 960, tot: 1020 }] })
    expect(vrijeTijden(inv)).toEqual(['09:00', '09:15', '09:30', '16:00', '16:15', '16:30'])
  })
})

describe('isVrij', () => {
  it('accepteert een tijd buiten het kwartierraster als hij past', () => {
    expect(isVrij('09:05', invoer())).toBe(true)
  })

  it('weigert een tijd die een bezette periode raakt', () => {
    expect(isVrij('09:30', invoer({ bezet: [{ van: 600, tot: 630 }] }))).toBe(false)
  })

  it('weigert een tijd buiten het venster', () => {
    expect(isVrij('11:30', invoer())).toBe(false)
  })
})

describe('combineer', () => {
  it('voegt de tijden van alle trainers samen, op volgorde', () => {
    // Arrange
    const kandidaten = [
      { medewerkerId: 'a', tijden: ['10:00', '09:00'], aantalOpDag: 0 },
      { medewerkerId: 'b', tijden: ['09:30'], aantalOpDag: 0 },
    ]
    // Act
    const uit = combineer(kandidaten)
    // Assert
    expect(uit.map((s) => s.tijd)).toEqual(['09:00', '09:30', '10:00'])
  })

  it('geeft een gedeelde tijd aan de trainer met de minste afspraken', () => {
    const uit = combineer([
      { medewerkerId: 'druk', tijden: ['09:00'], aantalOpDag: 4 },
      { medewerkerId: 'rustig', tijden: ['09:00'], aantalOpDag: 1 },
    ])
    expect(uit).toEqual([{ tijd: '09:00', medewerkerId: 'rustig' }])
  })

  it('kiest bij gelijkspel de eerste in de lijst', () => {
    const uit = combineer([
      { medewerkerId: 'eerste', tijden: ['09:00'], aantalOpDag: 2 },
      { medewerkerId: 'tweede', tijden: ['09:00'], aantalOpDag: 2 },
    ])
    expect(uit[0].medewerkerId).toBe('eerste')
  })

  it('geeft niets zonder kandidaten', () => {
    expect(combineer([])).toEqual([])
  })
})
