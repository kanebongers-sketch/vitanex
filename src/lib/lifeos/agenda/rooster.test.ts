import { describe, it, expect } from 'vitest'
import {
  bepaalVenster,
  bouwRooster,
  bouwRoosterMetVenster,
  minutenSindsMiddernacht,
  tijdLabelVanMinuten,
  uurLijnen,
  MIN_BLOK_DUUR_MIN,
  VENSTER_START_STANDAARD_MIN,
  VENSTER_EIND_STANDAARD_MIN,
} from './rooster'
import type { AfspraakJson } from './agenda'

// Vaste dag in LOKALE tijd, net als vrije-blokken.test.ts / inplannen.test.ts.
// `toISOString()` codeert naar UTC; `bouwRooster` parst terug en leest lokale
// uren, dus dit rondt tijdzone-neutraal af naar hetzelfde lokale uur.
function iso(uur: number, minuut = 0): string {
  return new Date(2026, 6, 20, uur, minuut, 0, 0).toISOString()
}

function afspraak(over: Partial<AfspraakJson> & { startOp: string }): AfspraakJson {
  return {
    id: over.id ?? `id-${over.startOp}`,
    titel: over.titel ?? 'Afspraak',
    startOp: over.startOp,
    eindOp: over.eindOp ?? null,
    heleDag: over.heleDag ?? false,
    locatie: over.locatie ?? null,
  }
}

describe('minutenSindsMiddernacht', () => {
  it('rekent lokale uren en minuten om', () => {
    expect(minutenSindsMiddernacht(new Date(2026, 6, 20, 9, 30))).toBe(9 * 60 + 30)
    expect(minutenSindsMiddernacht(new Date(2026, 6, 20, 0, 0))).toBe(0)
  })
})

describe('tijdLabelVanMinuten', () => {
  it('formatteert als 24-uurs HH:MM', () => {
    expect(tijdLabelVanMinuten(0)).toBe('00:00')
    expect(tijdLabelVanMinuten(7 * 60)).toBe('07:00')
    expect(tijdLabelVanMinuten(9 * 60 + 5)).toBe('09:05')
    expect(tijdLabelVanMinuten(23 * 60 + 59)).toBe('23:59')
  })

  it('normaliseert een eindtijd voorbij middernacht', () => {
    expect(tijdLabelVanMinuten(24 * 60 + 30)).toBe('00:30')
  })
})

describe('uurLijnen', () => {
  it('geeft elk heel uur tussen begin en eind, inclusief de randen', () => {
    expect(uurLijnen(7 * 60, 10 * 60)).toEqual([420, 480, 540, 600])
  })
})

describe('bouwRooster — venster', () => {
  it('gebruikt het standaardvenster 07:00–22:00 bij een lege dag', () => {
    const rooster = bouwRooster([])
    expect(rooster.vensterStartMin).toBe(VENSTER_START_STANDAARD_MIN)
    expect(rooster.vensterEindMin).toBe(VENSTER_EIND_STANDAARD_MIN)
    expect(rooster.blokken).toEqual([])
    expect(rooster.heleDag).toEqual([])
  })

  it('verruimt naar beneden naar het hele uur voor een vroege afspraak', () => {
    const rooster = bouwRooster([afspraak({ startOp: iso(6, 30), eindOp: iso(7, 15) })])
    expect(rooster.vensterStartMin).toBe(6 * 60)
  })

  it('verruimt naar boven naar het hele uur voor een late afspraak', () => {
    const rooster = bouwRooster([afspraak({ startOp: iso(22, 10), eindOp: iso(22, 50) })])
    expect(rooster.vensterEindMin).toBe(23 * 60) // 22:50 → 23:00
  })

  it('klemt op 00:00 en 24:00', () => {
    const rooster = bouwRooster([
      afspraak({ startOp: iso(0, 10), eindOp: iso(1, 0) }),
      afspraak({ startOp: iso(23, 45), eindOp: iso(23, 59) }),
    ])
    expect(rooster.vensterStartMin).toBe(0)
    expect(rooster.vensterEindMin).toBe(24 * 60)
  })
})

describe('bouwRooster — positie', () => {
  it('berekent topMin t.o.v. de vensterbovenkant en duurMin uit de eindtijd', () => {
    const rooster = bouwRooster([afspraak({ startOp: iso(9, 0), eindOp: iso(10, 30) })])
    const blok = rooster.blokken[0]
    expect(blok?.topMin).toBe(9 * 60 - VENSTER_START_STANDAARD_MIN) // 120
    expect(blok?.duurMin).toBe(90)
    expect(blok?.startMin).toBe(9 * 60)
    expect(blok?.eindMin).toBe(10 * 60 + 30)
  })

  it('geeft een kort blok de minimale hoogte, maar bewaart de echte eindtijd', () => {
    const rooster = bouwRooster([afspraak({ startOp: iso(9, 0), eindOp: iso(9, 10) })])
    const blok = rooster.blokken[0]
    expect(blok?.duurMin).toBe(MIN_BLOK_DUUR_MIN)
    expect(blok?.eindMin).toBe(9 * 60 + 10)
  })

  it('geeft een afspraak zonder eindtijd de minimale hoogte en eindMin null', () => {
    const rooster = bouwRooster([afspraak({ startOp: iso(9, 0), eindOp: null })])
    const blok = rooster.blokken[0]
    expect(blok?.duurMin).toBe(MIN_BLOK_DUUR_MIN)
    expect(blok?.eindMin).toBeNull()
  })
})

describe('bouwRooster — hele dag', () => {
  it('zet hele-dag-events apart en niet in het tijdraster', () => {
    const rooster = bouwRooster([
      afspraak({ id: 'verjaardag', startOp: iso(0, 0), heleDag: true, titel: 'Verjaardag' }),
      afspraak({ startOp: iso(9, 0), eindOp: iso(10, 0) }),
    ])
    expect(rooster.blokken).toHaveLength(1)
    expect(rooster.heleDag).toHaveLength(1)
    expect(rooster.heleDag[0]?.titel).toBe('Verjaardag')
  })
})

describe('bouwRooster — systeemgrens', () => {
  it('slaat een afspraak met een onleesbare starttijd over', () => {
    const rooster = bouwRooster([
      afspraak({ startOp: 'geen-datum' }),
      afspraak({ startOp: iso(9, 0), eindOp: iso(10, 0) }),
    ])
    expect(rooster.blokken).toHaveLength(1)
  })

  it('muteert de invoer niet', () => {
    const invoer = [afspraak({ startOp: iso(9, 0), eindOp: iso(10, 0) })]
    const kopie = invoer.map((a) => ({ ...a }))
    bouwRooster(invoer)
    expect(invoer).toEqual(kopie)
  })
})

describe('bouwRooster — overlap-lanes', () => {
  it('geeft niet-overlappende afspraken elk de volle breedte', () => {
    const rooster = bouwRooster([
      afspraak({ id: 'a', startOp: iso(9, 0), eindOp: iso(10, 0) }),
      afspraak({ id: 'b', startOp: iso(11, 0), eindOp: iso(12, 0) }),
    ])
    for (const blok of rooster.blokken) {
      expect(blok.laneCount).toBe(1)
      expect(blok.laneIndex).toBe(0)
    }
  })

  it('legt twee overlappende afspraken naast elkaar in 2 lanes (50/50)', () => {
    const rooster = bouwRooster([
      afspraak({ id: 'a', startOp: iso(9, 0), eindOp: iso(10, 0) }),
      afspraak({ id: 'b', startOp: iso(9, 30), eindOp: iso(10, 30) }),
    ])
    const a = rooster.blokken.find((b) => b.id === 'a')
    const b = rooster.blokken.find((b) => b.id === 'b')
    expect(a?.laneCount).toBe(2)
    expect(b?.laneCount).toBe(2)
    expect(a?.laneIndex).toBe(0)
    expect(b?.laneIndex).toBe(1)
  })

  it('houdt aanliggende afspraken (10:00 eindigt, 10:00 begint) in dezelfde lane', () => {
    const rooster = bouwRooster([
      afspraak({ id: 'a', startOp: iso(9, 0), eindOp: iso(10, 0) }),
      afspraak({ id: 'b', startOp: iso(10, 0), eindOp: iso(11, 0) }),
    ])
    const a = rooster.blokken.find((b) => b.id === 'a')
    const b = rooster.blokken.find((b) => b.id === 'b')
    expect(a?.laneCount).toBe(1)
    expect(b?.laneCount).toBe(1)
    expect(a?.laneIndex).toBe(0)
    expect(b?.laneIndex).toBe(0)
  })

  it('verdeelt drie deels-overlappende afspraken over 2 lanes en hergebruikt de vrijgekomen lane', () => {
    // a 09:00–10:00, b 09:30–11:00, c 10:10–11:30.
    // a en c overlappen niet → delen lane 0; b staat in lane 1. Max = 2 lanes.
    const rooster = bouwRooster([
      afspraak({ id: 'a', startOp: iso(9, 0), eindOp: iso(10, 0) }),
      afspraak({ id: 'b', startOp: iso(9, 30), eindOp: iso(11, 0) }),
      afspraak({ id: 'c', startOp: iso(10, 10), eindOp: iso(11, 30) }),
    ])
    const a = rooster.blokken.find((b) => b.id === 'a')
    const b = rooster.blokken.find((b) => b.id === 'b')
    const c = rooster.blokken.find((b) => b.id === 'c')
    expect(a?.laneIndex).toBe(0)
    expect(b?.laneIndex).toBe(1)
    expect(c?.laneIndex).toBe(0)
    for (const blok of [a, b, c]) expect(blok?.laneCount).toBe(2)
  })

  it('telt overlap op de getekende (afgeronde) hoogte: twee korte afspraken op hetzelfde uur botsen', () => {
    // Beide 0 min echt → 30 min getekend → ze overlappen visueel → 2 lanes.
    const rooster = bouwRooster([
      afspraak({ id: 'a', startOp: iso(9, 0), eindOp: iso(9, 5) }),
      afspraak({ id: 'b', startOp: iso(9, 10), eindOp: iso(9, 15) }),
    ])
    expect(rooster.blokken.find((b) => b.id === 'a')?.laneCount).toBe(2)
    expect(rooster.blokken.find((b) => b.id === 'b')?.laneCount).toBe(2)
  })

  it('levert de blokken gesorteerd op starttijd, ook bij omgekeerde invoer', () => {
    const rooster = bouwRooster([
      afspraak({ id: 'laat', startOp: iso(14, 0), eindOp: iso(15, 0) }),
      afspraak({ id: 'vroeg', startOp: iso(9, 0), eindOp: iso(10, 0) }),
    ])
    expect(rooster.blokken.map((b) => b.id)).toEqual(['vroeg', 'laat'])
  })
})

describe('bepaalVenster — gedeeld over meerdere dagen', () => {
  it('geeft het standaardvenster bij een lege lijst', () => {
    expect(bepaalVenster([])).toEqual({
      startMin: VENSTER_START_STANDAARD_MIN,
      eindMin: VENSTER_EIND_STANDAARD_MIN,
    })
  })

  it('geeft het standaardvenster als geen enkele dag afspraken heeft', () => {
    expect(bepaalVenster([[], [], []])).toEqual({
      startMin: VENSTER_START_STANDAARD_MIN,
      eindMin: VENSTER_EIND_STANDAARD_MIN,
    })
  })

  it('neemt de UNIE: de vroegste start én het laatste eind over álle dagen', () => {
    // Dag 1 duwt de bovenkant naar 06:00, dag 2 duwt de onderkant naar 23:00.
    const dag1 = [afspraak({ startOp: iso(6, 30), eindOp: iso(7, 15) })]
    const dag2 = [afspraak({ startOp: iso(22, 10), eindOp: iso(22, 50) })]
    const venster = bepaalVenster([dag1, dag2])
    expect(venster.startMin).toBe(6 * 60)
    expect(venster.eindMin).toBe(23 * 60)
  })

  it('komt voor één dag overeen met het venster dat bouwRooster kiest', () => {
    const dag = [afspraak({ startOp: iso(6, 30), eindOp: iso(23, 10) })]
    const venster = bepaalVenster([dag])
    const rooster = bouwRooster(dag)
    expect(venster.startMin).toBe(rooster.vensterStartMin)
    expect(venster.eindMin).toBe(rooster.vensterEindMin)
  })
})

describe('bouwRoosterMetVenster — uitlijning over kolommen', () => {
  it('positioneert topMin t.o.v. het MEEGEGEVEN venster, niet het eigen venster', () => {
    // Een 09:00-afspraak met een venster dat op 06:00 begint → topMin = 180.
    const venster = { startMin: 6 * 60, eindMin: 23 * 60 }
    const rooster = bouwRoosterMetVenster([afspraak({ startOp: iso(9, 0), eindOp: iso(10, 0) })], venster)
    expect(rooster.vensterStartMin).toBe(6 * 60)
    expect(rooster.vensterEindMin).toBe(23 * 60)
    expect(rooster.blokken[0]?.topMin).toBe(9 * 60 - 6 * 60)
  })

  it('lijnt hetzelfde kloktijdstip in twee dagen op dezelfde hoogte uit', () => {
    // Dag B trekt het gedeelde venster naar 06:00; dan moet de 09:00-afspraak in
    // BEIDE kolommen dezelfde topMin krijgen — dát is de uitlijning.
    const dagA = [afspraak({ id: 'a9', startOp: iso(9, 0), eindOp: iso(10, 0) })]
    const dagB = [
      afspraak({ id: 'b6', startOp: iso(6, 30), eindOp: iso(7, 0) }),
      afspraak({ id: 'b9', startOp: iso(9, 0), eindOp: iso(10, 0) }),
    ]
    const venster = bepaalVenster([dagA, dagB])
    const rA = bouwRoosterMetVenster(dagA, venster)
    const rB = bouwRoosterMetVenster(dagB, venster)
    const a9 = rA.blokken.find((b) => b.id === 'a9')
    const b9 = rB.blokken.find((b) => b.id === 'b9')
    expect(a9?.topMin).toBe(3 * 60) // 09:00 − 06:00
    expect(a9?.topMin).toBe(b9?.topMin)
  })

  it('muteert de invoer niet', () => {
    const invoer = [afspraak({ startOp: iso(9, 0), eindOp: iso(10, 0) })]
    const kopie = invoer.map((a) => ({ ...a }))
    bouwRoosterMetVenster(invoer, { startMin: 6 * 60, eindMin: 23 * 60 })
    expect(invoer).toEqual(kopie)
  })
})
