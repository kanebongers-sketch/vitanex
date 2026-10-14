import { describe, expect, it } from 'vitest'
import { dagenTussen, dagLang, dagSleutel, dagStart, jarigOp, leeftijdOp, maandagVan, nlMoment, plusDagen, tijdNl, weekdagVan } from './tijd'
import { kiesBereik, kiesPeriode, periodeStart, wekenReeks } from './periode'

describe('tijd in Nederland', () => {
  it('rekent een bezoek na middernacht NL tot de nieuwe dag', () => {
    // 23:30 UTC op 13 oktober = 01:30 NL op 14 oktober (zomertijd)
    const m = nlMoment(new Date('2026-10-13T23:30:00Z'))
    expect(m.dag).toBe('2026-10-14')
    expect(m.uur).toBe(1)
    expect(m.weekdag).toBe(3)
  })

  it('vindt het begin van de dag, ook rond de wisseling van zomer- naar wintertijd', () => {
    expect(dagStart('2026-10-14').toISOString()).toBe('2026-10-13T22:00:00.000Z')
    expect(dagStart('2026-10-25').toISOString()).toBe('2026-10-24T22:00:00.000Z')
    expect(dagStart('2026-10-26').toISOString()).toBe('2026-10-25T23:00:00.000Z')
    expect(dagStart('2026-03-29').toISOString()).toBe('2026-03-28T23:00:00.000Z')
  })

  it('telt dagen en weken met maandag als start', () => {
    expect(weekdagVan('2026-10-14')).toBe(3)
    expect(weekdagVan('2026-10-18')).toBe(7)
    expect(maandagVan('2026-10-18')).toBe('2026-10-12')
    expect(plusDagen('2026-12-31', 1)).toBe('2027-01-01')
    expect(dagenTussen('2026-10-01', '2026-10-22')).toBe(21)
  })

  it('schrijft dagen en tijden in het Nederlands', () => {
    expect(dagLang('2026-10-14')).toBe('woensdag 14 oktober')
    expect(tijdNl(new Date('2026-10-14T17:30:00Z'))).toBe('19:30')
    expect(dagSleutel(new Date('2026-01-01T00:30:00Z'))).toBe('2026-01-01')
  })

  it('berekent leeftijd en verjaardagen', () => {
    expect(leeftijdOp('1990-10-15', '2026-10-14')).toBe(35)
    expect(leeftijdOp('1990-10-14', '2026-10-14')).toBe(36)
    expect(leeftijdOp(null, '2026-10-14')).toBeNull()
    expect(jarigOp('1990-10-14', '2026-10-14')).toBe(true)
    expect(jarigOp('2000-02-29', '2027-02-28')).toBe(true)
    expect(jarigOp('2000-02-29', '2028-02-28')).toBe(false)
  })
})

describe('periode uit de URL', () => {
  it('accepteert alleen 4, 12, 26 of 52 weken', () => {
    expect(kiesPeriode('26')).toBe(26)
    expect(kiesPeriode('5')).toBe(12)
    expect(kiesPeriode(undefined)).toBe(12)
    expect(kiesPeriode(['52'])).toBe(52)
  })

  it('kent alleen het bereik alle of de vestiging', () => {
    expect(kiesBereik('alle')).toBe('alle')
    expect(kiesBereik('iets')).toBe('vestiging')
  })

  it('maakt een reeks maandagen met de lopende week als laatste', () => {
    const r = wekenReeks('2026-10-14', 4)
    expect(r).toEqual(['2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12'])
    expect(periodeStart('2026-10-14', 4)).toBe('2026-09-21')
  })
})
