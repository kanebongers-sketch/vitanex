import { describe, expect, it } from 'vitest'
import { OEFENRENDERS, type OefenRender } from '@/components/aiyourgym/inhoud/oefenrenders'
import { kiesLus, lusFase, posterSleutel, posterVan, verhoudingVan, vloerVan, VLOER_STANDAARD, type LusInvoer } from './oefenlus-logica'

// De regels achter een rustig eerste beeld: de juiste lus per vak, de poster
// per stand, de vloerlijn en wanneer de lus zichtbaar mag worden.

const render = OEFENRENDERS[0] as OefenRender

describe('kiesLus', () => {
  it('kiest op de pc met een gewoon scherm de lus van 720 px voor een vak van 600 px', () => {
    expect(kiesLus(render, { breedte: 600, hoogte: 920, dpr: 1, telefoon: false })).toBe(render.lus)
  })

  it('kiest op retina de HD-lus', () => {
    expect(kiesLus(render, { breedte: 600, hoogte: 920, dpr: 2, telefoon: false })).toBe(render.lusHd)
  })

  it('neemt de kortste zijde: een hoog smal vak heeft geen HD nodig', () => {
    expect(kiesLus(render, { breedte: 400, hoogte: 1000, dpr: 1, telefoon: false })).toBe(render.lusKlein)
  })

  it('geeft een telefoon nooit de HD-lus, ook niet met 3x scherm', () => {
    expect(kiesLus(render, { breedte: 360, hoogte: 360, dpr: 3, telefoon: true })).toBe(render.lus)
  })

  it('valt bij een vak zonder maat terug op de kleinste lus', () => {
    expect(kiesLus(render, { breedte: 0, hoogte: 0, dpr: 2, telefoon: false })).toBe(render.lusKlein)
  })
})

describe('poster', () => {
  it('toont het zwaarste punt alleen bij stand eind', () => {
    expect(posterVan(render, 'eind').groot).toBe(render.piek)
    expect(posterVan(render, 'begin').groot).toBe(render.begin)
    expect(posterVan(render, 'speelt').klein).toBe(render.beginKlein)
  })

  it('heeft per oefening een eigen sleutel, en speelt en begin delen de poster', () => {
    const sleutels = new Set(OEFENRENDERS.map((r) => posterSleutel(r, 'speelt')))
    expect(sleutels.size).toBe(OEFENRENDERS.length)
    expect(posterSleutel(render, 'speelt')).toBe(posterSleutel(render, 'begin'))
  })
})

describe('vloer en verhouding', () => {
  it('leest vloer_y of vloerY en valt anders terug op de standaard', () => {
    expect(vloerVan({ ...render, vloerY: 0.74 } as OefenRender)).toBe(0.74)
    expect(vloerVan({ ...render, vloerY: undefined, vloer_y: 0.62 } as unknown as OefenRender)).toBe(0.62)
    expect(vloerVan({ ...render, vloerY: 7 } as OefenRender)).toBe(VLOER_STANDAARD)
    expect(vloerVan({ ...render, vloerY: undefined } as unknown as OefenRender)).toBeGreaterThan(0.3)
  })

  it('heeft voor elke render een geldige verhouding en vloer', () => {
    for (const r of OEFENRENDERS) {
      expect(verhoudingVan(r)).toBeGreaterThan(0.5)
      expect(verhoudingVan(r)).toBeLessThan(2)
      expect(vloerVan(r)).toBeGreaterThan(0.3)
      expect(vloerVan(r)).toBeLessThanOrEqual(1)
    }
  })
})

describe('lusFase', () => {
  const basis: LusInvoer = { speelt: true, inBeeld: true, posterKlaar: true, lusSleutel: 'a', lusKlaar: null }

  it('laadt de lus onzichtbaar tot decode() klaar is', () => {
    expect(lusFase(basis)).toBe('laden')
    expect(lusFase({ ...basis, lusKlaar: 'a' })).toBe('speelt')
  })

  it('toont een gedecodeerde lus van een andere oefening nooit', () => {
    expect(lusFase({ ...basis, lusSleutel: 'b', lusKlaar: 'a' })).toBe('laden')
  })

  it('haalt geen lus op zolang de poster er niet staat', () => {
    expect(lusFase({ ...basis, posterKlaar: false, lusKlaar: 'a' })).toBe('stil')
  })

  it('blijft stil buiten beeld, bij pauze of minder beweging', () => {
    expect(lusFase({ ...basis, inBeeld: false, lusKlaar: 'a' })).toBe('stil')
    expect(lusFase({ ...basis, speelt: false, lusKlaar: 'a' })).toBe('stil')
    expect(lusFase({ ...basis, lusSleutel: null })).toBe('stil')
  })
})
