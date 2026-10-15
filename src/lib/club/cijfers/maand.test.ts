import { describe, expect, it } from 'vitest'
import {
  dagenIn,
  dagenInMaand,
  dagenVan,
  isSchrikkeljaar,
  kiesMaand,
  laatsteDag,
  maandenReeks,
  maandGrenzen,
  maandKort,
  maandNaam,
  maandVenster,
  plusMaanden,
  vensterNaam,
  vergelijkVenster,
} from './maand'
import { telBezoek } from './bezoek'
import { aandeel, oordeel, perLidPerWeek, perWeek, vergelijk } from './vergelijking'

describe('maanden van 28 tot 31 dagen', () => {
  it('kent het aantal dagen, ook in schrikkeljaren', () => {
    expect(dagenInMaand('2026-10')).toBe(31)
    expect(dagenInMaand('2026-09')).toBe(30)
    expect(dagenInMaand('2026-02')).toBe(28)
    expect(dagenInMaand('2028-02')).toBe(29)
    expect(dagenInMaand('2000-02')).toBe(29)
    expect(dagenInMaand('2100-02')).toBe(28)
    expect(isSchrikkeljaar(2028)).toBe(true)
    expect(isSchrikkeljaar(2100)).toBe(false)
    expect(laatsteDag('2028-02')).toBe('2028-02-29')
    expect(laatsteDag('2026-04')).toBe('2026-04-30')
  })

  it('telt maanden over de jaargrens heen', () => {
    expect(plusMaanden('2026-01', -1)).toBe('2025-12')
    expect(plusMaanden('2026-10', -12)).toBe('2025-10')
    expect(plusMaanden('2026-12', 1)).toBe('2027-01')
    expect(maandenReeks('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02'])
    expect(maandenReeks('2026-10', 12)).toHaveLength(12)
  })

  it('schrijft maandnamen voluit', () => {
    expect(maandNaam('2026-10')).toBe('oktober 2026')
    expect(maandNaam('2027-03')).toBe('maart 2027')
    expect(maandKort('2026-03')).toBe('mrt')
  })
})

describe('maandgrenzen in Nederlandse tijd', () => {
  it('oktober begint in zomertijd en eindigt in wintertijd', () => {
    const g = maandGrenzen('2026-10')
    expect(g.van.toISOString()).toBe('2026-09-30T22:00:00.000Z')
    expect(g.tot.toISOString()).toBe('2026-10-31T23:00:00.000Z')
  })

  it('maart begint in wintertijd en eindigt in zomertijd', () => {
    const g = maandGrenzen('2026-03')
    expect(g.van.toISOString()).toBe('2026-02-28T23:00:00.000Z')
    expect(g.tot.toISOString()).toBe('2026-03-31T22:00:00.000Z')
  })

  it('februari in een schrikkeljaar loopt tot en met de 29e', () => {
    const g = maandGrenzen('2028-02')
    expect(g.tot.toISOString()).toBe('2028-02-29T23:00:00.000Z')
  })

  it('rekent een check-in rond middernacht na de wisseling naar wintertijd tot de goede maand', () => {
    const t = telBezoek([
      { vestiging: 'budel', op: new Date('2026-10-31T22:30:00Z') }, // za 31 okt 23:30 NL
      { vestiging: 'budel', op: new Date('2026-10-31T23:30:00Z') }, // zo 1 nov 00:30 NL
      { vestiging: 'budel', op: new Date('2026-10-24T22:30:00Z') }, // zo 25 okt 00:30 NL, nog zomertijd
    ])
    const dagen = t.filter((x) => x.soort === 'dag').map((x) => x.sleutel).sort()
    expect(dagen).toEqual(['2026-10-25', '2026-10-31', '2026-11-01'])
  })
})

describe('maand uit de URL', () => {
  const VANDAAG = '2026-10-14'
  it('kiest standaard de lopende maand en weigert de toekomst en onzin', () => {
    expect(kiesMaand(undefined, VANDAAG)).toBe('2026-10')
    expect(kiesMaand('2026-09', VANDAAG)).toBe('2026-09')
    expect(kiesMaand(['2025-02'], VANDAAG)).toBe('2025-02')
    expect(kiesMaand('2026-11', VANDAAG)).toBe('2026-10')
    expect(kiesMaand('2026-13', VANDAAG)).toBe('2026-10')
    expect(kiesMaand('oktober', VANDAAG)).toBe('2026-10')
    expect(kiesMaand('1999-01', VANDAAG)).toBe('2026-10')
  })
})

describe('vensters en eerlijke vergelijking', () => {
  it('een lopende maand loopt tot en met vandaag', () => {
    const v = maandVenster('2026-10', '2026-10-14')
    expect(v).toMatchObject({ van: '2026-10-01', tot: '2026-10-14', dagen: 14, maandDagen: 31, lopend: true, heel: false })
    expect(vensterNaam(v)).toBe('1 tot en met 14 oktober 2026')
    expect(dagenVan(v)).toHaveLength(14)
  })

  it('een afgesloten maand is heel', () => {
    const v = maandVenster('2026-09', '2026-10-14')
    expect(v).toMatchObject({ van: '2026-09-01', tot: '2026-09-30', dagen: 30, lopend: false, heel: true })
    expect(vensterNaam(v)).toBe('september 2026')
    expect(dagenIn(v)).toBe(30)
  })

  it('vergelijkt een lopende maand met hetzelfde aantal dagen', () => {
    const huidig = maandVenster('2026-10', '2026-10-14')
    const vorige = vergelijkVenster('2026-09', huidig)
    expect(vorige).toMatchObject({ van: '2026-09-01', tot: '2026-09-14', dagen: 14, heel: false })
    expect(vensterNaam(vorige)).toBe('1 tot en met 14 september 2026')
    expect(vensterNaam(vergelijkVenster('2025-10', huidig))).toBe('1 tot en met 14 oktober 2025')
  })

  it('kapt af op de lengte van de kortere maand', () => {
    const huidig = maandVenster('2026-03', '2026-03-31')
    const feb = vergelijkVenster('2026-02', huidig)
    expect(feb).toMatchObject({ tot: '2026-02-28', dagen: 28, heel: true })
    expect(vensterNaam(feb)).toBe('februari 2026')
    expect(vergelijkVenster('2024-02', maandVenster('2024-03', '2024-03-30')).tot).toBe('2024-02-29')
  })

  it('vergelijkt een afgesloten maand met de hele andere maand', () => {
    const huidig = maandVenster('2026-10', '2026-11-02')
    expect(vergelijkVenster('2026-09', huidig)).toMatchObject({ tot: '2026-09-30', dagen: 30, heel: true })
    expect(vergelijkVenster('2028-02', maandVenster('2028-03', '2028-04-01'))).toMatchObject({ dagen: 29, heel: true })
  })

  it('de laatste dag van een lopende maand blijft als lopend benoemd', () => {
    const v = maandVenster('2026-10', '2026-10-31')
    expect(v).toMatchObject({ lopend: true, heel: true })
    expect(vensterNaam(v)).toBe('1 tot en met 31 oktober 2026')
    expect(vensterNaam(maandVenster('2026-10', '2026-10-01'))).toBe('1 oktober 2026')
  })
})

describe('rekenen met vergelijkingen', () => {
  it('vergelijkt alleen als beide kanten er zijn', () => {
    expect(vergelijk(110, 100)).toEqual({ basis: 100, verschil: 10, relatief: 0.1 })
    expect(vergelijk(5, 0)).toEqual({ basis: 0, verschil: 5, relatief: null })
    expect(vergelijk(null, 100)).toBeNull()
    expect(vergelijk(100, null)).toBeNull()
  })

  it('weet of hoger of lager beter is', () => {
    expect(oordeel({ basis: 1, verschil: 2, relatief: 2 }, 'hoger')).toBe('beter')
    expect(oordeel({ basis: 1, verschil: 2, relatief: 2 }, 'lager')).toBe('slechter')
    expect(oordeel({ basis: 1, verschil: 0, relatief: 0 }, 'hoger')).toBe('gelijk')
    expect(oordeel({ basis: 1, verschil: 2, relatief: 2 }, null)).toBe('gelijk')
  })

  it('rekent gemiddelden per week en per lid', () => {
    expect(perWeek(310, 31)).toBe(70)
    expect(perWeek(140, 14)).toBe(70)
    expect(perWeek(10, 0)).toBe(0)
    expect(perLidPerWeek(310, 31, 35)).toBe(2)
    expect(perLidPerWeek(310, 31, 0)).toBeNull()
    expect(aandeel(1, 4)).toBe(0.25)
    expect(aandeel(1, 0)).toBeNull()
  })
})
