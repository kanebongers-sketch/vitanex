import { describe, expect, it } from 'vitest'
import { FrameVoorraad, MAX_OEFENINGEN, PLAFOND_TELEFOON, PLAFOND_ZUINIG, isTelefoon, plafondVoor, uitgepaktBytes } from './geheugen'
import { kiesMaat } from './render-bron'

const MATEN = [{ breedte: 480 }, { breedte: 720 }, { breedte: 1080 }]

describe('groottekeuze', () => {
  it('telefoon: grove aanwijzer en korte zijde onder 600 css-px', () => {
    expect(isTelefoon(true, 390)).toBe(true)
    expect(isTelefoon(true, 820)).toBe(false)
    expect(isTelefoon(false, 390)).toBe(false)
    expect(isTelefoon(true, Number.NaN)).toBe(false)
  })

  it('plafond: 720 op telefoons, 480 bij databesparing, geen op grote schermen', () => {
    expect(plafondVoor({ telefoon: true, zuinig: false })).toBe(PLAFOND_TELEFOON)
    expect(plafondVoor({ telefoon: true, zuinig: true })).toBe(PLAFOND_ZUINIG)
    expect(plafondVoor({ telefoon: false, zuinig: true })).toBe(PLAFOND_ZUINIG)
    expect(plafondVoor({ telefoon: false, zuinig: false })).toBeNull()
  })

  it('iPhone (390 css-px, dpr 3) krijgt 720 in plaats van 1080; een groot scherm houdt HD', () => {
    const iphone = plafondVoor({ telefoon: isTelefoon(true, 390), zuinig: false })
    expect(kiesMaat(MATEN, 390, 3, iphone)?.breedte).toBe(720)
    expect(kiesMaat(MATEN, 700, 2, plafondVoor({ telefoon: false, zuinig: false }))?.breedte).toBe(1080)
  })

  it('geheugen van 72 frames: 1080 ongeveer 336 MB, 720 ongeveer 149 MB', () => {
    expect(Math.round(uitgepaktBytes(72, 1080) / 1e6)).toBe(336)
    expect(Math.round(uitgepaktBytes(72, 720) / 1e6)).toBe(149)
  })
})

function maakVoorraad() {
  const dicht: string[] = []
  const weg: string[] = []
  const v = new FrameVoorraad<string, string>(MAX_OEFENINGEN, (k) => dicht.push(k), (r) => weg.push(r))
  return { v, dicht, weg }
}

describe('FrameVoorraad', () => {
  it('geeft uitgepakte frames vrij zodra niemand ze meer gebruikt, de bestanden blijven', () => {
    const { v, dicht } = maakVoorraad()
    v.pak('a')
    v.zetRuw('a', 'ruw-a')
    expect(v.zetKlaar('a', 'klaar-a')).toBe(true)
    expect(v.klaar('a')).toBe('klaar-a')
    v.laatGaan('a')
    expect(dicht).toEqual(['klaar-a'])
    expect(v.klaar('a')).toBeNull()
    expect(v.ruw('a')).toBe('ruw-a')
  })

  it('twee spelers op dezelfde oefening: pas vrij als de laatste stopt', () => {
    const { v, dicht } = maakVoorraad()
    v.pak('a')
    v.pak('a')
    v.zetKlaar('a', 'klaar-a')
    v.laatGaan('a')
    expect(dicht).toEqual([])
    v.laatGaan('a')
    expect(dicht).toEqual(['klaar-a'])
  })

  it('bewaart hoogstens de laatste 2 oefeningen en ruimt de oudste op', () => {
    const { v, weg } = maakVoorraad()
    for (const s of ['a', 'b', 'c']) {
      v.pak(s)
      v.zetRuw(s, `ruw-${s}`)
      v.laatGaan(s)
    }
    expect(v.sleutels()).toEqual(['b', 'c'])
    expect(weg).toEqual(['ruw-a'])
    expect(v.ruw('a')).toBeNull()
  })

  it('opnieuw openen maakt een oefening weer de nieuwste', () => {
    const { v } = maakVoorraad()
    for (const s of ['a', 'b']) {
      v.pak(s)
      v.laatGaan(s)
    }
    v.pak('a')
    v.laatGaan('a')
    v.pak('c')
    expect(v.sleutels()).toEqual(['a', 'c'])
  })

  it('ruimt nooit een oefening op die nog in gebruik is', () => {
    const { v, dicht } = maakVoorraad()
    v.pak('a')
    v.zetKlaar('a', 'klaar-a')
    v.pak('b')
    v.pak('c')
    expect(v.sleutels()).toEqual(['a', 'b', 'c'])
    expect(dicht).toEqual([])
    v.laatGaan('b')
    expect(v.sleutels()).toEqual(['a', 'c'])
  })

  it('uitgepakt na het weggaan van de speler wordt meteen vrijgegeven', () => {
    const { v, dicht } = maakVoorraad()
    v.pak('a')
    v.laatGaan('a')
    expect(v.zetKlaar('a', 'laat')).toBe(false)
    expect(dicht).toEqual(['laat'])
    expect(v.klaar('a')).toBeNull()
  })

  it('bestanden voor een oefening die al uit de voorraad is, worden meteen losgelaten', () => {
    const { v, weg } = maakVoorraad()
    expect(v.zetRuw('x', 'ruw-x')).toBe(false)
    expect(weg).toEqual(['ruw-x'])
  })

  it('laatGaan zonder pak of te vaak doet niets geks', () => {
    const { v, dicht } = maakVoorraad()
    v.laatGaan('onbekend')
    v.pak('a')
    v.laatGaan('a')
    v.laatGaan('a')
    expect(v.inGebruik('a')).toBe(false)
    expect(dicht).toEqual([])
  })
})
