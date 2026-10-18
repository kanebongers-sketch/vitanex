import { describe, expect, it } from 'vitest'
import { REPDB_ALLE_KOPPELINGEN, REPDB_GEEN_MATCH } from '../beelden-repdb'
import { COACHING_BOEKEN, coachingSleutel, coachingVoor } from './index'
import { GRENZEN, leesCoaching } from './invoer'
import type { Coaching } from './typen'

// De coaching is het belangrijkste wat leden lezen: dezelfde lat voor elke oefening.

const ALLES: [string, Coaching][] = COACHING_BOEKEN.flatMap((boek) => Object.entries(boek))

/** Alle tekst van een oefening, om de schrijfstijl te controleren. */
function teksten(c: Coaching): string[] {
  return [
    ...c.kernpunten.flatMap((k) => [k.punt, k.uitleg]),
    ...c.opstelling,
    ...c.stappen,
    ...c.fouten.flatMap((f) => [f.fout, f.beter]),
    c.ademhaling,
    c.tempo,
    c.makkelijker ?? '',
    c.zwaarder ?? '',
  ]
}

/** Zinnen die een lid leest als uitleg: hoofdletter of cijfer vooraan, punt achteraan. */
function zinnen(c: Coaching): string[] {
  return [
    ...c.kernpunten.map((k) => k.uitleg),
    ...c.opstelling,
    ...c.stappen,
    ...c.fouten.map((f) => f.beter),
    c.ademhaling,
    c.tempo,
    ...(c.makkelijker ? [c.makkelijker] : []),
    ...(c.zwaarder ? [c.zwaarder] : []),
  ]
}

/** Geen beloftes over gezondheid: coaching gaat over uitvoering, niet over genezen of voorkomen. */
const MEDISCH = /\b(voorkomt blessures|blessures voorkomen|voorkom je blessures|geneest|genezen|therapie|therapeutisch|blessurevrij|vetverbranding|verbrandt vet|ontgift)/i

describe('coaching per oefening', () => {
  it('dekt elke actieve oefening uit de standaardbibliotheek', () => {
    const zonder = REPDB_ALLE_KOPPELINGEN.map((k) => k.naam).filter((naam) => coachingVoor(naam) === null)
    expect(zonder).toEqual([])
  })

  it('heeft geen coaching voor oefeningen die niet (meer) in de bibliotheek staan', () => {
    const bekend = new Set([...REPDB_ALLE_KOPPELINGEN.map((k) => k.naam), ...REPDB_GEEN_MATCH].map(coachingSleutel))
    const los = ALLES.map(([naam]) => naam).filter((naam) => !bekend.has(coachingSleutel(naam)))
    expect(los).toEqual([])
  })

  it('heeft geen dubbele namen', () => {
    const sleutels = ALLES.map(([naam]) => coachingSleutel(naam))
    expect(new Set(sleutels).size).toBe(sleutels.length)
  })

  it.each(ALLES)('%s voldoet aan dezelfde regels als eigen coaching van een sportschool', (_naam, c) => {
    const uitslag = leesCoaching(c)
    expect(uitslag.ok ? null : uitslag.fout).toBeNull()
    // Niets valt weg of verandert bij het controleren: de tekst is al schoon.
    expect(uitslag.ok && uitslag.waarde).toEqual(c)
  })

  it.each(ALLES)('%s heeft de juiste opbouw', (_naam, c) => {
    expect(c.kernpunten.length).toBeGreaterThanOrEqual(GRENZEN.kernpunten[0])
    expect(c.kernpunten.length).toBeLessThanOrEqual(GRENZEN.kernpunten[1])
    for (const k of c.kernpunten) {
      // Een commando zoals de trainer het zegt: kort, met hoofdletter, zonder punt.
      expect(k.punt.length).toBeGreaterThan(2)
      expect(k.punt.length).toBeLessThanOrEqual(GRENZEN.punt)
      expect(k.punt).toMatch(/^[A-Z0-9]/)
      expect(k.punt).not.toMatch(/[.!?:;,]$/)
      expect(k.uitleg.length).toBeGreaterThan(15)
    }
    for (const z of zinnen(c)) {
      expect(z, z).toMatch(/^[A-Z0-9]/)
      expect(z, z).toMatch(/[.!?]$/)
    }
    for (const f of c.fouten) {
      expect(f.fout, f.fout).toMatch(/^[A-Z0-9]/)
      expect(f.fout, f.fout).not.toMatch(/[.!?]$/)
    }
  })

  it.each(ALLES)('%s volgt de schrijfstijl', (_naam, c) => {
    for (const t of teksten(c)) {
      expect(t).not.toMatch(/[–—]/)
      expect(t).not.toMatch(/\s-\s/)
      expect(t).not.toMatch(/[áéíóúàèìòù]/i)
      expect(t).not.toMatch(/\p{Extended_Pictographic}/u)
      expect(t).not.toMatch(/\s{2,}/)
      expect(t).not.toMatch(MEDISCH)
      expect(t).toBe(t.trim())
    }
    // Kernpunten zijn uniek binnen een oefening (ze dienen ook als React-key).
    expect(new Set(c.kernpunten.map((k) => k.punt)).size).toBe(c.kernpunten.length)
    expect(new Set(c.fouten.map((f) => f.fout)).size).toBe(c.fouten.length)
    expect(new Set(c.stappen).size).toBe(c.stappen.length)
    expect(new Set(c.opstelling).size).toBe(c.opstelling.length)
  })

  it('vindt een oefening ongeacht hoofdletters en spaties', () => {
    const [naam] = ALLES[0]
    expect(coachingVoor(`  ${naam.toUpperCase()} `)).toBe(ALLES[0][1])
    expect(coachingVoor('Bestaat niet')).toBeNull()
  })
})
