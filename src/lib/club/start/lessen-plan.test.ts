import { describe, expect, it } from 'vitest'
import { LESTYPE_SCHEMA, SERIE_SCHEMA, leesNieuw, leesVolgensSchema } from '@/lib/club/instellingen/validatie'
import { aantalWijzigingen, beginLessen, beginTypen, controleerLessen, legeLes, leegType, lessenPlan, lesVelden, typeVelden, zichtbareLessen, type BestaandeSerie, type BestaandType } from './lessen-plan'
import { ALLE_LESSEN, ALLE_LESTYPEN } from './voorbeelden'
import { pakketVoor, voorstelLestypen } from './soorten'

const KRACHT: BestaandType = { id: 't1', naam: 'Kracht in de groep', omschrijving: null, soort: 'kracht', duurMin: 55, intensiteit: 2 }
const SERIE: BestaandeSerie = { id: 's1', lestypeId: 't1', zaalId: null, instructeurId: null, weekdag: 4, starttijd: '19:00:00', duurMin: 55, capaciteit: 16 }

describe('beginTypen', () => {
  it('zet bij een nieuwe PT-studio de passende lestypen aan en de rest uit', () => {
    const typen = beginTypen([], voorstelLestypen('pt'), ALLE_LESTYPEN)
    const aan = typen.filter((t) => t.aan).map((t) => t.naam)
    expect(aan).toEqual(['Small group training', 'Personal training', 'Kracht in de groep', 'Circuittraining', 'Intake'])
    expect(typen.find((t) => t.naam === 'Spinning')?.aan).toBe(false)
    expect(typen.find((t) => t.naam === 'Dance fitness')?.aan).toBe(false)
    expect(new Set(typen.map((t) => t.sleutel)).size).toBe(typen.length)
  })

  it('laat eigen lestypen leidend zijn en zet geen nieuwe aan', () => {
    const typen = beginTypen([KRACHT], voorstelLestypen('pt'), ALLE_LESTYPEN)
    expect(typen[0]).toMatchObject({ sleutel: 'id:t1', aan: true, past: true })
    expect(typen.filter((t) => t.aan)).toHaveLength(1)
    expect(typen.filter((t) => zelfde(t.naam, 'Kracht in de groep'))).toHaveLength(1)
  })
})

function zelfde(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

describe('beginLessen', () => {
  it('stelt de week voor bij gekozen lestypen, met de duur van het lestype en de standaardzaal', () => {
    const typen = beginTypen([], voorstelLestypen('pt'), ALLE_LESTYPEN)
    const lessen = zichtbareLessen(beginLessen(typen, [], ALLE_LESSEN, 'z1'), typen)
    expect(lessen.length).toBe(pakketVoor('pt').lessen.length)
    expect(lessen.every((l) => l.aan && l.zaalId === 'z1')).toBe(true)
    expect(lessen[0].weekdag).toBe(1)
    expect(lessen.find((l) => l.typeSleutel === 'vb:Personal training')?.duurMin).toBe(60)
  })

  it('stelt niets dubbel voor bij een lestype dat al vaste lessen heeft', () => {
    const typen = beginTypen([KRACHT], [], ALLE_LESTYPEN)
    const lessen = beginLessen(typen, [SERIE], ALLE_LESSEN, null)
    const kracht = lessen.filter((l) => l.typeSleutel === 'id:t1')
    expect(kracht).toHaveLength(1)
    expect(kracht[0]).toMatchObject({ id: 's1', starttijd: '19:00' })
  })

  it('toont alleen lessen van gekozen lestypen', () => {
    const typen = beginTypen([], voorstelLestypen('pt'), ALLE_LESTYPEN)
    const alle = beginLessen(typen, [], ALLE_LESSEN, null)
    expect(alle.some((l) => l.typeSleutel === 'vb:Spinning')).toBe(true)
    expect(zichtbareLessen(alle, typen).some((l) => l.typeSleutel === 'vb:Spinning')).toBe(false)
  })
})

describe('controleerLessen', () => {
  const typen = beginTypen([], voorstelLestypen('pt'), ALLE_LESTYPEN)
  const lessen = beginLessen(typen, [], ALLE_LESSEN, null)

  it('keurt het voorstel goed', () => {
    expect(controleerLessen(typen, lessen)).toBeNull()
  })

  it('vraagt om een naam, een geldige duur en geen dubbele namen', () => {
    expect(controleerLessen([{ ...typen[0], naam: ' ' }], [])).toMatch(/naam/)
    expect(controleerLessen([{ ...typen[0], duurMin: 5 }], [])).toMatch(/tussen 10 en 240/)
    expect(controleerLessen([typen[0], { ...typen[1], naam: typen[0].naam.toUpperCase() }], [])).toMatch(/twee lestypen/)
  })

  it('controleert de tijd en de plekken van lessen die aan staan', () => {
    const les = zichtbareLessen(lessen, typen)[0]
    expect(controleerLessen(typen, [{ ...les, starttijd: '25:00' }])).toMatch(/begintijd/)
    expect(controleerLessen(typen, [{ ...les, capaciteit: 0 }])).toMatch(/plekken/)
    expect(controleerLessen(typen, [{ ...les, capaciteit: 0, aan: false }])).toBeNull()
  })
})

describe('lessenPlan', () => {
  it('maakt van het voorstel alleen nieuwe lestypen en lessen', () => {
    const typen = beginTypen([], voorstelLestypen('pt'), ALLE_LESTYPEN)
    const lessen = beginLessen(typen, [], ALLE_LESSEN, null)
    const plan = lessenPlan(typen, lessen, typen, lessen)
    expect(plan.typenNieuw.map((t) => t.naam)).toHaveLength(5)
    expect(plan.lessenNieuw.length).toBe(pakketVoor('pt').lessen.length)
    expect(plan.typenUit).toEqual([])
    expect(plan.lessenUit).toEqual([])
  })

  it('zet een les uit, past een lestype aan en zet de lessen van een uitgezet lestype uit', () => {
    const basisTypen = beginTypen([KRACHT], [], [])
    const basisLessen = beginLessen(basisTypen, [SERIE], [], null)
    const nieuwNaam = lessenPlan([{ ...basisTypen[0], naam: 'Kracht' }], [{ ...basisLessen[0], capaciteit: 12 }], basisTypen, basisLessen)
    expect(nieuwNaam.typenWijzig).toEqual([{ id: 't1', velden: { naam: 'Kracht' } }])
    expect(nieuwNaam.lessenWijzig).toEqual([{ id: 's1', velden: { capaciteit: 12 } }])
    const uit = lessenPlan([{ ...basisTypen[0], aan: false }], basisLessen, basisTypen, basisLessen)
    expect(uit.typenUit).toEqual(['t1'])
    expect(uit.lessenUit).toEqual(['s1'])
    expect(aantalWijzigingen(lessenPlan(basisTypen, basisLessen, basisTypen, basisLessen))).toBe(0)
  })

  it('maakt bodies die de API accepteert', () => {
    const typen = beginTypen([], voorstelLestypen('pt'), ALLE_LESTYPEN)
    for (const t of typen) expect(leesNieuw(typeVelden(t), LESTYPE_SCHEMA, { actief: true }).ok, t.naam).toBe(true)
    for (const l of beginLessen(typen, [], ALLE_LESSEN, null)) {
      const body = { ...lesVelden(l), lestypeId: '00000000-0000-4000-8000-000000000001', vanaf: '2026-10-23' }
      expect(leesNieuw(body, SERIE_SCHEMA, { actief: true, tot: null }).ok, l.sleutel).toBe(true)
      expect(leesVolgensSchema(lesVelden(l), SERIE_SCHEMA, true).ok).toBe(true)
    }
  })
})

describe('nieuw', () => {
  it('geeft een eigen lestype en een lege les voor het eerste gekozen lestype', () => {
    expect(leegType(1)).toMatchObject({ sleutel: 'nieuw:1', aan: true, naam: '' })
    const typen = beginTypen([KRACHT], [], [])
    expect(legeLes(typen, 2, 'z1')).toMatchObject({ sleutel: 'nieuw:2', typeSleutel: 'id:t1', duurMin: 55, zaalId: 'z1' })
    expect(legeLes([], 3, null)).toBeNull()
  })
})

describe('uitgezette lestypen', () => {
  const UIT: BestaandType = { id: 't9', naam: 'Spinning', omschrijving: null, soort: 'spinning', duurMin: 45, intensiteit: 3, actief: false }

  it('staan in de keuze zonder vinkje en komen niet dubbel als voorbeeld', () => {
    const typen = beginTypen([UIT], voorstelLestypen('gym'), ALLE_LESTYPEN)
    expect(typen.filter((t) => t.naam === 'Spinning')).toEqual([expect.objectContaining({ id: 't9', aan: false })])
    expect(typen.filter((t) => t.aan).length).toBe(voorstelLestypen('gym').length - 1)
  })

  it('gaan weer aan met actief: true en worden niet steeds opnieuw uitgezet', () => {
    const basis = beginTypen([UIT], [], [])
    expect(lessenPlan(basis, [], basis, []).typenUit).toEqual([])
    const plan = lessenPlan([{ ...basis[0], aan: true }], [], basis, [])
    expect(plan.typenWijzig).toEqual([{ id: 't9', velden: { actief: true } }])
  })
})
