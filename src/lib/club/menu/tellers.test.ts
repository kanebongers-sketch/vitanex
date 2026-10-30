import { describe, expect, it } from 'vitest'
import { ONDERDELEN, isZichtbaar, onderdelenVan } from '@/components/club/shell/onderdelen'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import {
  ONDERDEEL_TELLER, TELLER_SOORTEN, VERS_MS, groepTellers, leesTellers, moetVerversen, onderdeelTeller, schoonAantal, somVan,
  tellerRechten, tellerTekst, tellersVoor, welkeTellers, type TellerRechten,
} from './tellers'

const ALLES: TellerRechten = { taken: true, opvolgenLeden: true, leads: true, vandaag: true }

describe('welke tellers iemand krijgt', () => {
  it('met alle rechten alle drie', () => {
    expect(welkeTellers(ALLES)).toEqual(['taken', 'opvolgen', 'leads'])
  })

  it('zonder Taken geen takenteller', () => {
    expect(welkeTellers({ ...ALLES, taken: false })).not.toContain('taken')
  })

  it('opvolgen alleen met Vandaag en (Opvolgen of Leads)', () => {
    expect(welkeTellers({ ...ALLES, vandaag: false })).not.toContain('opvolgen')
    expect(welkeTellers({ taken: false, opvolgenLeden: false, leads: false, vandaag: true })).toEqual([])
    expect(welkeTellers({ taken: false, opvolgenLeden: true, leads: false, vandaag: true })).toEqual(['opvolgen'])
    expect(welkeTellers({ taken: false, opvolgenLeden: false, leads: true, vandaag: true })).toEqual(['opvolgen', 'leads'])
  })

  it('volgt de zichtbaarheid van het menu: pakket, onderdeel aan en rol', () => {
    const zieVoor = (uit: Parameters<typeof isZichtbaar>[1], toegestaan: readonly string[] | null) => (s: string) => {
      const o = ONDERDELEN.find((x) => x.sleutel === s)
      return o !== undefined && isZichtbaar(o, uit, toegestaan)
    }
    // Een trainer zonder Taken en Leads: niets.
    expect(welkeTellers(tellerRechten(zieVoor([], ['vandaag', 'leden', 'schemas'])))).toEqual([])
    // Groei niet afgenomen: geen leads (en opvolgen alleen als Opvolgen er is).
    expect(welkeTellers(tellerRechten(zieVoor(['pakket:groei'], null)))).toEqual(['taken'])
    // Takenmodule uit: geen takenteller.
    expect(welkeTellers(tellerRechten(zieVoor(['taken'], null)))).not.toContain('taken')
  })
})

describe('aantallen schoonmaken', () => {
  it('alleen gehele getallen boven 0', () => {
    expect(schoonAantal(3)).toBe(3)
    expect(schoonAantal(2.7)).toBe(2)
    for (const fout of [0, -1, NaN, Infinity, '4', null, undefined, {}]) expect(schoonAantal(fout)).toBe(0)
  })

  it('tellersVoor laat 0 en wat niet mag weg', () => {
    expect(tellersVoor({ taken: 0, opvolgen: 2, leads: 5 }, ['taken', 'opvolgen'])).toEqual({ opvolgen: 2 })
    expect(tellersVoor({ taken: null, opvolgen: null, leads: null }, TELLER_SOORTEN)).toEqual({})
  })

  it('leest het antwoord van de API voorzichtig', () => {
    expect(leesTellers({ tellers: { taken: 3, leads: 'x', onbekend: 9 } })).toEqual({ taken: 3 })
    for (const fout of [null, 'x', { tellers: [] }, { tellers: null }, {}]) expect(leesTellers(fout)).toEqual({})
  })
})

describe('tellers in het menu', () => {
  it('elk onderdeel met een teller bestaat', () => {
    for (const sleutel of Object.keys(ONDERDEEL_TELLER)) expect(ONDERDELEN.map((o) => o.sleutel)).toContain(sleutel)
  })

  it('Opvolgen staat bij Vandaag, bij 0 geen teller', () => {
    expect(onderdeelTeller('vandaag', { opvolgen: 4 })).toEqual({ soort: 'opvolgen', aantal: 4 })
    expect(onderdeelTeller('taken', { opvolgen: 4 })).toBeNull()
    expect(onderdeelTeller('leden', { taken: 4 })).toBeNull()
    expect(onderdeelTeller(undefined, { taken: 4 })).toBeNull()
  })

  it('een groep telt elke soort een keer, alleen van de onderdelen die je ziet', () => {
    const tellers = { taken: 2, opvolgen: 3, leads: 1 }
    const werkvloer = onderdelenVan('werkvloer').map((o) => o.sleutel)
    expect(groepTellers(werkvloer, tellers)).toEqual([{ soort: 'opvolgen', aantal: 3 }, { soort: 'taken', aantal: 2 }])
    expect(somVan(groepTellers(werkvloer, tellers))).toBe(5)
    // Vandaag en de sectie Opvolgen samen: niet dubbel.
    expect(groepTellers(['vandaag', 'opvolgen'], tellers)).toEqual([{ soort: 'opvolgen', aantal: 3 }])
    // Een clubmanager zonder Taken: alleen wat hij ziet.
    const zonderTaken = onderdelenVan('werkvloer', [], ['vandaag', 'notities']).map((o) => o.sleutel)
    expect(groepTellers(zonderTaken, tellers)).toEqual([{ soort: 'opvolgen', aantal: 3 }])
    expect(groepTellers(onderdelenVan('planning').map((o) => o.sleutel), tellers)).toEqual([])
  })

  it('het getal in beeld: 99+ boven het maximum, leeg bij 0', () => {
    expect(tellerTekst(7)).toBe('7')
    expect(tellerTekst(99)).toBe('99')
    expect(tellerTekst(100)).toBe('99+')
    expect(tellerTekst(0)).toBe('')
  })

  it('elke teller heeft een zin voor de screenreader, in NL en EN', () => {
    for (const taal of ['nl', 'en'] as const) {
      for (const s of TELLER_SOORTEN) {
        expect(MENU[taal].tellers[s](1)).toMatch(/^1 /)
        expect(MENU[taal].tellers[s](3)).toMatch(/^3 /)
      }
    }
    expect(MENU.nl.tellers.taken(3)).toBe('3 open taken vandaag')
    expect(MENU.en.tellers.taken(1)).toBe('1 open task today')
  })
})

describe('kort onthouden in de browser', () => {
  it('eerst altijd, daarna pas na VERS_MS, een andere vestiging meteen', () => {
    expect(moetVerversen(null, 'budel', 0)).toBe(true)
    const vorige = { vestiging: 'budel', op: 1000 }
    expect(moetVerversen(vorige, 'budel', 1000 + VERS_MS - 1)).toBe(false)
    expect(moetVerversen(vorige, 'budel', 1000 + VERS_MS)).toBe(true)
    expect(moetVerversen(vorige, 'eersel', 1001)).toBe(true)
    expect(moetVerversen(vorige, 'budel', 1001, true)).toBe(true)
  })
})
