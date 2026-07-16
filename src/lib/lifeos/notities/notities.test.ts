import { describe, it, expect } from 'vitest'
import {
  leesNieuweNotitie,
  leesNotitieAntwoord,
  leesNotitieJson,
  leesNotitiesAntwoord,
  leesTekst,
  isSoort,
  notitieVanRij,
  notitiesVanRijen,
  MAX_TEKST_LENGTE,
} from './notities'

const RIJ = {
  id: 'n-1',
  tekst: 'Bellen met de boekhouder',
  soort: 'brain_dump',
  datum: '2026-07-16',
  aangemaakt_op: '2026-07-16T09:00:00.000Z',
  bijgewerkt_op: '2026-07-16T09:00:00.000Z',
}

const JSON_NOTITIE = {
  id: 'n-1',
  tekst: 'Bellen met de boekhouder',
  soort: 'brain_dump',
  datum: '2026-07-16',
  aangemaaktOp: '2026-07-16T09:00:00.000Z',
  bijgewerktOp: '2026-07-16T09:00:00.000Z',
}

describe('isSoort', () => {
  it('kent precies twee soorten — de allowlist uit migratie 050', () => {
    expect(isSoort('brain_dump')).toBe(true)
    expect(isSoort('journal')).toBe(true)
    expect(isSoort('braindump')).toBe(false)
    expect(isSoort('')).toBe(false)
    expect(isSoort(null)).toBe(false)
    expect(isSoort(1)).toBe(false)
  })
})

describe('leesTekst', () => {
  it('trimt', () => {
    // Arrange
    const ruw = '   Idee: LifeOS offline-first   '

    // Act
    const uitkomst = leesTekst(ruw)

    // Assert
    expect(uitkomst).toEqual({ ok: true, waarde: 'Idee: LifeOS offline-first' })
  })

  it('weigert tekst die alleen uit spaties bestaat — dat is leeg', () => {
    // Arrange/Act
    const uitkomst = leesTekst('    ')

    // Assert — de database denkt er hetzelfde over (btrim-check).
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert tekst boven de limiet, en accepteert hem er precies op', () => {
    // Arrange
    const opDeGrens = 'a'.repeat(MAX_TEKST_LENGTE)
    const eroverheen = 'a'.repeat(MAX_TEKST_LENGTE + 1)

    // Act + Assert
    expect(leesTekst(opDeGrens).ok).toBe(true)
    expect(leesTekst(eroverheen).ok).toBe(false)
  })

  it('weigert niet-tekst', () => {
    expect(leesTekst(42).ok).toBe(false)
    expect(leesTekst(null).ok).toBe(false)
    expect(leesTekst(undefined).ok).toBe(false)
  })
})

describe('leesNieuweNotitie', () => {
  it('leest een volledige notitie', () => {
    // Arrange
    const body = { tekst: '  Idee voor Vita  ', soort: 'brain_dump', datum: '2026-07-16' }

    // Act
    const uitkomst = leesNieuweNotitie(body)

    // Assert
    expect(uitkomst).toEqual({
      ok: true,
      waarde: { tekst: 'Idee voor Vita', soort: 'brain_dump', datum: '2026-07-16' },
    })
  })

  it('eist een datum — een idee zonder dag ben je kwijt', () => {
    // Arrange/Act
    const uitkomst = leesNieuweNotitie({ tekst: 'Iets', soort: 'brain_dump' })

    // Assert — anders dan bij taken bestaat er hier geen "ooit"-bak: dan was de
    // dag geen ordening meer maar een suggestie.
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert een onbekende soort in plaats van er iets van te maken', () => {
    const uitkomst = leesNieuweNotitie({ tekst: 'Iets', soort: 'gedachte', datum: '2026-07-16' })

    expect(uitkomst.ok).toBe(false)
    if (!uitkomst.ok) expect(uitkomst.fout).toContain('brain_dump')
  })

  it('weigert een datum die niet bestaat', () => {
    // Arrange — 31 februari; JS rolt die stilletjes door naar 3 maart.
    const uitkomst = leesNieuweNotitie({
      tekst: 'Iets',
      soort: 'journal',
      datum: '2026-02-31',
    })

    // Assert
    expect(uitkomst.ok).toBe(false)
  })

  it('weigert onzin als body', () => {
    expect(leesNieuweNotitie(null).ok).toBe(false)
    expect(leesNieuweNotitie('tekst').ok).toBe(false)
    expect(leesNieuweNotitie([]).ok).toBe(false)
  })
})

describe('notitieVanRij', () => {
  it('leest een rij uit Postgres', () => {
    // Act
    const notitie = notitieVanRij(RIJ)

    // Assert
    expect(notitie).toEqual({
      id: 'n-1',
      tekst: 'Bellen met de boekhouder',
      soort: 'brain_dump',
      datum: '2026-07-16',
      aangemaaktOp: '2026-07-16T09:00:00.000Z',
      bijgewerktOp: '2026-07-16T09:00:00.000Z',
    })
  })

  it('weigert een rij met een onbekende soort in plaats van hem door te geven', () => {
    // Arrange — bv. na een migratie die de allowlist verruimde.
    const rij = { ...RIJ, soort: 'iets_nieuws' }

    // Act + Assert — de database is een systeemgrens als elke andere. Dit is
    // precies het gat waar een cast doorheen glipt.
    expect(notitieVanRij(rij)).toBeNull()
  })

  it('weigert een rij zonder id, tekst of datum', () => {
    expect(notitieVanRij({ ...RIJ, id: null })).toBeNull()
    expect(notitieVanRij({ ...RIJ, tekst: '   ' })).toBeNull()
    expect(notitieVanRij({ ...RIJ, datum: undefined })).toBeNull()
    expect(notitieVanRij({ ...RIJ, bijgewerkt_op: null })).toBeNull()
    expect(notitieVanRij(null)).toBeNull()
  })
})

describe('notitiesVanRijen', () => {
  it('laat kapotte rijen weg maar houdt de rest', () => {
    // Arrange
    const rijen = [RIJ, { onzin: true }, { ...RIJ, id: 'n-2' }]

    // Act
    const notities = notitiesVanRijen(rijen)

    // Assert
    expect(notities.map((n) => n.id)).toEqual(['n-1', 'n-2'])
  })

  it('geeft een lege lijst bij lege invoer', () => {
    expect(notitiesVanRijen([])).toEqual([])
  })
})

describe('leesNotitiesAntwoord', () => {
  it('leest het antwoord van GET /api/notities', () => {
    // Act
    const notities = leesNotitiesAntwoord({ notities: [JSON_NOTITIE] })

    // Assert
    expect(notities).toHaveLength(1)
    expect(notities?.[0]?.tekst).toBe('Bellen met de boekhouder')
  })

  it('leest een lege lijst — dat is geldig, niet fout', () => {
    // Assert — "je schreef nog niets vandaag" is een dag, geen storing.
    expect(leesNotitiesAntwoord({ notities: [] })).toEqual([])
  })

  it('faalt op één kapotte notitie i.p.v. hem stil weg te laten', () => {
    // Arrange — een idee dat zomaar uit je brain dump verdwijnt, is erger dan
    // een zichtbare foutmelding.
    const ruw = { notities: [JSON_NOTITIE, { id: 'n-2' }] }

    // Act + Assert
    expect(leesNotitiesAntwoord(ruw)).toBeNull()
  })

  it('faalt als het antwoord geen notities-array heeft', () => {
    expect(leesNotitiesAntwoord({})).toBeNull()
    expect(leesNotitiesAntwoord({ notities: 'geen array' })).toBeNull()
    expect(leesNotitiesAntwoord(null)).toBeNull()
  })
})

describe('leesNotitieJson / leesNotitieAntwoord', () => {
  it('leest het antwoord van POST /api/notities', () => {
    expect(leesNotitieAntwoord({ notitie: JSON_NOTITIE })?.id).toBe('n-1')
  })

  it('faalt als de notitie ontbreekt of niet klopt', () => {
    expect(leesNotitieAntwoord({})).toBeNull()
    expect(leesNotitieAntwoord({ notitie: null })).toBeNull()
    expect(leesNotitieJson({ ...JSON_NOTITIE, soort: 'onzin' })).toBeNull()
  })
})
