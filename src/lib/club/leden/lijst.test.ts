import { describe, expect, it } from 'vitest'
import type { Lid } from '@/lib/club/gedeeld/lid'
import { bouwRijen, filterKeuzes, filterRijen, leesLijstParams, lijstZoek, pagineer, sorteerRijen, STANDAARD_PARAMS, telTegels } from './lijst'

const NU = new Date('2026-10-14T12:00:00+02:00')

function lid(id: string, extra: Partial<Lid> = {}): Lid {
  return {
    id, vestiging: 'budel', lidnummer: `BU0${id}`, sportivityId: null, voornaam: 'Sanne', achternaam: 'Jansen',
    email: null, telefoon: null, geboortedatum: null, geslacht: null, abonnement: 'All-in maand', status: 'actief',
    lidSinds: '2023-01-01', einddatum: null, tags: [], coachId: null, demo: true, ...extra,
  }
}

function dagen(...geleden: number[]): Date[] {
  return geleden.map((d) => new Date(NU.getTime() - d * 86_400_000))
}

const LEDEN = [
  lid('1', { voornaam: 'Bram', achternaam: 'de Vries', tags: ['pt-interesse'], coachId: 'c1' }),
  lid('2', { voornaam: 'Anouk', achternaam: 'Bakker', status: 'gepauzeerd', abonnement: 'Student' }),
  lid('3', { voornaam: 'Cas', achternaam: 'Smit', status: 'proef' }),
  lid('4', { voornaam: 'Dirk', achternaam: 'van Dijk', status: 'gestopt' }),
]
const BEZOEK = new Map([['1', dagen(1, 3, 5, 8, 10, 12, 40, 41, 42)], ['3', dagen(31)]])
const RIJEN = bouwRijen(LEDEN, BEZOEK, new Map(), NU)

describe('bouwRijen', () => {
  it('rekent laatste bezoek en bezoeken in 30 dagen', () => {
    expect(RIJEN[0].bezoeken30).toBe(6)
    expect(RIJEN[0].laatsteBezoek?.getTime()).toBe(dagen(1)[0].getTime())
    expect(RIJEN[1].laatsteBezoek).toBeNull()
  })

  it('geeft alleen actieve en proefleden een behoudsscore', () => {
    expect(RIJEN.map((r) => r.behoud !== null)).toEqual([true, false, true, false])
    expect(RIJEN[2].behoud?.label).toBe('risico')
  })
})

describe('leesLijstParams en lijstZoek', () => {
  it('leest geldige keuzes en negeert onzin', () => {
    const p = leesLijstParams({ status: 'proef', sort: '-behoud', p: '3', risico: '1', q: ' sanne ', coach: 'geen' })
    expect(p).toMatchObject({ status: 'proef', sort: 'behoud', oplopend: false, pagina: 3, risico: true, q: 'sanne', coach: 'geen' })
    expect(leesLijstParams({ status: 'koning', sort: 'hack', p: '-2' })).toEqual(STANDAARD_PARAMS)
  })

  it('maakt korte URLs en zet een wijziging terug op pagina 1', () => {
    const p = leesLijstParams({ status: 'actief', p: '4' })
    expect(lijstZoek(p)).toEqual({ status: 'actief' })
    expect(lijstZoek(p, { pagina: 5 })).toEqual({ status: 'actief', p: '5' })
    expect(lijstZoek(p, { status: null, sort: 'bezoek', oplopend: false })).toEqual({ sort: '-bezoek' })
  })
})

describe('filterRijen', () => {
  it('filtert op status, abonnement, tag, coach en risico', () => {
    const ids = (p: Partial<typeof STANDAARD_PARAMS>) => filterRijen(RIJEN, { ...STANDAARD_PARAMS, ...p }).map((r) => r.lid.id)
    expect(ids({ status: 'gepauzeerd' })).toEqual(['2'])
    expect(ids({ abonnement: 'Student' })).toEqual(['2'])
    expect(ids({ tag: 'pt-interesse' })).toEqual(['1'])
    expect(ids({ coach: 'c1' })).toEqual(['1'])
    expect(ids({ coach: 'geen' })).toEqual(['2', '3', '4'])
    expect(ids({ risico: true })).toEqual(['3'])
  })

  it('zoekt op alle woorden in naam en lidnummer', () => {
    const ids = (q: string) => filterRijen(RIJEN, { ...STANDAARD_PARAMS, q }).map((r) => r.lid.id)
    expect(ids('bram vries')).toEqual(['1'])
    expect(ids('bu03')).toEqual(['3'])
    expect(ids('niemand')).toEqual([])
  })
})

describe('sorteerRijen', () => {
  it('sorteert op achternaam zonder tussenvoegsel', () => {
    expect(sorteerRijen(RIJEN, 'naam', true).map((r) => r.lid.achternaam)).toEqual(['Bakker', 'van Dijk', 'Smit', 'de Vries'])
  })

  it('zet lege waarden altijd achteraan', () => {
    const op = sorteerRijen(RIJEN, 'behoud', true).map((r) => r.lid.id)
    const af = sorteerRijen(RIJEN, 'behoud', false).map((r) => r.lid.id)
    expect(op.slice(0, 2)).toEqual(['3', '1'])
    expect(af.slice(0, 2)).toEqual(['1', '3'])
    expect(af.slice(2).sort()).toEqual(['2', '4'])
  })
})

describe('pagineer', () => {
  it('deelt op in pagina’s en houdt het paginanummer binnen de grenzen', () => {
    const lijst = Array.from({ length: 120 }, (_, i) => i)
    expect(pagineer(lijst, 3)).toMatchObject({ pagina: 3, paginas: 3, van: 101, tot: 120, totaal: 120 })
    expect(pagineer(lijst, 99).pagina).toBe(3)
    expect(pagineer([], 1)).toMatchObject({ pagina: 1, paginas: 1, van: 0, tot: 0 })
  })
})

describe('telTegels en filterKeuzes', () => {
  it('telt statussen en risico', () => {
    expect(telTegels(RIJEN)).toEqual({ actief: 1, gepauzeerd: 1, opgezegd: 0, proef: 1, risico: 1 })
  })

  it('geeft gesorteerde, unieke keuzes', () => {
    expect(filterKeuzes(RIJEN)).toEqual({ abonnementen: ['All-in maand', 'Student'], tags: ['pt-interesse'] })
  })
})
