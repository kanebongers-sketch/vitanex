// Tests voor de pure systeemgrens-helpers van het kennissysteem. Deze dragen de
// link-integriteit: `notities.tekst` is de waarheid, `notitie_links` de index, en
// die mogen niet uit elkaar lopen. De DB-takken (synchroniseren, hersyncen)
// hebben een Supabase-mock nodig en zitten hier niet in — dit dekt de pure kant:
// het lezen van rijen en het opdelen in brokken voor de `.in()`-queries.

import { describe, expect, it } from 'vitest'
import { inBrokken, leesLinkRijen, leesTekstVeld } from '@/lib/lifeos/notities/kennis'

describe('leesTekstVeld', () => {
  it('leest een niet-lege string, getrimd', () => {
    expect(leesTekstVeld({ x: '  hoi  ' }, 'x')).toBe('hoi')
  })

  it('geeft null bij een lege of witruimte-only string', () => {
    expect(leesTekstVeld({ x: '' }, 'x')).toBeNull()
    expect(leesTekstVeld({ x: '   ' }, 'x')).toBeNull()
  })

  it('geeft null als het veld ontbreekt of geen string is', () => {
    expect(leesTekstVeld({ x: 'hoi' }, 'y')).toBeNull()
    expect(leesTekstVeld({ x: 42 }, 'x')).toBeNull()
    expect(leesTekstVeld({ x: null }, 'x')).toBeNull()
  })

  it('geeft null als de rij geen object is', () => {
    expect(leesTekstVeld(null, 'x')).toBeNull()
    expect(leesTekstVeld('rij', 'x')).toBeNull()
    expect(leesTekstVeld(42, 'x')).toBeNull()
  })
})

describe('leesLinkRijen', () => {
  it('leest een volledige rij', () => {
    const rijen = [
      { bron_id: 'b1', doel_id: 'd1', doel_titel: 'Marge', doel_sleutel: 'marge' },
    ]
    expect(leesLinkRijen(rijen)).toEqual([
      { bron_id: 'b1', doel_id: 'd1', doel_titel: 'Marge', doel_sleutel: 'marge' },
    ])
  })

  // Een onopgeloste link ("wanted link"): doel_id mag null zijn, de rij blijft.
  it('houdt een rij met doel_id null (onopgeloste verwijzing)', () => {
    const rijen = [{ bron_id: 'b1', doel_id: null, doel_titel: 'Nog niet', doel_sleutel: 'nog niet' }]
    expect(leesLinkRijen(rijen)[0].doel_id).toBeNull()
  })

  // Een rij zonder bron/doel_titel/doel_sleutel is onbruikbaar: die valt weg,
  // want een halve link in de grafiek is erger dan geen link.
  it('laat rijen zonder bron, doel_titel of doel_sleutel weg', () => {
    const rijen = [
      { doel_id: 'd', doel_titel: 'x', doel_sleutel: 'x' }, // geen bron_id
      { bron_id: 'b', doel_id: 'd', doel_sleutel: 'x' }, // geen doel_titel
      { bron_id: 'b', doel_id: 'd', doel_titel: 'x' }, // geen doel_sleutel
      { bron_id: 'b', doel_id: 'd', doel_titel: 'goed', doel_sleutel: 'goed' }, // wel goed
    ]
    const uit = leesLinkRijen(rijen)
    expect(uit).toHaveLength(1)
    expect(uit[0].doel_titel).toBe('goed')
  })

  it('geeft een lege lijst bij lege invoer', () => {
    expect(leesLinkRijen([])).toEqual([])
  })
})

describe('inBrokken', () => {
  it('deelt een lijst in brokken van de gevraagde grootte', () => {
    expect(inBrokken([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })

  it('geeft één brok als de lijst kleiner is dan de grootte', () => {
    expect(inBrokken([1, 2], 10)).toEqual([[1, 2]])
  })

  it('geeft een lege lijst van brokken bij lege invoer', () => {
    expect(inBrokken([], 10)).toEqual([])
  })

  // De grens die telt voor de `.in()`-queries: 201 items bij een limiet van 200
  // moet [200, 1] worden, niet [201] (Postgres/PostgREST kapt anders af) en niet
  // een off-by-one die er [199, 2] van maakt.
  it('splitst 201 items bij grootte 200 in [200, 1]', () => {
    const lijst = Array.from({ length: 201 }, (_, i) => i)
    const brokken = inBrokken(lijst, 200)
    expect(brokken).toHaveLength(2)
    expect(brokken[0]).toHaveLength(200)
    expect(brokken[1]).toHaveLength(1)
  })

  it('splitst een exact veelvoud netjes zonder lege staart-brok', () => {
    expect(inBrokken([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]])
  })
})
