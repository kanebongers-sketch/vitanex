import { describe, expect, it } from 'vitest'
import { HOOFDSTUKKEN } from './functies'
import { NIEUW, aantalNieuw, korteDatum, maandNaam, maandSamenvatting, puntTekst } from './nieuw'
import { allePunten, allesGezien, leesGezien, nieuwSleutel, ongelezenPunten, tellerTekst } from '@/lib/aiyourgym/nieuw'

// Wat er nieuw is: alleen wat al live is, met een echte datum, en volgens de
// schrijfregels van Kane.

const DATUM = /^\d{4}-\d{2}-\d{2}$/

describe('wat er nieuw is', () => {
  it('heeft per maand punten met een geldige datum binnen die maand, nieuwste eerst', () => {
    const maanden = NIEUW.map((m) => m.maand)
    expect([...maanden].sort().reverse()).toEqual(maanden)
    for (const m of NIEUW) {
      expect(m.punten.length).toBeGreaterThan(0)
      const datums = m.punten.map((p) => p.datum)
      expect([...datums].sort().reverse()).toEqual(datums)
      for (const d of datums) {
        expect(d).toMatch(DATUM)
        expect(Number.isNaN(Date.parse(`${d}T12:00:00Z`))).toBe(false)
        expect(d.startsWith(`${m.maand}-`)).toBe(true)
      }
    }
  })

  it('belooft niets voor later: geen datum in de toekomst en geen woorden als binnenkort', () => {
    const vandaag = new Date().toISOString().slice(0, 10)
    for (const m of NIEUW) for (const p of m.punten) expect(p.datum <= vandaag).toBe(true)
    expect(JSON.stringify(NIEUW)).not.toMatch(/binnenkort|straks|komt eraan|gepland voor|later dit jaar/i)
  })

  it('volgt de schrijfregels en noemt geen andere bedrijven', () => {
    const tekst = JSON.stringify(NIEUW)
    expect(tekst).not.toMatch(/[–—]| - /)
    expect(tekst).not.toMatch(/[éèëêáàóòúùíì]/i)
    expect(tekst).not.toMatch(/fit ?factory|virtuagym|sportivity|repdb|excel|stripe|ruben|kane/i)
  })

  it('hoort elk punt bij een bestaand hoofdstuk', () => {
    const sleutels = new Set(HOOFDSTUKKEN.map((h) => h.sleutel as string))
    for (const m of NIEUW) for (const p of m.punten) expect(sleutels.has(p.hoofdstuk)).toBe(true)
  })

  it('schrijft maanden en datums in het Nederlands', () => {
    expect(maandNaam('2026-10')).toBe('Oktober 2026')
    expect(korteDatum('2026-10-03')).toBe('3 okt')
    expect(aantalNieuw()).toBe(NIEUW.reduce((s, m) => s + m.punten.length, 0))
  })

  it('heeft elk punt en elke maand ook in het Engels, volgens dezelfde regels', () => {
    expect(maandNaam('2026-10', 'en')).toBe('October 2026')
    expect(korteDatum('2026-10-03', 'en')).toBe('3 Oct')
    for (const m of NIEUW) {
      expect(maandSamenvatting(m, 'en').trim().length).toBeGreaterThan(10)
      for (const p of m.punten) {
        const en = puntTekst(p, 'en')
        expect(en.titel.trim().length).toBeGreaterThan(3)
        expect(en.tekst.trim().length).toBeGreaterThan(10)
        expect(en.titel).not.toBe(p.titel)
        expect(puntTekst(p, 'nl')).toEqual({ titel: p.titel, tekst: p.tekst })
        for (const t of [en.titel, en.tekst]) expect(t).not.toMatch(/[–—]| - | [,;:!?]| \.(\s|$)/)
      }
    }
  })
})

describe('gelezen of niet (Wat is nieuw in Club)', () => {
  const lijst = [
    { maand: '2026-10', samenvatting: 'x', en: { samenvatting: 'x' }, punten: [
      { datum: '2026-10-20', titel: 'B', tekst: 'b', hoofdstuk: 'beheer' as const, en: { titel: 'B', tekst: 'b' } },
      { datum: '2026-10-10', titel: 'A', tekst: 'a', hoofdstuk: 'groei' as const, en: { titel: 'A', tekst: 'a' } },
    ] },
  ]

  it('zonder bewaarde lijst is alles ongelezen, kapotte opslag telt als niets gezien', () => {
    expect(ongelezenPunten(null, lijst)).toHaveLength(2)
    expect(ongelezenPunten('{kapot', lijst)).toHaveLength(2)
    expect(ongelezenPunten('{"a":1}', lijst)).toHaveLength(2)
  })

  it('na openen alles gelezen; een nieuw punt telt daarna weer', () => {
    const bewaard = allesGezien(lijst)
    expect(ongelezenPunten(bewaard, lijst)).toEqual([])
    const later = [{ ...lijst[0], punten: [{ datum: '2026-10-22', titel: 'C', tekst: 'c', hoofdstuk: 'coaching' as const, en: { titel: 'C', tekst: 'c' } }, ...lijst[0].punten] }]
    expect(ongelezenPunten(bewaard, later).map((p) => p.titel)).toEqual(['C'])
  })

  it('sleutels zijn uniek over de echte lijst', () => {
    const sleutels = allePunten().map(nieuwSleutel)
    expect(new Set(sleutels).size).toBe(sleutels.length)
    expect(leesGezien(allesGezien()).size).toBe(aantalNieuw())
  })

  it('de teller toont nooit 0 en hoogstens 9+', () => {
    expect(tellerTekst(0)).toBeNull()
    expect(tellerTekst(6)).toBe('6')
    expect(tellerTekst(24)).toBe('9+')
  })
})
