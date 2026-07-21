// Tests voor de bord-logica. Het interessante zit in het tellen (0/0 is geldig,
// een percentage mag nooit door nul delen) en in het groeperen (een taak zonder
// project, of met een onbekend project, mag niet verdwijnen).

import { describe, expect, it } from 'vitest'
import { groepeerPerProject, voortgang, voortgangProcent } from './voortgang'
import type { Project } from './projecten'

function project(overschrijf: Partial<Project> = {}): Project {
  return {
    id: 'p-1',
    naam: 'MentaForce',
    omschrijving: null,
    actief: true,
    aangemaaktOp: '2026-07-15T08:00:00.000Z',
    ...overschrijf,
  }
}

function taak(projectId: string | null, klaar: boolean) {
  return { projectId, klaar }
}

describe('voortgang', () => {
  it('telt afgevinkt tegen totaal', () => {
    const uit = voortgang([taak('p-1', true), taak('p-1', false), taak('p-1', true)])

    expect(uit).toEqual({ klaar: 2, totaal: 3 })
  })

  it('leest een lege lijst als 0 van 0 — geen fout, geen bijna-klaar', () => {
    expect(voortgang([])).toEqual({ klaar: 0, totaal: 0 })
  })
})

describe('voortgangProcent', () => {
  it('rondt af naar een heel percentage', () => {
    expect(voortgangProcent({ klaar: 3, totaal: 8 })).toBe(38)
  })

  it('geeft 0 bij een lege teller in plaats van NaN', () => {
    expect(voortgangProcent({ klaar: 0, totaal: 0 })).toBe(0)
  })

  it('geeft 100 als alles af is', () => {
    expect(voortgangProcent({ klaar: 5, totaal: 5 })).toBe(100)
  })
})

describe('groepeerPerProject', () => {
  it('plaatst elke taak bij zijn project en behoudt de projectvolgorde', () => {
    const projecten = [project({ id: 'a', naam: 'Alpha' }), project({ id: 'b', naam: 'Bravo' })]
    const taken = [taak('b', false), taak('a', true), taak('a', false)]

    const { groepen, zonderProject } = groepeerPerProject(projecten, taken)

    expect(groepen.map((g) => g.project.id)).toEqual(['a', 'b'])
    expect(groepen[0].taken).toHaveLength(2)
    expect(groepen[1].taken).toHaveLength(1)
    expect(zonderProject).toHaveLength(0)
  })

  it('geeft een project zonder taken een lege lijst, niet undefined', () => {
    const { groepen } = groepeerPerProject([project({ id: 'a' })], [])

    expect(groepen[0].taken).toEqual([])
  })

  it('zet taken zonder project in de "zonder project"-bak', () => {
    const { groepen, zonderProject } = groepeerPerProject([project({ id: 'a' })], [taak(null, false)])

    expect(groepen[0].taken).toHaveLength(0)
    expect(zonderProject).toHaveLength(1)
  })

  // Verdwijnen is erger dan op de verkeerde plek staan: een onbekend project-id
  // valt terug op "zonder project" i.p.v. de taak stil weg te laten.
  it('vangt een taak met een onbekend project op i.p.v. hem te verliezen', () => {
    const { zonderProject } = groepeerPerProject([project({ id: 'a' })], [taak('weg', true)])

    expect(zonderProject).toHaveLength(1)
  })
})
