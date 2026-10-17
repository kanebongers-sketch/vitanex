import { describe, expect, it } from 'vitest'
import { GEEN_TOESTEMMING, eigenUitOpslag, leesEigenAntwoorden, toonWaarde } from './eigen'
import type { IntakeVraag } from './soorten'

function vraag(deel: Partial<IntakeVraag>): IntakeVraag {
  return { id: 'v1', sleutel: null, vraag: 'Vraag', uitleg: null, soort: 'kort', opties: [], verplicht: false, gezondheid: false, sectie: 'Leefstijl', volgorde: 10, actief: true, ...deel }
}

const GEVONDEN = vraag({ id: 'gevonden', vraag: 'Hoe heb je ons gevonden?', soort: 'keuze', opties: ['Google', 'Instagram'], verplicht: true, sectie: 'Kennismaking' })
const SLAAP = vraag({ id: 'slaap', vraag: 'Hoe slaap je?', soort: 'schaal_1_10' })
const OPERATIE = vraag({ id: 'operatie', vraag: 'Geopereerd?', soort: 'ja_nee', gezondheid: true, verplicht: true })

describe('leesEigenAntwoorden', () => {
  it('bewaart geldige antwoorden met een kopie van de vraag', () => {
    // Arrange
    const ruw = { gevonden: 'Google', slaap: '7' }
    // Act
    const u = leesEigenAntwoorden(ruw, [GEVONDEN, SLAAP], false)
    // Assert
    expect(u).toEqual({
      ok: true,
      waarde: [
        { vraagId: 'gevonden', vraag: 'Hoe heb je ons gevonden?', sectie: 'Kennismaking', soort: 'keuze', gezondheid: false, waarde: 'Google' },
        { vraagId: 'slaap', vraag: 'Hoe slaap je?', sectie: 'Leefstijl', soort: 'schaal_1_10', gezondheid: false, waarde: 7 },
      ],
    })
  })

  it('weigert een lege verplichte vraag', () => {
    const u = leesEigenAntwoorden({ gevonden: '' }, [GEVONDEN], false)
    expect(u).toEqual({ ok: false, fout: 'Vul "Hoe heb je ons gevonden?" in.' })
  })

  it('weigert een antwoord dat niet bij de soort past', () => {
    expect(leesEigenAntwoorden({ gevonden: 'Krant' }, [GEVONDEN], false).ok).toBe(false)
    expect(leesEigenAntwoorden({ slaap: 11 }, [SLAAP], false).ok).toBe(false)
    expect(leesEigenAntwoorden({ slaap: 6.5 }, [SLAAP], false).ok).toBe(false)
    expect(leesEigenAntwoorden({ v1: true }, [vraag({})], false).ok).toBe(false)
    expect(leesEigenAntwoorden({ v1: 'ja' }, [vraag({ soort: 'ja_nee' })], false).ok).toBe(false)
    expect(leesEigenAntwoorden({ v1: 'veel' }, [vraag({ soort: 'getal' })], false).ok).toBe(false)
  })

  it('leest getallen met een komma en meerkeuze in de volgorde van de opties', () => {
    const getal = vraag({ id: 'g', soort: 'getal' })
    const meer = vraag({ id: 'm', soort: 'meerkeuze', opties: ['a', 'b', 'c'] })
    const u = leesEigenAntwoorden({ g: '12,5', m: ['c', 'a'] }, [getal, meer], false)
    if (!u.ok) throw new Error(u.fout)
    expect(u.waarde.map((a) => a.waarde)).toEqual([12.5, ['a', 'c']])
  })

  it('weigert een gezondheidsantwoord zonder toestemming', () => {
    const u = leesEigenAntwoorden({ operatie: true }, [OPERATIE], false)
    expect(u).toEqual({ ok: false, fout: GEEN_TOESTEMMING })
  })

  it('eist een verplichte gezondheidsvraag alleen met toestemming', () => {
    expect(leesEigenAntwoorden({}, [OPERATIE], false)).toEqual({ ok: true, waarde: [] })
    expect(leesEigenAntwoorden({}, [OPERATIE], true).ok).toBe(false)
    const u = leesEigenAntwoorden({ operatie: false }, [OPERATIE], true)
    expect(u.ok && u.waarde[0].waarde).toBe(false)
  })

  it('negeert uitgezette vragen, kernvragen en onbekende sleutels', () => {
    const uit = vraag({ id: 'uit', actief: false, verplicht: true })
    const kern = vraag({ id: 'kern', sleutel: 'motivatie', verplicht: true })
    const u = leesEigenAntwoorden({ uit: 'x', kern: 'y', vreemd: 'z' }, [uit, kern], false)
    expect(u).toEqual({ ok: true, waarde: [] })
  })

  it('weigert iets anders dan een object', () => {
    expect(leesEigenAntwoorden(['x'], [], false).ok).toBe(false)
    expect(leesEigenAntwoorden(undefined, [], false)).toEqual({ ok: true, waarde: [] })
  })
})

describe('eigenUitOpslag', () => {
  const opgeslagen = [
    { vraagId: 'a', vraag: 'Werk', sectie: 'Leefstijl', soort: 'kort', gezondheid: false, waarde: 'Kantoor' },
    { vraagId: 'b', vraag: 'Geopereerd?', sectie: 'Gezondheid', soort: 'ja_nee', gezondheid: true, waarde: true },
    { vraagId: 'c', soort: 'kort', waarde: 'kapot' },
    'onzin',
  ]

  it('leest mild en toont zonder toestemming geen gezondheid', () => {
    expect(eigenUitOpslag(opgeslagen, false).map((a) => a.vraagId)).toEqual(['a'])
    expect(eigenUitOpslag(opgeslagen, true).map((a) => a.vraagId)).toEqual(['a', 'b'])
    expect(eigenUitOpslag(null, true)).toEqual([])
  })
})

describe('toonWaarde', () => {
  it('maakt een antwoord leesbaar', () => {
    expect(toonWaarde('ja_nee', true)).toBe('Ja')
    expect(toonWaarde('schaal_1_10', 8)).toBe('8 van 10')
    expect(toonWaarde('meerkeuze', ['a', 'b'])).toBe('a, b')
    expect(toonWaarde('getal', 12.5)).toBe('12,5')
  })
})
