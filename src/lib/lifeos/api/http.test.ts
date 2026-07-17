// Tests voor de narrow-helpers. `haalJson` zelf zit hier niet in: die hangt aan
// `authFetch` en een Response, en dat is een integratietest — geen unit.
//
// Wat hier wél bewaakt wordt is `leesFoutmelding`, en dat is geen cosmetica: de
// cockpit bevraagt twee API's die het oneens zijn over de sleutel van een
// foutmelding. Valt die terug op een generieke zin, dan slikt de UI stilletjes
// in wat de server precies probeerde te zeggen.

import { describe, expect, it } from 'vitest'
import { getalOfNull, isObject, leesFoutmelding, tekstOfNull } from '@/lib/lifeos/api/http'

describe('leesFoutmelding', () => {
  it('leest `fout` — de sleutel van de LifeOS-routes', () => {
    expect(leesFoutmelding({ fout: 'Een taak zonder titel is geen taak.' })).toBe(
      'Een taak zonder titel is geen taak.',
    )
  })

  // De bug die deze functie bestaat om te voorkomen: /api/stress, /api/stemming,
  // /api/burnout-predictor, /api/xp, /api/streak, /api/vandaag en
  // /api/lichaamsmetingen sturen allemaal `error`.
  it('leest `error` — de sleutel van de MentaForce-kern', () => {
    expect(leesFoutmelding({ error: 'Nog geen doelen ingesteld.' })).toBe(
      'Nog geen doelen ingesteld.',
    )
  })

  it('geeft `fout` voorrang als een body ze allebei heeft', () => {
    expect(leesFoutmelding({ fout: 'De echte melding.', error: 'De andere.' })).toBe(
      'De echte melding.',
    )
  })

  it('valt terug op een generieke zin als er geen melding in staat', () => {
    expect(leesFoutmelding({})).toBe('Er ging iets mis.')
    expect(leesFoutmelding({ fout: '' })).toBe('Er ging iets mis.')
    expect(leesFoutmelding({ fout: '   ' })).toBe('Er ging iets mis.')
  })

  // Een `fout` die geen tekst is, is geen melding. Hem toch tonen levert
  // "[object Object]" op het scherm — erger dan de generieke zin.
  it('negeert een melding die geen tekst is', () => {
    expect(leesFoutmelding({ fout: { code: 500 } })).toBe('Er ging iets mis.')
    expect(leesFoutmelding({ fout: 42 })).toBe('Er ging iets mis.')
    expect(leesFoutmelding({ error: null })).toBe('Er ging iets mis.')
  })

  it('valt terug als de body helemaal geen object is', () => {
    expect(leesFoutmelding(null)).toBe('Er ging iets mis.')
    expect(leesFoutmelding('kapot')).toBe('Er ging iets mis.')
    expect(leesFoutmelding(['fout'])).toBe('Er ging iets mis.')
  })

  it('valt door naar `error` als `fout` er wel is maar leeg', () => {
    expect(leesFoutmelding({ fout: '', error: 'De bruikbare melding.' })).toBe(
      'De bruikbare melding.',
    )
  })
})

describe('isObject', () => {
  it('herkent een gewoon object', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
  })

  it('weigert null, arrays en primitieven', () => {
    expect(isObject(null)).toBe(false)
    expect(isObject([])).toBe(false)
    expect(isObject('tekst')).toBe(false)
    expect(isObject(42)).toBe(false)
    expect(isObject(undefined)).toBe(false)
  })
})

describe('getalOfNull', () => {
  it('laat een eindig getal door, inclusief 0', () => {
    expect(getalOfNull(0)).toBe(0)
    expect(getalOfNull(-3.5)).toBe(-3.5)
  })

  // De kern van de fout≠leeg-discipline: 0 is een gemeten waarde, null is
  // afwezigheid. Ze mogen nooit in elkaar overlopen.
  it('houdt 0 en null uit elkaar', () => {
    expect(getalOfNull(0)).not.toBeNull()
    expect(getalOfNull(null)).toBeNull()
  })

  it('weigert NaN, Infinity en getal-achtige tekst', () => {
    expect(getalOfNull(NaN)).toBeNull()
    expect(getalOfNull(Infinity)).toBeNull()
    expect(getalOfNull('42')).toBeNull()
  })
})

describe('tekstOfNull', () => {
  it('laat niet-lege tekst door', () => {
    expect(tekstOfNull('hallo')).toBe('hallo')
  })

  it('weigert lege en witruimte-tekst', () => {
    expect(tekstOfNull('')).toBeNull()
    expect(tekstOfNull('   ')).toBeNull()
  })

  it('weigert niet-tekst', () => {
    expect(tekstOfNull(42)).toBeNull()
    expect(tekstOfNull(null)).toBeNull()
  })
})
