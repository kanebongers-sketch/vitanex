import { describe, it, expect } from 'vitest'
import type { HerstelMeting } from './herstel'
import { bronVanVeld, groepeerPerDag, heeftMeting, herkomstVan, laatsteGemeten } from './week'

const DATUM = '2026-07-15'

function meting(over: Partial<HerstelMeting> & { bron: HerstelMeting['bron'] }): HerstelMeting {
  return {
    datum: DATUM,
    hrvMs: null,
    rustHartslag: null,
    slaapMinuten: null,
    slaapEfficientie: null,
    leverancierScore: null,
    ...over,
  }
}

describe('herkomst per veld', () => {
  it('wijst per veld de bron aan die het cijfer draagt', () => {
    // Arrange — Whoop meet HRV, Oura de slaap.
    const whoop = meting({ bron: 'whoop', hrvMs: 64, leverancierScore: 78 })
    const oura = meting({ bron: 'oura', slaapMinuten: 421 })

    // Act
    const h = herkomstVan([whoop, oura], meting({
      bron: 'whoop', hrvMs: 64, slaapMinuten: 421, leverancierScore: 78,
    }))

    // Assert
    expect(h.hrvMs).toBe('whoop')
    expect(h.slaapMinuten).toBe('oura')
    expect(h.leverancierScore).toBe('whoop')
  })

  it('geeft null voor een veld dat niemand mat', () => {
    const h = herkomstVan([meting({ bron: 'whoop', hrvMs: 64 })], meting({ bron: 'whoop', hrvMs: 64 }))
    expect(h.slaapMinuten).toBeNull()
    expect(h.rustHartslag).toBeNull()
  })

  it('kiest de hoogst gerangschikte bron als twee hetzelfde meten', () => {
    // Arrange — beide melden 64ms; voegSamen zou Whoop kiezen (hogere rang).
    const whoop = meting({ bron: 'whoop', hrvMs: 64 })
    const garmin = meting({ bron: 'garmin', hrvMs: 64 })

    // Act
    const bron = bronVanVeld([garmin, whoop], 'hrvMs', 64)

    // Assert
    expect(bron).toBe('whoop')
  })

  it('wijst nooit Garmin aan als herkomst van een leverancier-score', () => {
    // Arrange — Garmins body battery is geen herstelscore. Als hij toevallig
    // hetzelfde getal heeft als Whoop's recovery, mag hij niet als bron van dat
    // cijfer worden getoond.
    const whoop = meting({ bron: 'whoop', leverancierScore: 70 })
    const garmin = meting({ bron: 'garmin', leverancierScore: 70 })

    // Act
    const bron = bronVanVeld([garmin, whoop], 'leverancierScore', 70)

    // Assert
    expect(bron).toBe('whoop')
  })

  it('geeft geen herkomst als alleen een niet-vergelijkbare bron dat getal heeft', () => {
    // Arrange — alleen Garmin, met body battery 12.
    const garmin = meting({ bron: 'garmin', leverancierScore: 12 })

    // Act — voegSamen zou hier leverancierScore op null zetten, dus er is ook
    // geen herkomst te tonen.
    expect(bronVanVeld([garmin], 'leverancierScore', 12)).toBeNull()
  })
})

describe('groepeerPerDag', () => {
  it('geeft een rij voor élke dag, ook zonder metingen', () => {
    // Arrange
    const dagen = ['2026-07-13', '2026-07-14', '2026-07-15']
    const m = meting({ bron: 'oura', datum: '2026-07-15', hrvMs: 55 })

    // Act
    const rijen = groepeerPerDag([m], dagen)

    // Assert — een gat is informatie; de lijst wordt er niet korter van.
    expect(rijen).toHaveLength(3)
    expect(rijen[0]?.samen).toBeNull()
    expect(rijen[0]?.bronnen).toEqual([])
    expect(rijen[2]?.samen?.hrvMs).toBe(55)
    expect(rijen[2]?.bronnen).toEqual(['oura'])
  })

  it('voegt twee bronnen op dezelfde dag per veld samen', () => {
    // Arrange
    const dagen = [DATUM]
    const whoop = meting({ bron: 'whoop', hrvMs: 64 })
    const oura = meting({ bron: 'oura', slaapMinuten: 421 })

    // Act
    const [dag] = groepeerPerDag([whoop, oura], dagen)

    // Assert
    expect(dag?.samen?.hrvMs).toBe(64)
    expect(dag?.samen?.slaapMinuten).toBe(421)
    expect(dag?.herkomst.hrvMs).toBe('whoop')
    expect(dag?.herkomst.slaapMinuten).toBe('oura')
  })
})

describe('heeftMeting', () => {
  it('herkent een lege huls als "niets gemeten"', () => {
    // Arrange — een rij die bestaat maar waarin geen enkel veld gevuld is.
    expect(heeftMeting(meting({ bron: 'whoop' }))).toBe(false)
    expect(heeftMeting(meting({ bron: 'whoop', rustHartslag: 48 }))).toBe(true)
  })
})

describe('laatsteGemeten', () => {
  it('slaat lege dagen over en pakt de laatste échte meting', () => {
    // Arrange
    const dagen = groepeerPerDag(
      [meting({ bron: 'oura', datum: '2026-07-14', hrvMs: 55 })],
      ['2026-07-14', '2026-07-15'],
    )

    // Act
    const laatste = laatsteGemeten(dagen)

    // Assert — vandaag is nog leeg; dan toon je gisteren, niet "niets".
    expect(laatste?.datum).toBe('2026-07-14')
  })

  it('geeft null als er de hele week niets gemeten is', () => {
    const dagen = groepeerPerDag([], ['2026-07-14', '2026-07-15'])
    expect(laatsteGemeten(dagen)).toBeNull()
  })
})
