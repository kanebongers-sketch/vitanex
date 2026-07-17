// Tests voor de projecten-grens. Een project is klein — naam, omschrijving,
// actief — dus het interessante zit in wat er NIET doorheen komt: een lege naam,
// een id dat geen id is, een rij die half kapot uit de database komt.

import { describe, expect, it } from 'vitest'
import {
  isProjectId,
  leesNieuwProject,
  leesProjectAntwoord,
  leesProjectJson,
  leesProjectWijziging,
  leesProjectenAntwoord,
  projectVanRij,
  projectenVanRijen,
  MAX_PROJECT_NAAM,
  MAX_PROJECT_OMSCHRIJVING,
  type Project,
} from './projecten'

const ID = '3f1a2b7c-9d4e-4a10-8b22-5c6d7e8f9a0b'

function project(overschrijf: Partial<Project> = {}): Project {
  return {
    id: ID,
    naam: 'MentaForce',
    omschrijving: null,
    actief: true,
    aangemaaktOp: '2026-07-15T08:00:00.000Z',
    ...overschrijf,
  }
}

describe('isProjectId', () => {
  it('herkent een uuid', () => {
    expect(isProjectId(ID)).toBe(true)
    expect(isProjectId(ID.toUpperCase())).toBe(true)
  })

  // De reden dat deze functie bestaat: Postgres wijst 'mentaforce' af met een
  // 22P02, en die fout is niet naar iets menselijks te vertalen. Hier is het
  // gewoon: dit is geen id.
  it('weigert alles wat geen uuid is', () => {
    expect(isProjectId('mentaforce')).toBe(false)
    expect(isProjectId('')).toBe(false)
    expect(isProjectId('3f1a2b7c-9d4e-4a10-8b22')).toBe(false)
    expect(isProjectId(null)).toBe(false)
    expect(isProjectId(123)).toBe(false)
  })
})

describe('leesNieuwProject', () => {
  it('leest een volledig project en trimt de invoer', () => {
    // Arrange/Act
    const uitkomst = leesNieuwProject({ naam: '  MentaForce  ', omschrijving: ' Het platform ' })

    // Assert
    expect(uitkomst).toEqual({
      ok: true,
      waarde: { naam: 'MentaForce', omschrijving: 'Het platform' },
    })
  })

  it('accepteert een project zonder omschrijving', () => {
    const uitkomst = leesNieuwProject({ naam: 'LifeOS' })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde.omschrijving).toBeNull()
  })

  it('leest een lege omschrijving als "geen omschrijving"', () => {
    const uitkomst = leesNieuwProject({ naam: 'LifeOS', omschrijving: '   ' })

    expect(uitkomst.ok).toBe(true)
    if (uitkomst.ok) expect(uitkomst.waarde.omschrijving).toBeNull()
  })

  it('weigert een lege naam — een project zonder naam is geen project', () => {
    expect(leesNieuwProject({ naam: '   ' }).ok).toBe(false)
    expect(leesNieuwProject({ naam: '' }).ok).toBe(false)
    expect(leesNieuwProject({}).ok).toBe(false)
  })

  it('bewaakt de lengtes uit migratie 100', () => {
    expect(leesNieuwProject({ naam: 'a'.repeat(MAX_PROJECT_NAAM) }).ok).toBe(true)
    expect(leesNieuwProject({ naam: 'a'.repeat(MAX_PROJECT_NAAM + 1) }).ok).toBe(false)
    expect(
      leesNieuwProject({ naam: 'x', omschrijving: 'a'.repeat(MAX_PROJECT_OMSCHRIJVING + 1) }).ok,
    ).toBe(false)
  })

  it('weigert onzin in plaats van te struikelen', () => {
    expect(leesNieuwProject(null).ok).toBe(false)
    expect(leesNieuwProject('MentaForce').ok).toBe(false)
    expect(leesNieuwProject([]).ok).toBe(false)
    expect(leesNieuwProject({ naam: 42 }).ok).toBe(false)
  })
})

describe('leesProjectWijziging', () => {
  it('leest alleen wat je meestuurt', () => {
    expect(leesProjectWijziging({ actief: false })).toEqual({
      ok: true,
      waarde: { actief: false },
    })
  })

  it('onderscheidt "veld weggelaten" van "veld op null"', () => {
    const zonder = leesProjectWijziging({ naam: 'Nieuw' })
    const metNull = leesProjectWijziging({ naam: 'Nieuw', omschrijving: null })

    expect(zonder.ok && 'omschrijving' in zonder.waarde).toBe(false)
    expect(metNull.ok && 'omschrijving' in metNull.waarde).toBe(true)
  })

  it('weigert een lege wijziging', () => {
    expect(leesProjectWijziging({}).ok).toBe(false)
  })

  it('weigert een actief die geen boolean is', () => {
    expect(leesProjectWijziging({ actief: 'ja' }).ok).toBe(false)
    expect(leesProjectWijziging({ actief: 1 }).ok).toBe(false)
  })

  it('weigert een lege naam bij het hernoemen', () => {
    expect(leesProjectWijziging({ naam: '  ' }).ok).toBe(false)
  })
})

describe('projectVanRij', () => {
  it('leest een rij uit de database', () => {
    const uit = projectVanRij({
      id: ID,
      naam: 'MentaForce',
      omschrijving: 'Het platform',
      actief: true,
      aangemaakt_op: '2026-07-15T08:00:00.000Z',
    })

    expect(uit).toEqual(project({ omschrijving: 'Het platform' }))
  })

  it('geeft null bij een onbruikbare rij in plaats van een half project', () => {
    expect(projectVanRij(null)).toBeNull()
    expect(projectVanRij({ naam: 'geen id' })).toBeNull()
    expect(projectVanRij({ id: ID, aangemaakt_op: '2026-07-15T08:00:00.000Z' })).toBeNull()
  })

  // Liever een project stil uit de keuzelijst dan een gearchiveerd project dat
  // terugkomt omdat de kolom ontbrak.
  it('leest een ontbrekende actief-kolom als niet-actief', () => {
    const uit = projectVanRij({ id: ID, naam: 'x', aangemaakt_op: '2026-07-15T08:00:00.000Z' })

    expect(uit?.actief).toBe(false)
  })

  it('slaat kapotte rijen over zonder de rest te verliezen', () => {
    const rijen = [
      { id: ID, naam: 'Goed', actief: true, aangemaakt_op: '2026-07-15T08:00:00.000Z' },
      null,
      { naam: 'Kapot' },
    ]

    expect(projectenVanRijen(rijen)).toHaveLength(1)
  })
})

describe('leesProjectenAntwoord', () => {
  it('leest het antwoord van onze eigen API', () => {
    const uit = leesProjectenAntwoord({
      projecten: [
        { id: ID, naam: 'MentaForce', actief: true, aangemaaktOp: '2026-07-15T08:00:00.000Z' },
      ],
    })

    expect(uit).toHaveLength(1)
    expect(uit?.[0]?.naam).toBe('MentaForce')
  })

  // Eén kapot item = een kapot antwoord: stil overslaan zou een project laten
  // verdwijnen zonder dat iemand het merkt.
  it('weigert het hele antwoord als er één project kapot is', () => {
    const uit = leesProjectenAntwoord({
      projecten: [
        { id: ID, naam: 'Goed', actief: true, aangemaaktOp: '2026-07-15T08:00:00.000Z' },
        { naam: 'Kapot' },
      ],
    })

    expect(uit).toBeNull()
  })

  it('weigert een antwoord dat geen lijst is', () => {
    expect(leesProjectenAntwoord({})).toBeNull()
    expect(leesProjectenAntwoord(null)).toBeNull()
    expect(leesProjectenAntwoord({ projecten: 'geen lijst' })).toBeNull()
  })

  it('leest een lege lijst als een lege lijst — dat is geen fout', () => {
    expect(leesProjectenAntwoord({ projecten: [] })).toEqual([])
  })
})

describe('leesProjectAntwoord / leesProjectJson', () => {
  it('leest één project uit een POST/PATCH-antwoord', () => {
    const uit = leesProjectAntwoord({
      project: { id: ID, naam: 'LifeOS', actief: true, aangemaaktOp: '2026-07-15T08:00:00.000Z' },
    })

    expect(uit?.id).toBe(ID)
  })

  it('geeft null bij een leeg of kapot antwoord', () => {
    expect(leesProjectAntwoord({})).toBeNull()
    expect(leesProjectJson({ id: ID })).toBeNull()
  })
})
