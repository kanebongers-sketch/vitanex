import { describe, it, expect } from 'vitest'
import { laatstePerExternId, teVerwijderenExternIds, type CacheRijRef } from './opslag'
import type { GoogleAfspraak } from './google'

// De riskantste beslissing van de multi-agenda-sync, puur getest zonder database:
// welke gecachte events moeten na een sync uit het venster verdwijnen? Vier
// regels — houden bij vers/geen-agenda, weg bij uitgevinkt/afgezegd, laten staan
// bij een gefaalde fetch.

function rij(externId: string, kalenderId: string | null): CacheRijRef {
  return { externId, kalenderId }
}

const zichtbaar = new Set(['werk@x.nl', 'feest@x.nl'])

describe('teVerwijderenExternIds', () => {
  it('houdt een event dat deze sync is teruggekomen', () => {
    const weg = teVerwijderenExternIds(
      [rij('a', 'werk@x.nl')],
      new Set(['a']),
      zichtbaar,
      new Set(['werk@x.nl']),
    )
    expect(weg).toEqual([])
  })

  it('houdt een event zonder kalender_id (door de schrijf-flow gemaakt)', () => {
    // Niet aan de sync om die te wissen: die is niet van een agenda-fetch.
    const weg = teVerwijderenExternIds(
      [rij('handmatig', null)],
      new Set(),
      zichtbaar,
      new Set(['werk@x.nl']),
    )
    expect(weg).toEqual([])
  })

  it('verwijdert een event van een uitgevinkte agenda', () => {
    // 'oud@x.nl' staat niet meer in de zichtbare set → weg uit het venster.
    const weg = teVerwijderenExternIds(
      [rij('a', 'oud@x.nl')],
      new Set(),
      zichtbaar,
      new Set(['werk@x.nl', 'feest@x.nl']),
    )
    expect(weg).toEqual(['a'])
  })

  it('verwijdert een afgezegd/verplaatst event uit een succesvol gesyncte agenda', () => {
    // 'werk@x.nl' is zichtbaar én succesvol gesynct, maar 'a' kwam niet terug.
    const weg = teVerwijderenExternIds(
      [rij('a', 'werk@x.nl')],
      new Set(['b']),
      zichtbaar,
      new Set(['werk@x.nl']),
    )
    expect(weg).toEqual(['a'])
  })

  it('laat een event staan als de agenda zichtbaar is maar de fetch faalde', () => {
    // 'feest@x.nl' staat aan, maar zat NIET in gesyncteIds (Google faalde). Een
    // hik mag de events niet wissen.
    const weg = teVerwijderenExternIds(
      [rij('a', 'feest@x.nl')],
      new Set(),
      zichtbaar,
      new Set(['werk@x.nl']), // feest@x.nl ontbreekt → gefaald
    )
    expect(weg).toEqual([])
  })

  it('behandelt een gemengd venster correct', () => {
    const weg = teVerwijderenExternIds(
      [
        rij('vers', 'werk@x.nl'), // teruggekomen → houden
        rij('afgezegd', 'werk@x.nl'), // gesynct, niet terug → weg
        rij('uitgevinkt', 'oud@x.nl'), // niet zichtbaar → weg
        rij('gefaald', 'feest@x.nl'), // zichtbaar maar niet gesynct → houden
        rij('handmatig', null), // geen agenda → houden
      ],
      new Set(['vers']),
      zichtbaar,
      new Set(['werk@x.nl']),
    )
    expect(weg.sort()).toEqual(['afgezegd', 'uitgevinkt'])
  })

  it('leegt alles met een agenda als er geen zichtbare agenda\'s zijn', () => {
    // Geen zichtbare agenda's → alle agenda-events weg, alleen handmatige blijven.
    const weg = teVerwijderenExternIds(
      [rij('a', 'werk@x.nl'), rij('b', 'feest@x.nl'), rij('handmatig', null)],
      new Set(),
      new Set(),
      new Set(),
    )
    expect(weg.sort()).toEqual(['a', 'b'])
  })
})

describe('laatstePerExternId — dedup van dubbele events', () => {
  function event(externId: string, kleur: string | null): GoogleAfspraak {
    return {
      externId,
      titel: 'Overleg',
      startOp: new Date('2026-07-20T09:00:00.000Z'),
      eindOp: new Date('2026-07-20T10:00:00.000Z'),
      heleDag: false,
      locatie: null,
      kalenderId: kleur === '#a' ? 'werk@x.nl' : 'prive@x.nl',
      kleur,
    }
  }

  it('houdt van een dubbel event de laatste (kleur van de laatst gesyncte agenda)', () => {
    // Zelfde afspraak op twee agenda's: één rij, de laatste kleur wint.
    const uit = laatstePerExternId([event('gedeeld', '#a'), event('gedeeld', '#b')])
    expect(uit).toHaveLength(1)
    expect(uit[0]?.kleur).toBe('#b')
  })

  it('laat losse events ongemoeid', () => {
    const uit = laatstePerExternId([event('a', '#a'), event('b', '#b')])
    expect(uit.map((e) => e.externId).sort()).toEqual(['a', 'b'])
  })

  it('geeft een lege lijst bij lege invoer', () => {
    expect(laatstePerExternId([])).toEqual([])
  })
})
