import { describe, expect, it } from 'vitest'
import { REGEL_SLEUTELS, standaardRegel, type Regel, type RegelSleutel } from './regels'
import { bepaalAanleidingen, isJarig, korteDatum, planRonde, type Aanleiding, type LidSignaal } from './signalen'

const VANDAAG = '2026-10-17'

function lid(over: Partial<LidSignaal> = {}): LidSignaal {
  return {
    id: 'a',
    status: 'actief',
    lidSinds: '2025-01-10',
    einddatum: null,
    geboortedatum: '1990-03-05',
    laatsteBezoek: '2026-10-16',
    behoudScore: 80,
    bezoekenTotaal: 20,
    bezoekenVoorVenster: 18,
    ...over,
  }
}

function alleen(sleutel: RegelSleutel, wijzig: Partial<Regel> = {}): Regel[] {
  return REGEL_SLEUTELS.map((s) => ({ ...standaardRegel(s), aan: s === sleutel, ...(s === sleutel ? wijzig : {}) }))
}

const ALLE = REGEL_SLEUTELS.map(standaardRegel)

describe('welkom', () => {
  it('geeft een nieuw actief lid in de eerste 7 dagen een welkomstgesprek', () => {
    // Arrange
    const leden = [lid({ lidSinds: '2026-10-14' })]
    // Act
    const uit = bepaalAanleidingen(leden, alleen('welkom'), VANDAAG)
    // Assert
    expect(uit).toEqual([{ lidId: 'a', regel: 'welkom', periode: '2026-10-14', waarde: 3, reden: 'Lid sinds 3 dagen' }])
  })

  it('noemt vandaag lid geworden apart', () => {
    const uit = bepaalAanleidingen([lid({ lidSinds: VANDAAG })], alleen('welkom'), VANDAAG)
    expect(uit[0].reden).toBe('Vandaag lid geworden')
  })

  it('slaat leden over die langer dan de drempel lid zijn of nog moeten beginnen', () => {
    const leden = [lid({ id: 'oud', lidSinds: '2026-10-10' }), lid({ id: 'later', lidSinds: '2026-10-20' })]
    expect(bepaalAanleidingen(leden, alleen('welkom'), VANDAAG)).toEqual([])
  })

  it('volgt een ingestelde drempel', () => {
    const uit = bepaalAanleidingen([lid({ lidSinds: '2026-10-07' })], alleen('welkom', { drempel: 14 }), VANDAAG)
    expect(uit).toHaveLength(1)
  })
})

describe('proeflid opvolgen', () => {
  it('komt op de lijst vanaf de drempel, met het aantal bezoeken', () => {
    const uit = bepaalAanleidingen([lid({ status: 'proef', lidSinds: '2026-10-14', bezoekenTotaal: 2 })], alleen('proefles_opvolgen'), VANDAAG)
    expect(uit[0]).toMatchObject({ periode: '2026-10-14', waarde: 3, reden: 'Proeflid sinds 3 dagen, 2 keer geweest' })
  })

  it('niet voor de drempel en niet meer na de inhaalperiode', () => {
    const leden = [lid({ id: 'vroeg', status: 'proef', lidSinds: '2026-10-16' }), lid({ id: 'oud', status: 'proef', lidSinds: '2026-09-20' })]
    expect(bepaalAanleidingen(leden, alleen('proefles_opvolgen'), VANDAAG)).toEqual([])
  })

  it('zegt eerlijk als een proeflid nog niet is geweest', () => {
    const uit = bepaalAanleidingen([lid({ status: 'proef', lidSinds: '2026-10-12', bezoekenTotaal: 0 })], alleen('proefles_opvolgen'), VANDAAG)
    expect(uit[0].reden).toContain('nog niet geweest')
  })
})

describe('lang niet gezien', () => {
  it('meldt een actief lid dat 14 dagen of langer niet kwam, met het laatste bezoek als periode', () => {
    const uit = bepaalAanleidingen([lid({ laatsteBezoek: '2026-10-01' })], alleen('niet_gezien'), VANDAAG)
    expect(uit).toEqual([{ lidId: 'a', regel: 'niet_gezien', periode: '2026-10-01', waarde: 16, reden: 'Al 16 dagen niet geweest' }])
  })

  it('niet bij 13 dagen', () => {
    expect(bepaalAanleidingen([lid({ laatsteBezoek: '2026-10-04' })], alleen('niet_gezien'), VANDAAG)).toEqual([])
  })

  it('telt vanaf de inschrijving als het lid nog nooit kwam', () => {
    const uit = bepaalAanleidingen([lid({ laatsteBezoek: null, lidSinds: '2026-09-01' })], alleen('niet_gezien'), VANDAAG)
    expect(uit[0]).toMatchObject({ periode: '2026-09-01', waarde: 46 })
    expect(uit[0].reden).toContain('sinds de inschrijving')
  })

  it('niet voor gepauzeerde, opgezegde of proefleden', () => {
    const leden = (['gepauzeerd', 'opgezegd', 'proef', 'gestopt'] as const).map((status, i) => lid({ id: String(i), status, laatsteBezoek: '2026-08-01' }))
    expect(bepaalAanleidingen(leden, alleen('niet_gezien'), VANDAAG)).toEqual([])
  })
})

describe('risico', () => {
  it('meldt een score onder de drempel, een keer per kalendermaand', () => {
    const uit = bepaalAanleidingen([lid({ behoudScore: 30 })], alleen('risico'), VANDAAG)
    expect(uit).toEqual([{ lidId: 'a', regel: 'risico', periode: '2026-10', waarde: 30, reden: 'Behoudsscore 30 van 100' }])
  })

  it('niet op of boven de drempel en niet zonder score', () => {
    const leden = [lid({ id: 'b', behoudScore: 45 }), lid({ id: 'c', behoudScore: null })]
    expect(bepaalAanleidingen(leden, alleen('risico'), VANDAAG)).toEqual([])
  })

  it('slaat leden over die al op lang niet gezien staan', () => {
    const uit = bepaalAanleidingen([lid({ behoudScore: 10, laatsteBezoek: '2026-09-01' })], ALLE, VANDAAG)
    expect(uit.map((a) => a.regel)).toEqual(['niet_gezien'])
  })

  it('maar wel als lang niet gezien uit staat', () => {
    const regels = ALLE.map((r) => (r.sleutel === 'niet_gezien' ? { ...r, aan: false } : r))
    const uit = bepaalAanleidingen([lid({ behoudScore: 10, laatsteBezoek: '2026-09-01' })], regels, VANDAAG)
    expect(uit.map((a) => a.regel)).toEqual(['risico'])
  })
})

describe('verjaardag', () => {
  it('meldt wie vandaag jarig is, met de leeftijd en het jaar als periode', () => {
    const uit = bepaalAanleidingen([lid({ geboortedatum: '1990-10-17' })], alleen('verjaardag'), VANDAAG)
    expect(uit).toEqual([{ lidId: 'a', regel: 'verjaardag', periode: '2026', waarde: 36, reden: 'Wordt vandaag 36' }])
  })

  it('niet voor gestopte leden', () => {
    expect(bepaalAanleidingen([lid({ status: 'gestopt', geboortedatum: '1990-10-17' })], alleen('verjaardag'), VANDAAG)).toEqual([])
  })

  it('29 februari viert in een gewoon jaar op 28 februari', () => {
    expect(isJarig('2000-02-29', '2027-02-28')).toBe(true)
    expect(isJarig('2000-02-29', '2028-02-28')).toBe(false)
    expect(isJarig('2000-02-29', '2028-02-29')).toBe(true)
  })
})

describe('opzegging', () => {
  it('vraagt om een exitgesprek tot de inhaalperiode na de einddatum', () => {
    const leden = [lid({ id: 'b', status: 'opgezegd', einddatum: '2026-10-31' }), lid({ id: 'c', status: 'opgezegd', einddatum: '2026-10-10' })]
    const uit = bepaalAanleidingen(leden, alleen('opzegging'), VANDAAG)
    expect(uit.map((a) => [a.lidId, a.periode, a.reden])).toEqual([
      ['b', '2026-10-31', 'Opgezegd, laatste dag 31 okt'],
      ['c', '2026-10-10', 'Opgezegd, gestopt op 10 okt'],
    ])
  })

  it('niet als de einddatum al lang voorbij is', () => {
    expect(bepaalAanleidingen([lid({ status: 'opgezegd', einddatum: '2026-09-01' })], alleen('opzegging'), VANDAAG)).toEqual([])
  })

  it('zonder einddatum met een vaste periode', () => {
    expect(bepaalAanleidingen([lid({ status: 'opgezegd' })], alleen('opzegging'), VANDAAG)[0].periode).toBe('opgezegd')
  })
})

describe('mijlpaal', () => {
  it('meldt het 50e bezoek als dat in de laatste week viel', () => {
    const uit = bepaalAanleidingen([lid({ bezoekenTotaal: 51, bezoekenVoorVenster: 48 })], alleen('mijlpaal'), VANDAAG)
    expect(uit).toEqual([{ lidId: 'a', regel: 'mijlpaal', periode: '50', waarde: 50, reden: '50e bezoek deze week' }])
  })

  it('ook elk veelvoud, en niet als de mijlpaal al eerder was', () => {
    const leden = [lid({ id: 'b', bezoekenTotaal: 101, bezoekenVoorVenster: 99 }), lid({ id: 'c', bezoekenTotaal: 60, bezoekenVoorVenster: 55 })]
    const uit = bepaalAanleidingen(leden, alleen('mijlpaal'), VANDAAG)
    expect(uit.map((a) => [a.lidId, a.waarde])).toEqual([['b', 100]])
  })

  it('niet onder de eerste mijlpaal', () => {
    expect(bepaalAanleidingen([lid({ bezoekenTotaal: 49, bezoekenVoorVenster: 40 })], alleen('mijlpaal'), VANDAAG)).toEqual([])
  })
})

describe('bepaalAanleidingen in het geheel', () => {
  it('doet niets met regels die uit staan', () => {
    const regels = ALLE.map((r) => ({ ...r, aan: false }))
    expect(bepaalAanleidingen([lid({ lidSinds: VANDAAG, geboortedatum: '1990-10-17' })], regels, VANDAAG)).toEqual([])
  })

  it('is deterministisch: andere volgorde van leden geeft dezelfde uitkomst', () => {
    const leden = [lid({ id: 'z', geboortedatum: '1980-10-17' }), lid({ id: 'b', lidSinds: '2026-10-15' }), lid({ id: 'm', geboortedatum: '1999-10-17' })]
    const a = bepaalAanleidingen(leden, ALLE, VANDAAG)
    const b = bepaalAanleidingen([...leden].reverse(), ALLE, VANDAAG)
    expect(a).toEqual(b)
    expect(a.map((x) => `${x.regel}:${x.lidId}`)).toEqual(['welkom:b', 'verjaardag:m', 'verjaardag:z'])
  })

  it('geeft een lid meerdere aanleidingen als die allemaal kloppen', () => {
    const uit = bepaalAanleidingen([lid({ lidSinds: '2026-10-15', geboortedatum: '2000-10-17' })], ALLE, VANDAAG)
    expect(uit.map((a) => a.regel)).toEqual(['welkom', 'verjaardag'])
  })
})

describe('planRonde', () => {
  const a = (lidId: string, regel: RegelSleutel, periode = 'p'): Aanleiding => ({ lidId, regel, periode, waarde: null, reden: '' })

  it('maakt nieuwe taken voor aanleidingen zonder open taak', () => {
    const ronde = planRonde([a('x', 'welkom'), a('y', 'verjaardag')], [], new Set(['x', 'y']))
    expect(ronde.nieuw).toHaveLength(2)
    expect(ronde.vervallen).toEqual([])
  })

  it('geen tweede taak als het lid al een open taak voor die regel heeft, ook niet voor een nieuwe periode', () => {
    const ronde = planRonde([a('x', 'risico', '2026-11')], [{ id: 't1', lidId: 'x', regel: 'risico', periode: '2026-10' }], new Set(['x']))
    expect(ronde.nieuw).toEqual([])
    expect(ronde.vervallen).toEqual([])
  })

  it('laat open taken vervallen als de stand niet meer klopt', () => {
    const open = [
      { id: 't2', lidId: 'x', regel: 'niet_gezien' as const, periode: '2026-09-01' },
      { id: 't1', lidId: 'y', regel: 'risico' as const, periode: '2026-10' },
    ]
    expect(planRonde([], open, new Set(['x', 'y'])).vervallen).toEqual(['t1', 't2'])
  })

  it('laat gebeurtenissen (welkom, verjaardag, mijlpaal) en onbekende leden staan', () => {
    const open = [
      { id: 't1', lidId: 'x', regel: 'verjaardag' as const, periode: '2026' },
      { id: 't2', lidId: 'ander', regel: 'niet_gezien' as const, periode: '2026-09-01' },
    ]
    expect(planRonde([], open, new Set(['x'])).vervallen).toEqual([])
  })

  it('is idempotent: na het aanmaken levert dezelfde ronde niets nieuws op', () => {
    const aanleidingen = [a('x', 'welkom', '2026-10-15')]
    const eerste = planRonde(aanleidingen, [], new Set(['x']))
    const open = eerste.nieuw.map((n, i) => ({ id: `t${i}`, lidId: n.lidId, regel: n.regel, periode: n.periode }))
    expect(planRonde(aanleidingen, open, new Set(['x']))).toEqual({ nieuw: [], vervallen: [] })
  })
})

describe('korteDatum', () => {
  it('schrijft een dag kort in het Nederlands', () => {
    expect(korteDatum('2026-03-01')).toBe('1 mrt')
  })
})
