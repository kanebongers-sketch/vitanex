import { describe, expect, test } from 'vitest'
import { grafiekDomein, labelIndexen, rasterWaarden, yProcent } from './grafiek'

const normaal = { mediaan: 60, laag: 58, hoog: 62, aantal: 20, vanaf: '2026-09-11', tot: '2026-10-08' }

describe('grafiekDomein', () => {
  test('staven beginnen bij 0 en hebben lucht boven de hoogste waarde', () => {
    // Arrange
    const waarden = [4000, null, 10000]
    // Act
    const domein = grafiekDomein(waarden, null, 'staaf')
    // Assert
    expect(domein).toEqual({ min: 0, max: 11000 })
  })

  test('lijnen omvatten de data én de normaal', () => {
    const domein = grafiekDomein([55, 57], normaal, 'lijn')
    expect(domein.min).toBeLessThan(55)
    expect(domein.max).toBeGreaterThan(62)
  })

  test('zonder data een veilig standaarddomein', () => {
    expect(grafiekDomein([null, null], null, 'lijn')).toEqual({ min: 0, max: 1 })
  })

  test('één constante waarde geeft toch een bereik', () => {
    const domein = grafiekDomein([80, 80], null, 'lijn')
    expect(domein.max).toBeGreaterThan(domein.min)
  })
})

describe('schaalhulpen', () => {
  test('raster en y-positie', () => {
    const domein = { min: 0, max: 100 }
    expect(rasterWaarden(domein)).toEqual([0, 50, 100])
    expect(yProcent(100, domein)).toBe(0)
    expect(yProcent(25, domein)).toBe(75)
  })

  test('labels: eerste en laatste altijd, nooit meer dan het maximum', () => {
    expect(labelIndexen(30)).toEqual([0, 7, 15, 22, 29])
    expect(labelIndexen(3)).toEqual([0, 1, 2])
    expect(labelIndexen(0)).toEqual([])
  })
})
