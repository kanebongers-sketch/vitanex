import { describe, it, expect } from 'vitest'
import { dagenTerug, isoDatum, laatsteDagen, lokaleDatum, offsetInMinuten, vandaagLokaal } from './tijd'

// Deze testen bewaken de dag-grens. Een meting die een dag opschuift is een
// stille datafout: de UI toont gewoon een cijfer, alleen op de verkeerde dag.

describe('offsetInMinuten', () => {
  it('leest de offsets die Whoop stuurt', () => {
    expect(offsetInMinuten('+02:00')).toBe(120)
    expect(offsetInMinuten('-05:00')).toBe(-300)
    expect(offsetInMinuten('-05:30')).toBe(-330)
    expect(offsetInMinuten('Z')).toBe(0)
  })

  it('geeft null bij onleesbare invoer i.p.v. stil op UTC terug te vallen', () => {
    // Arrange & Act & Assert — 0 zou hier "UTC" betekenen, en dat is een gok.
    expect(offsetInMinuten('nergens')).toBeNull()
    expect(offsetInMinuten(undefined)).toBeNull()
    expect(offsetInMinuten('+99:00')).toBeNull()
    expect(offsetInMinuten(120)).toBeNull()
  })
})

describe('lokaleDatum', () => {
  it('houdt een ochtend in Nederland op dezelfde dag', () => {
    // Arrange — 07:30 lokaal in NL (zomertijd) = 05:30 UTC.
    // Act
    const d = lokaleDatum('2026-07-15T05:30:00.000Z', '+02:00')
    // Assert
    expect(d).toBe('2026-07-15')
  })

  it('schuift een late avond in Nederland NIET naar de volgende dag', () => {
    // Arrange — 23:30 lokaal = 21:30 UTC, zelfde dag.
    expect(lokaleDatum('2026-07-15T21:30:00.000Z', '+02:00')).toBe('2026-07-15')
  })

  it('corrigeert een UTC-tijdstip dat al over middernacht is', () => {
    // Arrange — 00:30 UTC op de 16e is 02:30 lokaal op de 16e (+02:00)…
    expect(lokaleDatum('2026-07-16T00:30:00.000Z', '+02:00')).toBe('2026-07-16')
    // …maar in New York (-04:00) is dat 20:30 op de 15e. Dit is precies de
    // fout die je maakt als je klakkeloos toISOString().slice(0,10) doet.
    expect(lokaleDatum('2026-07-16T00:30:00.000Z', '-04:00')).toBe('2026-07-15')
  })

  it('geeft null bij een ontbrekende offset — geen stille aanname', () => {
    expect(lokaleDatum('2026-07-15T05:30:00.000Z', null)).toBeNull()
    expect(lokaleDatum(null, '+02:00')).toBeNull()
    expect(lokaleDatum('geen datum', '+02:00')).toBeNull()
  })
})

describe('isoDatum', () => {
  it('accepteert een kale datum en de kop van een timestamp', () => {
    expect(isoDatum('2026-07-15')).toBe('2026-07-15')
    expect(isoDatum('2026-07-15T05:30:00Z')).toBe('2026-07-15')
  })

  it('verwerpt een datum die niet bestaat', () => {
    // Arrange — 31 februari matcht het patroon wél.
    expect(isoDatum('2026-02-31')).toBeNull()
    expect(isoDatum('15-07-2026')).toBeNull()
    expect(isoDatum(20260715)).toBeNull()
    expect(isoDatum(null)).toBeNull()
  })
})

describe('laatsteDagen', () => {
  it('geeft precies N dagen t/m vandaag, oplopend', () => {
    // Act
    const dagen = laatsteDagen('2026-07-15', 7)
    // Assert
    expect(dagen).toHaveLength(7)
    expect(dagen[0]).toBe('2026-07-09')
    expect(dagen[6]).toBe('2026-07-15')
  })

  it('loopt correct over een maandgrens', () => {
    expect(laatsteDagen('2026-03-02', 3)).toEqual(['2026-02-28', '2026-03-01', '2026-03-02'])
  })

  it('geeft een lege lijst bij een onzinnig aantal', () => {
    expect(laatsteDagen('2026-07-15', 0)).toEqual([])
  })
})

describe('dagenTerug', () => {
  it('rekent over een jaargrens', () => {
    expect(dagenTerug('2026-01-02', 3)).toBe('2025-12-30')
  })
})

describe('vandaagLokaal', () => {
  it('gebruikt de lokale dag, niet de UTC-dag', () => {
    // Arrange — 23:30 UTC op 15 juli. In Amsterdam (+02:00) is het dan al
    // 01:30 op de 16e. Wie hier toISOString() gebruikt, synchroniseert 's
    // nachts de verkeerde dag.
    const nu = new Date('2026-07-15T23:30:00Z')

    // Act — getFullYear/getMonth/getDate zijn lokaal en volgen dus TZ.
    const lokaal = vandaagLokaal(nu)

    // Assert — we draaien niet per se in Europe/Amsterdam tijdens de test,
    // dus we toetsen de eigenschap: het is de lokale dag van deze Date.
    const verwacht = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`
    expect(lokaal).toBe(verwacht)
    expect(isoDatum(lokaal)).toBe(lokaal)
  })

  it('vult maand en dag aan tot twee cijfers', () => {
    // Arrange — 5 januari: zonder padStart wordt dit '2026-1-5' en dat is geen
    // geldige ISO-datum meer (en breekt de query op de DB).
    const lokaal = vandaagLokaal(new Date(2026, 0, 5, 12, 0, 0))

    // Assert
    expect(lokaal).toBe('2026-01-05')
  })
})
