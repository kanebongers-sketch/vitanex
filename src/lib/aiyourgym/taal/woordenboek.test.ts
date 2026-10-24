import { describe, expect, it } from 'vitest'
import { isWoordenboek, tekst, woordenboek, type Woordenboek } from './woordenboek'

// Bewaakt alle woordenboeken van AI Your Gym (./woorden/**): beide talen hebben
// precies dezelfde opbouw, niets is leeg, en de schrijfregels gelden in beide
// talen. Een nieuw bestand in ./woorden doet vanzelf mee.

const MODULES = import.meta.glob(['./woorden/**/*.ts', '!./woorden/**/*.test.ts'], { eager: true }) as Record<string, Record<string, unknown>>

interface Gevonden {
  naam: string
  boek: Woordenboek<unknown>
}

const BOEKEN: Gevonden[] = Object.entries(MODULES).flatMap(([bestand, exports]) =>
  Object.entries(exports)
    .filter(([, waarde]) => isWoordenboek(waarde))
    .map(([naam, waarde]) => ({ naam: `${bestand.replace('./woorden/', '')} ${naam}`, boek: waarde as Woordenboek<unknown> })),
)

/** Voorbeeldwaarden om tekstfuncties mee aan te roepen. */
const VOORBEELD_ARGUMENTEN = [14, 3, 2]

/** Verschillen in opbouw tussen nl en en, als leesbare paden. */
function verschillen(nl: unknown, en: unknown, pad: string): string[] {
  if (typeof nl === 'function' || typeof en === 'function') {
    if (typeof nl !== 'function' || typeof en !== 'function') return [`${pad}: functie tegen geen functie`]
    if (nl.length !== en.length) return [`${pad}: ${nl.length} tegen ${en.length} parameters`]
    return verschillen(nl(...VOORBEELD_ARGUMENTEN), en(...VOORBEELD_ARGUMENTEN), `${pad}()`)
  }
  if (Array.isArray(nl) || Array.isArray(en)) {
    if (!Array.isArray(nl) || !Array.isArray(en)) return [`${pad}: lijst tegen geen lijst`]
    if (nl.length !== en.length) return [`${pad}: ${nl.length} tegen ${en.length} items`]
    return nl.flatMap((item, i) => verschillen(item, en[i], `${pad}[${i}]`))
  }
  if (typeof nl === 'object' && nl !== null && typeof en === 'object' && en !== null) {
    const a = Object.keys(nl).sort()
    const b = Object.keys(en).sort()
    const alleen = [...a.filter((k) => !b.includes(k)).map((k) => `${pad}.${k}: alleen nl`), ...b.filter((k) => !a.includes(k)).map((k) => `${pad}.${k}: alleen en`)]
    if (alleen.length > 0) return alleen
    return a.flatMap((k) => verschillen((nl as Record<string, unknown>)[k], (en as Record<string, unknown>)[k], `${pad}.${k}`))
  }
  if (typeof nl !== typeof en) return [`${pad}: ${typeof nl} tegen ${typeof en}`]
  return []
}

/** Alle teksten in een woordenboek (functies aangeroepen met voorbeeldwaarden). */
function teksten(waarde: unknown): string[] {
  if (typeof waarde === 'string') return [waarde]
  if (typeof waarde === 'function') return teksten(waarde(...VOORBEELD_ARGUMENTEN))
  if (Array.isArray(waarde)) return waarde.flatMap(teksten)
  if (typeof waarde === 'object' && waarde !== null) return Object.values(waarde).flatMap(teksten)
  return []
}

describe('woordenboeken van AI Your Gym', () => {
  it('vindt de woordenboeken', () => {
    expect(BOEKEN.length).toBeGreaterThanOrEqual(5)
  })

  it.each(BOEKEN)('$naam: Nederlands en Engels hebben dezelfde opbouw', ({ boek }) => {
    expect(verschillen(boek.nl, boek.en, '')).toEqual([])
  })

  it.each(BOEKEN)('$naam: geen lege teksten (behalve bewust lege aanvullingen)', ({ boek }) => {
    for (const taal of ['nl', 'en'] as const) {
      for (const t of teksten(boek[taal])) expect(t === '' || t.trim().length > 0).toBe(true)
      expect(teksten(boek[taal]).some((t) => t.trim().length > 0)).toBe(true)
    }
  })

  it.each(BOEKEN)('$naam: Nederlands volgt de schrijfregels (geen gedachtestreepjes of klemtoon-accenten)', ({ boek }) => {
    const nl = teksten(boek.nl).join('\n')
    expect(nl).not.toMatch(/[–—]| - /)
    expect(nl).not.toMatch(/[éèëêáàóòúùíì]/i)
  })

  it.each(BOEKEN)('$naam: Engels zonder gedachtestreepjes', ({ boek }) => {
    expect(teksten(boek.en).join('\n')).not.toMatch(/[–—]| - /)
  })

  it.each(BOEKEN)('$naam: Engels zonder Nederlandse aanhalingen of spaties voor leestekens', ({ boek }) => {
    for (const t of teksten(boek.en)) expect(t).not.toMatch(/„| [,.;:!?]/)
  })
})

describe('woordenboek()', () => {
  it('geeft per taal de teksten', () => {
    const boek = woordenboek({ nl: { hoi: 'Hallo', dagen: (n: number) => `${n} dagen` }, en: { hoi: 'Hello', dagen: (n: number) => `${n} days` } })
    expect(tekst(boek, 'nl').hoi).toBe('Hallo')
    expect(tekst(boek, 'en').dagen(3)).toBe('3 days')
    expect(Object.isFrozen(boek)).toBe(true)
  })

  it('dwingt dezelfde sleutels af in het type', () => {
    // Deze regels zijn bewust fout: de typecontrole moet ze weigeren.
    // @ts-expect-error Engels mist een sleutel
    woordenboek({ nl: { a: 'A', b: 'B' }, en: { a: 'A' } })
    // @ts-expect-error Engels heeft een sleutel te veel
    woordenboek({ nl: { a: 'A' }, en: { a: 'A', b: 'B' } })
    // @ts-expect-error Engels heeft een andere vorm (tekst tegen functie)
    woordenboek({ nl: { a: (n: number) => `${n}` }, en: { a: 'A' } })
    // @ts-expect-error Engels mist een geneste sleutel
    woordenboek({ nl: { a: { b: 'B', c: 'C' } }, en: { a: { b: 'B' } } })
    // Andere woorden in dezelfde vorm mogen wel.
    expect(woordenboek({ nl: { a: 'Ja' }, en: { a: 'Yes' } }).en.a).toBe('Yes')
  })
})
