import { describe, expect, it } from 'vitest'
import { begrens, MAX_RIJEN, rapportBestand, rapportCsv } from './csv'
import { datumNl, momentDatum, momentTijd, procent, uren } from './opmaak'

const BOM = '﻿'

describe('rapportCsv', () => {
  it('begint met een BOM, scheidt met puntkomma en eindigt regels op CRLF', () => {
    const csv = rapportCsv({ kolommen: ['Naam', 'Aantal'], rijen: [['Anna', 3]] })
    expect(csv.startsWith(BOM)).toBe(true)
    expect(csv).toBe(`${BOM}Naam;Aantal\r\nAnna;3\r\n`)
  })

  it('schrijft decimalen met een komma en lege cellen leeg', () => {
    expect(rapportCsv({ kolommen: ['U', 'X'], rijen: [[7.5, null]] })).toBe(`${BOM}U;X\r\n7,50;\r\n`)
  })

  it('zet cellen met een puntkomma, aanhalingsteken of regeleinde tussen aanhalingstekens', () => {
    const csv = rapportCsv({ kolommen: ['A'], rijen: [['a;b'], ['zei "hoi"'], ['regel\nnieuw']] })
    expect(csv).toContain('"a;b"')
    expect(csv).toContain('"zei ""hoi"""')
    expect(csv).toContain('"regel\nnieuw"')
  })

  it.each(['=SOM(A1)', '+31612345678', '-2+3', '@cmd', '\tverborgen', '\rterug'])('voorkomt formule-injectie bij %j', (waarde) => {
    const csv = rapportCsv({ kolommen: ['A'], rijen: [[waarde]] })
    const cel = csv.split('\r\n')[1]
    expect(cel.replace(/^"/, '').startsWith(`'`)).toBe(true)
  })

  it('laat gewone tekst en negatieve getallen met rust', () => {
    expect(rapportCsv({ kolommen: ['A', 'B'], rijen: [['Budel', -2]] })).toBe(`${BOM}A;B\r\nBudel;-2\r\n`)
  })

  it('laat datums als dd-mm-jjjj staan', () => {
    expect(rapportCsv({ kolommen: ['Datum'], rijen: [[datumNl('2026-10-07')]] })).toBe(`${BOM}Datum\r\n07-10-2026\r\n`)
  })
})

describe('begrens', () => {
  it('kapt af op het maximum en onthoudt het totaal', () => {
    const rijen = Array.from({ length: 5 }, (_, i) => [i])
    const b = begrens({ kolommen: ['n'], rijen }, 3)
    expect(b.rijen).toHaveLength(3)
    expect(b.totaal).toBe(5)
    expect(b.afgekapt).toBe(true)
    expect(begrens({ kolommen: ['n'], rijen }).afgekapt).toBe(false)
    expect(MAX_RIJEN).toBe(10_000)
  })
})

describe('rapportBestand', () => {
  it('maakt een veilige bestandsnaam', () => {
    expect(rapportBestand('bezoek', '2026-09', ['budel', 'eersel'], false)).toBe('bezoek-2026-09-budel-eersel.csv')
    expect(rapportBestand('uren', '2026-09', ['a1', 'b2'], true)).toBe('uren-2026-09-alle-vestigingen.csv')
    expect(rapportBestand('leads', '2026-09', ['a1', 'b2', 'c3', 'd4', 'e5'], false)).toBe('leads-2026-09-5-vestigingen.csv')
  })
})

describe('opmaak', () => {
  it('datumNl', () => {
    expect(datumNl('2026-01-31')).toBe('31-01-2026')
    expect(datumNl(null)).toBeNull()
    expect(datumNl('gisteren')).toBeNull()
  })

  it('rekent momenten in Nederlandse tijd', () => {
    // 23:30 UTC op 31 oktober is 00:30 op 1 november in Nederland (wintertijd).
    const d = new Date('2026-10-31T23:30:00Z')
    expect(momentDatum(d)).toBe('01-11-2026')
    expect(momentTijd(d)).toBe('00:30')
    expect(momentDatum(null)).toBeNull()
  })

  it('uren en procent', () => {
    expect(uren(90)).toBe(1.5)
    expect(uren(20)).toBe(0.33)
    expect(procent(9, 12)).toBe(75)
    expect(procent(3, 0)).toBeNull()
  })
})
