import { describe, expect, it } from 'vitest'
import { contrast, THEMA_BASIS } from '@/lib/club/kern/huisstijl'
import { dominanteKleur, hsl, kleurVoorstel } from './logo-kleur'

type Pixel = [number, number, number, number]

/** Een plaatje als RGBA-reeks uit blokken van dezelfde kleur. */
function plaatje(...blokken: [Pixel, number][]): Uint8ClampedArray {
  const pixels = blokken.flatMap(([p, n]) => Array.from({ length: n }, () => p))
  return new Uint8ClampedArray(pixels.flat())
}

const WIT: Pixel = [255, 255, 255, 255]
const ZWART: Pixel = [10, 10, 10, 255]
const GRIJS: Pixel = [128, 128, 128, 255]
const LEEG: Pixel = [0, 0, 0, 0]
const ROOD: Pixel = [220, 30, 40, 255]
const BLAUW: Pixel = [30, 90, 220, 255]

describe('hsl', () => {
  it('rekent verzadiging en lichtheid', () => {
    expect(hsl(255, 255, 255)).toEqual({ s: 0, l: 1 })
    expect(hsl(255, 0, 0).s).toBeCloseTo(1)
    expect(hsl(255, 0, 0).l).toBeCloseTo(0.5)
  })
})

describe('dominanteKleur', () => {
  it('vindt de merkkleur en negeert wit, zwart, grijs en doorzichtig', () => {
    expect(dominanteKleur(plaatje([LEEG, 500], [WIT, 300], [ZWART, 200], [GRIJS, 100], [ROOD, 60]))).toBe('#DC1E28')
  })

  it('kiest de kleur die het meest voorkomt', () => {
    expect(dominanteKleur(plaatje([ROOD, 40], [BLAUW, 120], [WIT, 100]))).toBe('#1E5ADC')
  })

  it('middelt tinten die op elkaar lijken', () => {
    const uit = dominanteKleur(plaatje([[200, 40, 40, 255], 50], [[210, 50, 50, 255], 50]))
    expect(uit).toBe('#CD2D2D')
  })

  it('geeft null bij een zwart-wit logo of een leeg plaatje', () => {
    expect(dominanteKleur(plaatje([WIT, 500], [ZWART, 500]))).toBeNull()
    expect(dominanteKleur(plaatje([LEEG, 100]))).toBeNull()
    expect(dominanteKleur(new Uint8ClampedArray())).toBeNull()
  })

  it('negeert een klein kleurspatje op een verder zwart logo', () => {
    expect(dominanteKleur(plaatje([ZWART, 1000], [ROOD, 5]))).toBeNull()
  })

  it('negeert half doorzichtige randpixels', () => {
    expect(dominanteKleur(plaatje([[220, 30, 40, 80], 100], [BLAUW, 10]))).toBe('#1E5ADC')
  })
})

describe('kleurVoorstel', () => {
  it('houdt een kleur met genoeg contrast zoals hij is', () => {
    const v = kleurVoorstel('#b58e5c', 'donker')
    expect(v.kleur).toBe('#B58E5C')
    expect(v.aangepast).toBe(false)
  })

  it('schuift een donkere kleur bij op een donker thema, en geeft genoeg contrast', () => {
    const v = kleurVoorstel('#1A237E', 'donker')
    expect(v.aangepast).toBe(true)
    expect(v.kleur).toBe('#1A237E')
    expect(contrast(v.knop, THEMA_BASIS.donker.bgApp)).toBeGreaterThanOrEqual(3)
    expect(contrast(v.tekst, THEMA_BASIS.donker.bgApp)).toBeGreaterThanOrEqual(4.5)
  })

  it('schuift een lichte kleur bij op een licht thema', () => {
    const v = kleurVoorstel('#FFE082', 'licht')
    expect(v.aangepast).toBe(true)
    expect(contrast(v.tekst, THEMA_BASIS.licht.bgCard)).toBeGreaterThanOrEqual(4.5)
  })
})
