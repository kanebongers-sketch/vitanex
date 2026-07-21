import { describe, it, expect } from 'vitest'
import {
  blokStijlVoorKleur,
  contrast,
  leesHex,
  luminantie,
  meng,
  naarHex,
} from './kleur'

// De pure kleurhelpers voor de multi-agenda-weergave: hex parsen (systeemgrens
// op Google's backgroundColor), mengen, WCAG-luminantie/contrast, en de
// tekstkleur-keuze per blok. Geen browser — precies de stukken die stil kapot
// kunnen gaan.

describe('leesHex', () => {
  it('leest een 6-cijferige hex met #', () => {
    expect(leesHex('#00E5FF')).toEqual({ r: 0, g: 229, b: 255 })
  })

  it('leest een 6-cijferige hex zonder #', () => {
    expect(leesHex('7986cb')).toEqual({ r: 121, g: 134, b: 203 })
  })

  it('leest een 3-cijferige short hex', () => {
    // #abc → #aabbcc
    expect(leesHex('#abc')).toEqual({ r: 170, g: 187, b: 204 })
  })

  it('trimt witruimte', () => {
    expect(leesHex('  #ffffff  ')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('valt terug op null bij onzin', () => {
    expect(leesHex('')).toBeNull()
    expect(leesHex('rood')).toBeNull()
    expect(leesHex('#12')).toBeNull()
    expect(leesHex('#1234')).toBeNull()
    expect(leesHex('#gggggg')).toBeNull()
  })
})

describe('naarHex', () => {
  it('formatteert RGB naar #rrggbb in kleine letters', () => {
    expect(naarHex({ r: 0, g: 229, b: 255 })).toBe('#00e5ff')
  })

  it('rondt af en klemt op 0–255', () => {
    expect(naarHex({ r: -10, g: 300, b: 127.6 })).toBe('#00ff80')
  })

  it('is de inverse van leesHex voor een 6-cijferige kleur', () => {
    const rgb = leesHex('#33b679')
    expect(rgb).not.toBeNull()
    if (rgb) expect(naarHex(rgb)).toBe('#33b679')
  })
})

describe('meng', () => {
  it('geeft puur a bij fractie 0 en puur b bij fractie 1', () => {
    const a = { r: 0, g: 0, b: 0 }
    const b = { r: 255, g: 255, b: 255 }
    expect(meng(a, b, 0)).toEqual(a)
    expect(meng(a, b, 1)).toEqual(b)
  })

  it('mengt lineair op de helft', () => {
    expect(meng({ r: 0, g: 0, b: 0 }, { r: 200, g: 100, b: 50 }, 0.5)).toEqual({
      r: 100,
      g: 50,
      b: 25,
    })
  })

  it('klemt een fractie buiten [0,1]', () => {
    const a = { r: 10, g: 10, b: 10 }
    const b = { r: 250, g: 250, b: 250 }
    expect(meng(a, b, -1)).toEqual(a)
    expect(meng(a, b, 2)).toEqual(b)
  })
})

describe('luminantie', () => {
  it('is 0 voor zwart en 1 voor wit', () => {
    expect(luminantie({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5)
    expect(luminantie({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
  })

  it('weegt groen zwaarder dan blauw', () => {
    const groen = luminantie({ r: 0, g: 255, b: 0 })
    const blauw = luminantie({ r: 0, g: 0, b: 255 })
    expect(groen).toBeGreaterThan(blauw)
  })
})

describe('contrast', () => {
  it('geeft 21 voor zwart tegen wit', () => {
    expect(contrast({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 1)
  })

  it('geeft 1 voor twee gelijke kleuren', () => {
    expect(contrast({ r: 120, g: 120, b: 120 }, { r: 120, g: 120, b: 120 })).toBeCloseTo(1, 5)
  })

  it('is symmetrisch (volgorde maakt niet uit)', () => {
    const a = { r: 20, g: 80, b: 200 }
    const b = { r: 240, g: 240, b: 240 }
    expect(contrast(a, b)).toBeCloseTo(contrast(b, a), 10)
  })
})

describe('blokStijlVoorKleur', () => {
  it('valt terug op null bij null of een onleesbare kleur', () => {
    expect(blokStijlVoorKleur(null)).toBeNull()
    expect(blokStijlVoorKleur('geen-kleur')).toBeNull()
  })

  it('kiest donkere tekst op een lichte agenda-kleur', () => {
    // Fel geel (feestdagen/verjaardagen): licht → donkere tekst leest beter.
    const stijl = blokStijlVoorKleur('#f6bf26')
    expect(stijl).not.toBeNull()
    expect(stijl?.tekst).toBe('#0B1B3A')
  })

  it('kiest lichte tekst op een donkere agenda-kleur', () => {
    // Diep blauwviolet: donker → witte tekst leest beter.
    const stijl = blokStijlVoorKleur('#3f51b5')
    expect(stijl).not.toBeNull()
    expect(stijl?.tekst).toBe('#EAF2FF')
  })

  it('houdt de volle kleur als rand en mengt de achtergrond met navy', () => {
    const stijl = blokStijlVoorKleur('#33b679')
    expect(stijl).not.toBeNull()
    // De rand is de exacte agenda-kleur; de achtergrond is een iets donkerdere
    // menging (dus niet identiek aan de rand).
    expect(stijl?.rand).toBe('#33b679')
    expect(stijl?.achtergrond).not.toBe('#33b679')
  })

  it('kiest de tekstkleur met het hoogste werkelijke contrast', () => {
    // Diepere garantie dan de losse cases: welke tekstkleur ook gekozen wordt,
    // het is aantoonbaar de best contrasterende van de twee.
    for (const kleur of ['#00E5FF', '#f6bf26', '#3f51b5', '#e67c73', '#7986cb']) {
      const stijl = blokStijlVoorKleur(kleur)
      expect(stijl).not.toBeNull()
      if (!stijl) continue
      const bg = leesHex(stijl.achtergrond)
      const tekst = leesHex(stijl.tekst)
      const licht = leesHex('#EAF2FF')
      const donker = leesHex('#0B1B3A')
      if (!bg || !tekst || !licht || !donker) throw new Error('kleuren moeten parsen')
      const gekozen = contrast(bg, tekst)
      // Vergelijk de gekozen HEX (`stijl.tekst`), niet de geparste `Rgb`: de andere
      // tekstkleur is donker als de gekozene licht is, en andersom.
      const andere = contrast(bg, stijl.tekst === '#EAF2FF' ? donker : licht)
      expect(gekozen).toBeGreaterThanOrEqual(andere)
    }
  })
})
