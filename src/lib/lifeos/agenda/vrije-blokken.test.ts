import { describe, it, expect } from 'vitest'
import {
  vrijeBlokken,
  werkVenster,
  eerstvolgendeAfspraak,
  looptNu,
  WERKUREN,
  MIN_BLOK_MINUTEN,
  type Afspraak,
} from './vrije-blokken'

// De dag waarop alles zich afspeelt. Lokale tijd: de tests construeren én lezen
// lokaal, dus ze vallen in elke tijdzone hetzelfde uit.
const DAG = new Date(2026, 6, 15) // 15 juli 2026

function tijd(uur: number, minuut = 0): Date {
  return new Date(2026, 6, 15, uur, minuut, 0, 0)
}

function afspraak(
  id: string,
  vanUur: number,
  vanMin: number,
  totUur: number,
  totMin: number,
): Afspraak {
  return {
    id,
    titel: id,
    startOp: tijd(vanUur, vanMin),
    eindOp: tijd(totUur, totMin),
    heleDag: false,
    locatie: null,
  }
}

const VENSTER = werkVenster(DAG)

describe('werkVenster', () => {
  it('spant 08:00 tot 20:00 rond de gegeven dag', () => {
    // Arrange
    const dag = new Date(2026, 6, 15, 13, 37) // het uur van de dag doet niet mee

    // Act
    const venster = werkVenster(dag)

    // Assert
    expect(venster.startOp.getHours()).toBe(WERKUREN.vanUur)
    expect(venster.startOp.getMinutes()).toBe(0)
    expect(venster.eindOp.getHours()).toBe(WERKUREN.totUur)
    expect(venster.startOp.getDate()).toBe(15)
  })

  it('laat andere werkuren toe zonder de default aan te raken', () => {
    const venster = werkVenster(DAG, { vanUur: 6, totUur: 12 })

    expect(venster.startOp.getHours()).toBe(6)
    expect(venster.eindOp.getHours()).toBe(12)
    expect(WERKUREN.vanUur).toBe(8) // niet gemuteerd
  })
})

describe('vrijeBlokken — geen afspraken', () => {
  it('geeft het hele werkvenster als één blok: een vrije dag is geen lege staat', () => {
    // Arrange
    const events: Afspraak[] = []

    // Act
    const blokken = vrijeBlokken(events, VENSTER)

    // Assert
    expect(blokken).toHaveLength(1)
    expect(blokken[0]?.startOp).toEqual(tijd(8))
    expect(blokken[0]?.eindOp).toEqual(tijd(20))
    expect(blokken[0]?.minuten).toBe(12 * 60)
  })
})

describe('vrijeBlokken — gewone dag', () => {
  it('vindt de gaten voor, tussen en na de afspraken', () => {
    // Arrange — standup 09:00-09:30, review 11:00-12:00, call 16:00-16:30
    const events = [
      afspraak('standup', 9, 0, 9, 30),
      afspraak('review', 11, 0, 12, 0),
      afspraak('call', 16, 0, 16, 30),
    ]

    // Act
    const blokken = vrijeBlokken(events, VENSTER)

    // Assert — 08:00-09:00, 09:30-11:00, 12:00-16:00, 16:30-20:00
    expect(blokken.map((b) => b.minuten)).toEqual([60, 90, 240, 210])
    expect(blokken[1]?.startOp).toEqual(tijd(9, 30))
    expect(blokken[1]?.eindOp).toEqual(tijd(11, 0))
  })

  it('laat een gat onder de 45 minuten weg — daar past niets in', () => {
    // Arrange — tussen 09:30 en 10:00 zit 30 min: geen blok.
    const events = [afspraak('a', 8, 0, 9, 30), afspraak('b', 10, 0, 20, 0)]

    // Act
    const blokken = vrijeBlokken(events, VENSTER)

    // Assert
    expect(blokken).toHaveLength(0)
  })

  it('houdt een gat van precies 45 minuten wél — de grens ligt op >=, niet op >', () => {
    // Arrange — 09:00-09:45 is exact MIN_BLOK_MINUTEN.
    const events = [afspraak('voor', 8, 0, 9, 0), afspraak('na', 9, 45, 20, 0)]

    // Act
    const blokken = vrijeBlokken(events, VENSTER)

    // Assert
    expect(blokken).toHaveLength(1)
    expect(blokken[0]?.minuten).toBe(MIN_BLOK_MINUTEN)
    expect(blokken[0]?.startOp).toEqual(tijd(9, 0))
  })

  it('respecteert een eigen minimum', () => {
    const events = [afspraak('voor', 8, 0, 9, 0), afspraak('na', 9, 30, 20, 0)]

    expect(vrijeBlokken(events, VENSTER, { minMinuten: 30 })).toHaveLength(1)
    expect(vrijeBlokken(events, VENSTER, { minMinuten: 31 })).toHaveLength(0)
  })
})

describe('vrijeBlokken — overlappende afspraken', () => {
  it('telt twee overlappende meetings als één bezet blok', () => {
    // Arrange — dubbel geboekt: 10:00-11:30 en 11:00-12:00.
    const events = [afspraak('a', 10, 0, 11, 30), afspraak('b', 11, 0, 12, 0)]

    // Act
    const blokken = vrijeBlokken(events, VENSTER)

    // Assert — 08:00-10:00 en 12:00-20:00; geen fantoomgat om 11:30.
    expect(blokken.map((b) => b.minuten)).toEqual([120, 480])
    expect(blokken[1]?.startOp).toEqual(tijd(12, 0))
  })

  it('slikt een afspraak die volledig binnen een andere valt', () => {
    // Arrange — de hele middag geblokkeerd, met een losse call erin.
    const events = [afspraak('blok', 13, 0, 17, 0), afspraak('call', 14, 0, 14, 30)]

    // Act
    const blokken = vrijeBlokken(events, VENSTER)

    // Assert — 08:00-13:00 en 17:00-20:00, niets daartussen.
    expect(blokken.map((b) => b.minuten)).toEqual([300, 180])
  })

  it('maakt van een aaneengesloten reeks één blok, ook als ze ongesorteerd binnenkomen', () => {
    // Arrange — 11:00 komt vóór 10:00 in de array.
    const events = [afspraak('b', 11, 0, 12, 0), afspraak('a', 10, 0, 11, 0)]

    // Act
    const blokken = vrijeBlokken(events, VENSTER)

    // Assert
    expect(blokken.map((b) => b.minuten)).toEqual([120, 480])
  })
})

describe('vrijeBlokken — hele-dag-events', () => {
  it('laat een hele-dag-event de dag niet leegvegen', () => {
    // Arrange — een verjaardag is geen reden om te zeggen dat je geen tijd hebt.
    const verjaardag: Afspraak = {
      id: 'verjaardag',
      titel: 'Verjaardag zwager',
      startOp: new Date(2026, 6, 15, 0, 0),
      eindOp: new Date(2026, 6, 16, 0, 0),
      heleDag: true,
      locatie: null,
    }

    // Act
    const blokken = vrijeBlokken([verjaardag], VENSTER)

    // Assert
    expect(blokken).toHaveLength(1)
    expect(blokken[0]?.minuten).toBe(12 * 60)
  })

  it('laat de echte afspraken van die dag gewoon staan naast een hele-dag-event', () => {
    const events: Afspraak[] = [
      {
        id: 'vakantie',
        titel: 'Vrij',
        startOp: new Date(2026, 6, 15, 0, 0),
        eindOp: new Date(2026, 6, 16, 0, 0),
        heleDag: true,
        locatie: null,
      },
      afspraak('call', 10, 0, 11, 0),
    ]

    const blokken = vrijeBlokken(events, VENSTER)

    expect(blokken.map((b) => b.minuten)).toEqual([120, 540])
  })
})

describe('vrijeBlokken — buiten de werkuren', () => {
  it('negeert een afspraak die volledig buiten het venster valt', () => {
    // Arrange — borrel om 21:00, ver na 20:00.
    const events = [afspraak('borrel', 21, 0, 23, 0)]

    // Act
    const blokken = vrijeBlokken(events, VENSTER)

    // Assert
    expect(blokken).toHaveLength(1)
    expect(blokken[0]?.minuten).toBe(12 * 60)
  })

  it('klemt een afspraak die het venster in loopt', () => {
    // Arrange — vroege call 06:30-09:00 bezet alleen 08:00-09:00.
    const events = [afspraak('vroeg', 6, 30, 9, 0)]

    // Act
    const blokken = vrijeBlokken(events, VENSTER)

    // Assert — één blok 09:00-20:00; geen negatief blok vóór 08:00.
    expect(blokken).toHaveLength(1)
    expect(blokken[0]?.startOp).toEqual(tijd(9, 0))
    expect(blokken[0]?.minuten).toBe(11 * 60)
  })

  it('klemt een afspraak die over de eindgrens loopt', () => {
    const events = [afspraak('laat', 19, 0, 22, 0)]

    const blokken = vrijeBlokken(events, VENSTER)

    expect(blokken).toHaveLength(1)
    expect(blokken[0]?.eindOp).toEqual(tijd(19, 0))
  })
})

describe('vrijeBlokken — rare invoer', () => {
  it('negeert een afspraak zonder eindtijd in plaats van een duur te verzinnen', () => {
    // Arrange
    const zonderEind: Afspraak = {
      id: 'onbekend',
      titel: 'Onbekende duur',
      startOp: tijd(12, 0),
      eindOp: null,
      heleDag: false,
      locatie: null,
    }

    // Act
    const blokken = vrijeBlokken([zonderEind], VENSTER)

    // Assert — het venster blijft heel; we doen geen aanname over de duur.
    expect(blokken).toHaveLength(1)
    expect(blokken[0]?.minuten).toBe(12 * 60)
  })

  it('negeert een afspraak die eindigt voor hij begint', () => {
    const kapot = afspraak('kapot', 14, 0, 13, 0)

    expect(vrijeBlokken([kapot], VENSTER)).toHaveLength(1)
  })

  it('geeft niets terug bij een omgekeerd venster in plaats van te struikelen', () => {
    const omgekeerd = { startOp: tijd(20), eindOp: tijd(8) }

    expect(vrijeBlokken([], omgekeerd)).toEqual([])
  })
})

describe('vrijeBlokken — met nu', () => {
  it('biedt geen blok in het verleden aan', () => {
    // Arrange — het is 15:00; het gat van 08:00-20:00 begint dus nú.
    const nu = tijd(15, 0)

    // Act
    const blokken = vrijeBlokken([], VENSTER, { nu })

    // Assert
    expect(blokken).toHaveLength(1)
    expect(blokken[0]?.startOp).toEqual(tijd(15, 0))
    expect(blokken[0]?.minuten).toBe(5 * 60)
  })

  it('kapt een blok af dat al bezig is', () => {
    // Arrange — het is 10:30, de call is om 12:00.
    const events = [afspraak('call', 12, 0, 13, 0)]

    // Act
    const blokken = vrijeBlokken(events, VENSTER, { nu: tijd(10, 30) })

    // Assert — 10:30-12:00 en 13:00-20:00. Niet 08:00-12:00.
    expect(blokken.map((b) => b.minuten)).toEqual([90, 420])
  })

  it('geeft niets als de dag voorbij is', () => {
    expect(vrijeBlokken([], VENSTER, { nu: tijd(23, 0) })).toEqual([])
  })

  it('negeert nu als het nog voor het venster is', () => {
    const blokken = vrijeBlokken([], VENSTER, { nu: tijd(6, 0) })

    expect(blokken[0]?.startOp).toEqual(tijd(8, 0))
  })
})

describe('eerstvolgendeAfspraak', () => {
  it('geeft de eerste afspraak die nog moet komen', () => {
    // Arrange
    const events = [afspraak('later', 16, 0, 17, 0), afspraak('straks', 14, 0, 15, 0)]

    // Act
    const volgende = eerstvolgendeAfspraak(events, tijd(11, 0))

    // Assert
    expect(volgende?.id).toBe('straks')
  })

  it('geeft de lopende afspraak, niet de volgende — waar je nu moet zijn telt eerst', () => {
    // Arrange — het is 14:30, je zit in de meeting van 14:00-15:00.
    const events = [afspraak('nu bezig', 14, 0, 15, 0), afspraak('daarna', 16, 0, 17, 0)]

    // Act
    const volgende = eerstvolgendeAfspraak(events, tijd(14, 30))

    // Assert
    expect(volgende?.id).toBe('nu bezig')
  })

  it('geeft null als alles voorbij is — dat is een antwoord, geen fout', () => {
    const events = [afspraak('geweest', 9, 0, 10, 0)]

    expect(eerstvolgendeAfspraak(events, tijd(18, 0))).toBeNull()
  })

  it('geeft null bij een lege agenda', () => {
    expect(eerstvolgendeAfspraak([], tijd(9, 0))).toBeNull()
  })

  it('slaat hele-dag-events over: "Vakantie" is geen afspraak waar je heen moet', () => {
    const events: Afspraak[] = [
      {
        id: 'vakantie',
        titel: 'Vrij',
        startOp: new Date(2026, 6, 15, 0, 0),
        eindOp: new Date(2026, 6, 16, 0, 0),
        heleDag: true,
        locatie: null,
      },
    ]

    expect(eerstvolgendeAfspraak(events, tijd(9, 0))).toBeNull()
  })
})

describe('looptNu', () => {
  it('herkent een afspraak die bezig is', () => {
    expect(looptNu(afspraak('a', 14, 0, 15, 0), tijd(14, 30))).toBe(true)
  })

  it('is onwaar voor en na de afspraak', () => {
    const a = afspraak('a', 14, 0, 15, 0)

    expect(looptNu(a, tijd(13, 59))).toBe(false)
    expect(looptNu(a, tijd(15, 0))).toBe(false)
  })
})
