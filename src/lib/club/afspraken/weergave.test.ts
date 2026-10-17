import { describe, expect, it } from 'vitest'
import type { Openingstijden } from '@/lib/club/rooster/openingstijden'
import { isWeergave, nlDatumTijd, perDag, plekInRaster, rasterVoorDag, tel, tijdvak, urenIn } from './weergave'

// Maandag 19 oktober 2026, zomertijd (UTC+2).
const MAANDAG = '2026-10-19'

describe('nlDatumTijd en tijdvak', () => {
  it('geeft de Nederlandse datum en tijd', () => {
    expect(nlDatumTijd('2026-10-19T22:30:00.000Z')).toEqual({ datum: '2026-10-20', tijd: '00:30', minuten: 30 })
  })

  it('schrijft een tijdvak zonder streepje', () => {
    expect(tijdvak({ start: '2026-10-19T07:00:00.000Z', eind: '2026-10-19T07:45:00.000Z' })).toBe('09:00 tot 09:45')
  })
})

describe('perDag', () => {
  it('verdeelt over zeven dagen en sorteert op begintijd', () => {
    // Arrange
    const lijst = [
      { id: 'b', start: '2026-10-19T10:00:00.000Z' },
      { id: 'a', start: '2026-10-19T07:00:00.000Z' },
      { id: 'c', start: '2026-10-25T09:00:00.000Z' },
    ]
    // Act
    const dagen = perDag(lijst, MAANDAG)
    // Assert
    expect(dagen).toHaveLength(7)
    expect(dagen[0].afspraken.map((a) => a.id)).toEqual(['a', 'b'])
    expect(dagen[6].afspraken.map((a) => a.id)).toEqual(['c'])
  })
})

describe('rasterVoorDag', () => {
  const open = [{ van: '06:30', tot: '22:15' }, null, null, null, null, null, null] as unknown as Openingstijden

  it('rondt de openingstijd af op hele uren', () => {
    expect(rasterVoorDag(open, 1)).toEqual({ van: 360, tot: 1380 })
  })

  it('valt terug op 07:00 tot 22:00 als de dag dicht of onbekend is', () => {
    expect(rasterVoorDag(open, 2)).toEqual({ van: 420, tot: 1320 })
    expect(rasterVoorDag(null, 1)).toEqual({ van: 420, tot: 1320 })
  })
})

describe('urenIn', () => {
  it('geeft elk heel uur inclusief het eind', () => {
    expect(urenIn({ van: 420, tot: 600 })).toEqual([420, 480, 540, 600])
  })
})

describe('plekInRaster', () => {
  const raster = { van: 480, tot: 1080 }

  it('rekent boven en hoogte in procenten', () => {
    // 09:00 tot 10:00 NL in een raster van 08:00 tot 18:00
    const plek = plekInRaster({ start: '2026-10-19T07:00:00.000Z', eind: '2026-10-19T08:00:00.000Z' }, MAANDAG, raster)
    expect(plek).toEqual({ boven: 10, hoogte: 10 })
  })

  it('knipt af op de rand van het raster', () => {
    const plek = plekInRaster({ start: '2026-10-19T15:30:00.000Z', eind: '2026-10-19T17:00:00.000Z' }, MAANDAG, raster)
    expect(plek?.boven).toBe(95)
    expect(plek?.hoogte).toBeCloseTo(5)
  })

  it('geeft null voor een andere dag of buiten het raster', () => {
    expect(plekInRaster({ start: '2026-10-20T07:00:00.000Z', eind: '2026-10-20T08:00:00.000Z' }, MAANDAG, raster)).toBeNull()
    expect(plekInRaster({ start: '2026-10-19T04:00:00.000Z', eind: '2026-10-19T05:00:00.000Z' }, MAANDAG, raster)).toBeNull()
  })
})

describe('tel', () => {
  it('telt per status en berekent de opkomst', () => {
    const uit = tel([{ status: 'geweest' }, { status: 'geweest' }, { status: 'geweest' }, { status: 'niet_gekomen' }, { status: 'gepland' }, { status: 'geannuleerd' }])
    expect(uit).toEqual({ gepland: 1, geweest: 3, niet_gekomen: 1, geannuleerd: 1, opkomst: 75 })
  })

  it('geeft geen opkomst zonder afgeronde afspraken', () => {
    expect(tel([{ status: 'gepland' }]).opkomst).toBeNull()
  })
})

describe('isWeergave', () => {
  it('kent alleen week en dag', () => {
    expect(isWeergave('dag')).toBe(true)
    expect(isWeergave('maand')).toBe(false)
  })
})
