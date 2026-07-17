import { describe, it, expect } from 'vitest'
import { maakLimiet, teSnelAntwoord, MAX_PER_VENSTER } from './limiet'

// `nu` komt als argument binnen, dus geen nep-timers nodig: we schuiven de klok
// zelf op. Zelfde patroon als `vrije-blokken.test.ts`.

const NU = 1_700_000_000_000

describe('maakLimiet', () => {
  it('laat berichten door tot aan het maximum', () => {
    const limiet = maakLimiet({ maxPerVenster: 3, vensterMs: 60_000 })
    expect(limiet.toets('42', NU).soort).toBe('ruimte')
    expect(limiet.toets('42', NU).soort).toBe('ruimte')
    expect(limiet.toets('42', NU).soort).toBe('ruimte')
  })

  it('weigert het bericht ná het maximum', () => {
    const limiet = maakLimiet({ maxPerVenster: 2, vensterMs: 60_000 })
    limiet.toets('42', NU)
    limiet.toets('42', NU)
    expect(limiet.toets('42', NU).soort).toBe('te_snel')
  })

  it('telt per chat, niet globaal', () => {
    const limiet = maakLimiet({ maxPerVenster: 1, vensterMs: 60_000 })
    expect(limiet.toets('42', NU).soort).toBe('ruimte')
    // Een andere chat heeft zijn eigen budget.
    expect(limiet.toets('99', NU).soort).toBe('ruimte')
    expect(limiet.toets('42', NU).soort).toBe('te_snel')
  })

  it('geeft ruimte vrij zodra het venster voorbij is', () => {
    const limiet = maakLimiet({ maxPerVenster: 1, vensterMs: 60_000 })
    expect(limiet.toets('42', NU).soort).toBe('ruimte')
    expect(limiet.toets('42', NU + 59_000).soort).toBe('te_snel')
    expect(limiet.toets('42', NU + 60_001).soort).toBe('ruimte')
  })

  it('schuift mee: het venster is glijdend, niet vast', () => {
    const limiet = maakLimiet({ maxPerVenster: 2, vensterMs: 60_000 })
    limiet.toets('42', NU) // vervalt op NU+60_000
    limiet.toets('42', NU + 30_000) // vervalt op NU+90_000
    expect(limiet.toets('42', NU + 40_000).soort).toBe('te_snel')

    // De oudste is nu vervallen → er is precies één plek vrij, niet twee.
    expect(limiet.toets('42', NU + 61_000).soort).toBe('ruimte')
    expect(limiet.toets('42', NU + 61_000).soort).toBe('te_snel')
  })

  it('zegt hoelang je moet wachten, altijd minstens 1 seconde', () => {
    const limiet = maakLimiet({ maxPerVenster: 1, vensterMs: 60_000 })
    limiet.toets('42', NU)

    const besluit = limiet.toets('42', NU + 10_000)
    expect(besluit).toEqual({ soort: 'te_snel', opnieuwOverSeconden: 50 })

    // Vlak vóór de grens nooit "over 0 seconden" — dat leest als "nu mag het".
    const bijnaVrij = limiet.toets('42', NU + 59_999)
    expect(bijnaVrij.soort).toBe('te_snel')
    if (bijnaVrij.soort === 'te_snel') {
      expect(bijnaVrij.opnieuwOverSeconden).toBeGreaterThanOrEqual(1)
    }
  })
})

describe('maakLimiet — geheugengrens', () => {
  it('weigert een nieuwe chat als de teller vol zit (fail-closed)', () => {
    const limiet = maakLimiet({ maxPerVenster: 5, vensterMs: 60_000, maxSleutels: 2 })
    expect(limiet.toets('1', NU).soort).toBe('ruimte')
    expect(limiet.toets('2', NU).soort).toBe('ruimte')
    // Vol: een derde chat komt er niet meer bij.
    expect(limiet.toets('3', NU).soort).toBe('te_snel')
    // De chats die er al in zitten werken gewoon door.
    expect(limiet.toets('1', NU).soort).toBe('ruimte')
  })

  it('maakt weer plaats zodra oude sleutels vervallen', () => {
    const limiet = maakLimiet({ maxPerVenster: 5, vensterMs: 60_000, maxSleutels: 1 })
    expect(limiet.toets('1', NU).soort).toBe('ruimte')
    expect(limiet.toets('2', NU).soort).toBe('te_snel')
    // Sleutel '1' is vervallen en wordt opgeruimd → '2' past nu wel.
    expect(limiet.toets('2', NU + 60_001).soort).toBe('ruimte')
  })
})

describe('teSnelAntwoord', () => {
  it('noemt de wachttijd en de limiet', () => {
    const tekst = teSnelAntwoord(30)
    expect(tekst).toContain('30')
    expect(tekst).toContain(String(MAX_PER_VENSTER))
  })
})
