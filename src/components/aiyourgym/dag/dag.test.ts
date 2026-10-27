import { describe, expect, it } from 'vitest'
import { ROLLEN } from '@/components/aiyourgym/inhoud/systeem'
import { actiefAnker, formatKlok, HOUD, klokMinuten, type Anker } from './klok'
import { demp, heldVoortgang, pointerAs } from './diepte'
import { DAG_MOMENTEN, ROL_TIJD } from './momenten'
import { eindStand, faseVan, FASEN, GRENZEN, pinVoortgang, standVan, zelfdeStand, zichtbaar } from './schema-bouw'

const ANKERS: Anker[] = [
  { top: 0, minuten: 360 },
  { top: 1000, minuten: 420 },
  { top: 2000, minuten: 630 },
]

describe('dagklok', () => {
  it('schrijft tijden met twee cijfers', () => {
    expect(formatKlok(360)).toBe('06:00')
    expect(formatKlok(630)).toBe('10:30')
    expect(formatKlok(1439)).toBe('23:59')
    expect(formatKlok(1440)).toBe('00:00')
    expect(formatKlok(-1)).toBe('23:59')
  })

  it('vindt het moment waar de kijklijn in zit', () => {
    expect(actiefAnker(ANKERS, -10)).toBe(-1)
    expect(actiefAnker(ANKERS, 0)).toBe(0)
    expect(actiefAnker(ANKERS, 1500)).toBe(1)
    expect(actiefAnker(ANKERS, 9999)).toBe(2)
  })

  it('houdt eerst de tijd van de sectie vast en loopt dan door', () => {
    expect(klokMinuten(ANKERS, -50)).toBe(360)
    expect(klokMinuten(ANKERS, 1000 * HOUD)).toBe(360)
    expect(klokMinuten(ANKERS, 999)).toBeGreaterThan(410)
    expect(klokMinuten(ANKERS, 999)).toBeLessThanOrEqual(420)
    expect(klokMinuten(ANKERS, 1000)).toBe(420)
    expect(klokMinuten(ANKERS, 5000)).toBe(630)
  })

  it('loopt nooit terug bij verder scrollen', () => {
    let vorige = 0
    for (let y = -100; y < 2500; y += 7) {
      const m = klokMinuten(ANKERS, y)
      expect(m).toBeGreaterThanOrEqual(vorige)
      vorige = m
    }
  })

  it('geeft 0 zonder momenten', () => {
    expect(klokMinuten([], 100)).toBe(0)
  })
})

describe('momenten van de dag', () => {
  it('lopen op en vallen binnen openingstijd', () => {
    const tijden = DAG_MOMENTEN.map((m) => m.minuten)
    expect([...tijden].sort((a, b) => a - b)).toEqual(tijden)
    expect(new Set(DAG_MOMENTEN.map((m) => m.id)).size).toBe(DAG_MOMENTEN.length)
    for (const t of tijden) expect(t >= 6 * 60 && t <= 23 * 60).toBe(true)
  })

  it('elke plek uit ROLLEN heeft een tijd', () => {
    for (const r of ROLLEN) expect(ROL_TIJD[r.sleutel]).toBeGreaterThan(0)
  })
})

describe('diepte in de held', () => {
  it('rekent de scroll om naar 0 tot 1', () => {
    expect(heldVoortgang(0, 800)).toBe(0)
    expect(heldVoortgang(100, 800)).toBe(0)
    expect(heldVoortgang(-400, 800)).toBe(0.5)
    expect(heldVoortgang(-2000, 800)).toBe(1)
    expect(heldVoortgang(-1, 0)).toBe(1)
  })

  it('zet de muis om naar -1 tot 1', () => {
    expect(pointerAs(0, 1000)).toBe(-1)
    expect(pointerAs(500, 1000)).toBe(0)
    expect(pointerAs(1000, 1000)).toBe(1)
    expect(pointerAs(2000, 1000)).toBe(1)
    expect(pointerAs(10, 0)).toBe(0)
  })

  it('dempt even snel bij 30 en 60 beelden per seconde', () => {
    let a = 0
    let b = 0
    for (let i = 0; i < 30; i++) a = demp(a, 1, 1 / 30)
    for (let i = 0; i < 60; i++) b = demp(b, 1, 1 / 60)
    expect(Math.abs(a - b)).toBeLessThan(1e-9)
    expect(demp(0.4, 0.4, 0.016)).toBe(0.4)
    expect(demp(0, 1, -1)).toBe(0)
  })
})

describe('schemabouw', () => {
  const N = { intake: 4, rijen: 4, kern: 3 }

  it('de fasen sluiten op elkaar aan van 0 tot 1', () => {
    expect(GRENZEN[FASEN[0]][0]).toBe(0)
    expect(GRENZEN[FASEN[FASEN.length - 1]][1]).toBe(1)
    for (let i = 1; i < FASEN.length; i++) expect(GRENZEN[FASEN[i]][0]).toBe(GRENZEN[FASEN[i - 1]][1])
  })

  it('rekent de vastgezette scroll om naar 0 tot 1', () => {
    expect(pinVoortgang(500, 3000, 1000, 68)).toBe(0)
    expect(pinVoortgang(68, 3000, 1000, 68)).toBe(0)
    expect(pinVoortgang(68 - 2068, 3000, 1000, 68)).toBe(1)
    expect(pinVoortgang(68 - 1034, 3000, 1000, 68)).toBeCloseTo(0.5)
    expect(pinVoortgang(-10, 900, 1000, 68)).toBe(1)
    expect(pinVoortgang(400, 900, 1000, 68)).toBe(0)
  })

  it('kiest de fase bij de voortgang', () => {
    expect(faseVan(0)).toBe('intake')
    expect(faseVan(0.3)).toBe('oefeningen')
    expect(faseVan(0.6)).toBe('coaching')
    expect(faseVan(0.9)).toBe('app')
    expect(faseVan(1)).toBe('app')
  })

  it('laat onderdelen een voor een zien en daarna allemaal', () => {
    expect(zichtbaar(0, 'oefeningen', 4)).toBe(0)
    expect(zichtbaar(0.21, 'oefeningen', 4)).toBe(1)
    expect(zichtbaar(0.5, 'oefeningen', 4)).toBe(4)
    expect(zichtbaar(1, 'oefeningen', 4)).toBe(4)
    let vorige = 0
    for (let p = 0; p <= 1; p += 0.01) {
      const z = zichtbaar(p, 'oefeningen', 4)
      expect(z).toBeGreaterThanOrEqual(vorige)
      vorige = z
    }
  })

  it('eindigt in de eindstand', () => {
    expect(zelfdeStand(standVan(1, N), eindStand(N))).toBe(true)
    expect(standVan(0, N)).toEqual({ fase: 'intake', intake: 0, rijen: 0, kern: 0, app: 0 })
    expect(zelfdeStand(standVan(0.3, N), eindStand(N))).toBe(false)
  })

  it('de telefoon komt pas in de laatste fase binnen', () => {
    expect(standVan(0.73, N).app).toBe(0)
    expect(standVan(0.8, N).app).toBeGreaterThan(0)
    expect(standVan(0.97, N).app).toBe(1)
  })
})
