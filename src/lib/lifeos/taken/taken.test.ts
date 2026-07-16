import { describe, it, expect } from 'vitest'
import {
  leesNieuweTaak,
  leesTaakWijziging,
  taakVanRij,
  takenVanRijen,
  top3Van,
  eersteVrijePositie,
  isTop3Positie,
  MAX_TITEL_LENGTE,
  type Taak,
} from './taken'

function taak(overschrijf: Partial<Taak> = {}): Taak {
  return {
    id: 'id-1',
    titel: 'Iets doen',
    notitie: null,
    klaar: false,
    klaarOp: null,
    datum: '2026-07-15',
    top3Positie: null,
    aangemaaktOp: '2026-07-15T08:00:00.000Z',
    ...overschrijf,
  }
}

describe('leesNieuweTaak', () => {
  it('leest een volledige taak', () => {
    // Arrange
    const body = {
      titel: '  Offerte sturen  ',
      notitie: ' voor donderdag ',
      datum: '2026-07-15',
      top3Positie: 2,
    }

    // Act
    const uitkomst = leesNieuweTaak(body)

    // Assert — titel en notitie getrimd, geen verrassingen.
    expect(uitkomst).toEqual({
      ok: true,
      waarde: {
        titel: 'Offerte sturen',
        notitie: 'voor donderdag',
        datum: '2026-07-15',
        top3Positie: 2,
      },
    })
  })

  it('accepteert een taak zonder dag: dat is de "ooit"-bak', () => {
    const uitkomst = leesNieuweTaak({ titel: 'Ooit die boekenkast' })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) {
      expect(uitkomst.waarde.datum).toBeNull()
      expect(uitkomst.waarde.top3Positie).toBeNull()
      expect(uitkomst.waarde.notitie).toBeNull()
    }
  })

  it('weigert een lege titel — een taak zonder titel is geen taak', () => {
    expect(leesNieuweTaak({ titel: '   ' }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: '' }).ok).toBe(false)
    expect(leesNieuweTaak({}).ok).toBe(false)
  })

  it('weigert een titel over de limiet', () => {
    const uitkomst = leesNieuweTaak({ titel: 'a'.repeat(MAX_TITEL_LENGTE + 1) })

    expect(uitkomst.ok).toBe(false)
  })

  it('laat een titel op precies de limiet door', () => {
    expect(leesNieuweTaak({ titel: 'a'.repeat(MAX_TITEL_LENGTE) }).ok).toBe(true)
  })

  it('weigert een top-3-positie zonder dag — een top-3 hoort bij een dag', () => {
    // Arrange/Act
    const uitkomst = leesNieuweTaak({ titel: 'Trainen', top3Positie: 1 })

    // Assert — dezelfde regel als de check-constraint in migratie 020.
    expect(uitkomst.ok).toBe(false)
    if (!uitkomst.ok) expect(uitkomst.fout).toContain('datum')
  })

  it('weigert een positie buiten 1-3', () => {
    expect(leesNieuweTaak({ titel: 'x', datum: '2026-07-15', top3Positie: 0 }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', datum: '2026-07-15', top3Positie: 4 }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', datum: '2026-07-15', top3Positie: '1' }).ok).toBe(false)
  })

  it('weigert een datum die geen datum is', () => {
    expect(leesNieuweTaak({ titel: 'x', datum: '15-07-2026' }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', datum: '2026-02-31' }).ok).toBe(false)
    expect(leesNieuweTaak({ titel: 'x', datum: 'morgen' }).ok).toBe(false)
  })

  it('weigert onzin in plaats van te struikelen', () => {
    expect(leesNieuweTaak(null).ok).toBe(false)
    expect(leesNieuweTaak('titel').ok).toBe(false)
    expect(leesNieuweTaak([]).ok).toBe(false)
  })
})

describe('leesTaakWijziging', () => {
  it('leest alleen wat je meestuurt — afvinken hoeft niet de hele taak mee te sturen', () => {
    // Arrange/Act
    const uitkomst = leesTaakWijziging({ klaar: true })

    // Assert
    expect(uitkomst).toEqual({ ok: true, waarde: { klaar: true } })
  })

  it('kan een taak uit de top-3 halen met null', () => {
    const uitkomst = leesTaakWijziging({ top3Positie: null })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde.top3Positie).toBeNull()
  })

  it('onderscheidt "veld weggelaten" van "veld op null"', () => {
    const zonder = leesTaakWijziging({ klaar: true })
    const metNull = leesTaakWijziging({ klaar: true, notitie: null })

    expect(zonder.ok && 'notitie' in zonder.waarde).toBe(false)
    expect(metNull.ok && 'notitie' in metNull.waarde).toBe(true)
  })

  it('weigert een lege wijziging', () => {
    expect(leesTaakWijziging({}).ok).toBe(false)
  })

  it('weigert een klaar die geen boolean is', () => {
    expect(leesTaakWijziging({ klaar: 'ja' }).ok).toBe(false)
    expect(leesTaakWijziging({ klaar: 1 }).ok).toBe(false)
  })
})

describe('taakVanRij', () => {
  it('leest een rij uit de database', () => {
    // Arrange
    const rij = {
      id: 'abc',
      titel: 'Offerte',
      notitie: null,
      klaar: true,
      klaar_op: '2026-07-15T10:00:00.000Z',
      datum: '2026-07-15',
      top3_positie: 1,
      aangemaakt_op: '2026-07-15T08:00:00.000Z',
    }

    // Act
    const uit = taakVanRij(rij)

    // Assert
    expect(uit?.klaar).toBe(true)
    expect(uit?.top3Positie).toBe(1)
    expect(uit?.klaarOp).toBe('2026-07-15T10:00:00.000Z')
  })

  it('geeft null bij een onbruikbare rij in plaats van een halve taak', () => {
    expect(taakVanRij(null)).toBeNull()
    expect(taakVanRij({ titel: 'geen id' })).toBeNull()
    expect(taakVanRij({ id: 'x', aangemaakt_op: '2026-07-15T08:00:00.000Z' })).toBeNull()
  })

  it('negeert een positie buiten 1-3 uit de database', () => {
    const uit = taakVanRij({
      id: 'x',
      titel: 'x',
      aangemaakt_op: '2026-07-15T08:00:00.000Z',
      top3_positie: 7,
    })

    expect(uit?.top3Positie).toBeNull()
  })

  it('slaat kapotte rijen over zonder de rest te verliezen', () => {
    const rijen = [
      { id: 'a', titel: 'Goed', aangemaakt_op: '2026-07-15T08:00:00.000Z' },
      null,
      { titel: 'Kapot' },
    ]

    expect(takenVanRijen(rijen)).toHaveLength(1)
  })
})

describe('top3Van', () => {
  it('zet de taken op hun eigen plek', () => {
    // Arrange
    const taken = [
      taak({ id: 'c', top3Positie: 3, titel: 'Derde' }),
      taak({ id: 'a', top3Positie: 1, titel: 'Eerste' }),
    ]

    // Act
    const drie = top3Van(taken)

    // Assert — positie 2 blijft leeg; nummer 3 schuift niet op.
    expect(drie).toHaveLength(3)
    expect(drie[0]?.titel).toBe('Eerste')
    expect(drie[1]).toBeNull()
    expect(drie[2]?.titel).toBe('Derde')
  })

  it('geeft drie lege plekken bij geen taken', () => {
    expect(top3Van([])).toEqual([null, null, null])
  })

  it('negeert taken zonder positie', () => {
    const drie = top3Van([taak({ top3Positie: null })])

    expect(drie).toEqual([null, null, null])
  })
})

describe('eersteVrijePositie', () => {
  it('geeft de laagste vrije plek', () => {
    expect(eersteVrijePositie([])).toBe(1)
    expect(eersteVrijePositie([taak({ id: 'a', top3Positie: 1 })])).toBe(2)
    expect(
      eersteVrijePositie([taak({ id: 'a', top3Positie: 1 }), taak({ id: 'c', top3Positie: 3 })]),
    ).toBe(2)
  })

  it('geeft null als de top-3 vol is — drie is drie', () => {
    const vol = [
      taak({ id: 'a', top3Positie: 1 }),
      taak({ id: 'b', top3Positie: 2 }),
      taak({ id: 'c', top3Positie: 3 }),
    ]

    expect(eersteVrijePositie(vol)).toBeNull()
  })
})

describe('isTop3Positie', () => {
  it('herkent alleen 1, 2 en 3', () => {
    expect(isTop3Positie(1)).toBe(true)
    expect(isTop3Positie(3)).toBe(true)
    expect(isTop3Positie(0)).toBe(false)
    expect(isTop3Positie(4)).toBe(false)
    expect(isTop3Positie('2')).toBe(false)
    expect(isTop3Positie(null)).toBe(false)
  })
})
