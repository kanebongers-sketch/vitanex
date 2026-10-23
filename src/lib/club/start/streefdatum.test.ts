import { describe, expect, it } from 'vitest'
import { NIEUWE_START, dagenTekst, dagenTot, datumTekst, isStreefdatum, leesStart, leesStartInvoer, pasToe, startNaarJson, streefStand } from './stappen'

const NU = new Date('2026-10-23T10:00:00.000Z')

describe('streefdatum voor livegang', () => {
  it('accepteert alleen echte kalenderdagen', () => {
    expect(isStreefdatum('2026-11-01')).toBe(true)
    expect(isStreefdatum('2028-02-29')).toBe(true)
    expect(isStreefdatum('2026-02-31')).toBe(false)
    expect(isStreefdatum('2026-13-01')).toBe(false)
    expect(isStreefdatum('1-11-2026')).toBe(false)
    expect(isStreefdatum('2019-12-31')).toBe(false)
    expect(isStreefdatum('2026-11-01T00:00:00Z')).toBe(false)
    expect(isStreefdatum(20261101)).toBe(false)
  })

  it('leest een kapotte datum uit de database als geen datum', () => {
    expect(leesStart({ start: { stap: 2, streefdatum: '2026-11-01' } })?.streefdatum).toBe('2026-11-01')
    expect(leesStart({ start: { stap: 2, streefdatum: 'morgen' } })?.streefdatum).toBeNull()
    expect(leesStart({ start: { stap: 2 } })?.streefdatum).toBeNull()
    expect(startNaarJson({ ...NIEUWE_START, streefdatum: '2026-11-01' }).streefdatum).toBe('2026-11-01')
  })

  it('neemt een datum of null aan van de pagina, en weigert onzin', () => {
    expect(leesStartInvoer({ streefdatum: '2026-11-01' })).toEqual({ ok: true, waarde: { streefdatum: '2026-11-01' } })
    expect(leesStartInvoer({ streefdatum: null })).toEqual({ ok: true, waarde: { streefdatum: null } })
    expect(leesStartInvoer({ streefdatum: '2026-02-31' }).ok).toBe(false)
    expect(leesStartInvoer({ streefdatum: 5 }).ok).toBe(false)
  })

  it('bewaart, laat staan en haalt weg', () => {
    const gekozen = pasToe(NIEUWE_START, { streefdatum: '2026-11-01' }, NU)
    expect(gekozen.streefdatum).toBe('2026-11-01')
    expect(pasToe(gekozen, { stap: 3, klaar: 'soort' }, NU).streefdatum).toBe('2026-11-01')
    expect(pasToe(gekozen, { streefdatum: null }, NU).streefdatum).toBeNull()
    expect(NIEUWE_START.streefdatum).toBeNull()
  })

  it('telt de dagen tot de datum, ook over een maand en jaar heen', () => {
    expect(dagenTot('2026-11-01', '2026-10-23')).toBe(9)
    expect(dagenTot('2026-10-23', '2026-10-23')).toBe(0)
    expect(dagenTot('2027-01-01', '2026-12-31')).toBe(1)
    expect(dagenTot('2026-10-20', '2026-10-23')).toBe(-3)
    // De wintertijd (25 oktober) telt niet als halve dag.
    expect(dagenTot('2026-10-26', '2026-10-24')).toBe(2)
  })

  it('schrijft de datum in gewone taal, met het jaar alleen als het niet dit jaar is', () => {
    expect(datumTekst('2026-11-01', '2026-10-23')).toBe('1 november')
    expect(datumTekst('2027-01-15', '2026-10-23')).toBe('15 januari 2027')
  })

  it('geeft richting zonder druk', () => {
    expect(dagenTekst(9)).toBe('Nog 9 dagen')
    expect(dagenTekst(1)).toBe('Morgen')
    expect(dagenTekst(0)).toBe('Vandaag')
    expect(dagenTekst(-2)).toBe('De datum is voorbij, kies gerust een nieuwe')
  })

  it('toont de kop voor de kaart op Vandaag', () => {
    expect(streefStand('2026-11-01', '2026-10-23', 3)).toEqual({ kop: 'Live op 1 november, nog 3 stappen', dagen: 'Nog 9 dagen', voorbij: false })
    expect(streefStand('2026-11-01', '2026-10-23', 1).kop).toBe('Live op 1 november, nog 1 stap')
    expect(streefStand('2026-11-01', '2026-10-23', 0).kop).toBe('Live op 1 november, alle stappen staan')
    expect(streefStand('2026-10-01', '2026-10-23', 2).voorbij).toBe(true)
  })

  it('gebruikt geen gedachtestreepjes of klemtoon-accenten', () => {
    const teksten = [streefStand('2026-11-01', '2026-10-23', 3).kop, dagenTekst(-1), dagenTekst(5)]
    for (const t of teksten) expect(t).not.toMatch(/[\u2013\u2014]| - |[éèóá]/)
  })
})
