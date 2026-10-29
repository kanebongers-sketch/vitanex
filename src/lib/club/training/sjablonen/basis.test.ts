import { describe, expect, it } from 'vitest'
import { coachingVoor } from '../coaching'
import { BLENDER_OEFENINGEN } from '../blender-bibliotheek'
import { leesSchema } from '../invoer'
import { BASIS_SJABLONEN, basisRegels, basisSjabloon, naamSleutel, oefeningNamen } from './basis'

// Sinds 28-10-2026 (besluit Kane) zijn alleen de oefeningen met een eigen
// Blender-render kiesbaar (blender-bibliotheek.ts). Een basissjabloon mag
// alleen die namen gebruiken.
const BIBLIOTHEEK = BLENDER_OEFENINGEN.map((o) => o.naam)

const OPNAAM = new Map(BIBLIOTHEEK.map((n, i) => [naamSleutel(n), `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`]))

describe('basisset startschema', () => {
  it("heeft de zes afgesproken schema's", () => {
    expect(BASIS_SJABLONEN.map((s) => s.sleutel)).toEqual([
      'full-body-2x',
      'boven-onder-4x',
      'duwen-trekken-benen',
      'lichaamsgewicht-start',
      'circuit-lichaamsgewicht',
      'mobiliteit-core',
    ])
    expect(basisSjabloon('onbekend')).toBeNull()
  })

  for (const s of BASIS_SJABLONEN) {
    it(`${s.naam}: alleen oefeningen met een Blender-render en coaching`, () => {
      for (const naam of oefeningNamen(s)) {
        expect(OPNAAM.has(naamSleutel(naam)), naam).toBe(true)
        expect(coachingVoor(naam), `coaching voor ${naam}`).not.toBeNull()
      }
    })

    it(`${s.naam}: komt door dezelfde validatie als de editor`, () => {
      const { regels, ontbreekt } = basisRegels(s, OPNAAM)
      expect(ontbreekt).toEqual([])
      const u = leesSchema({ naam: s.naam, niveau: s.niveau, status: 'concept', dagTitels: s.dagen.map((d) => d.titel), regels })
      if (!u.ok) throw new Error(u.fout)
      expect(u.waarde.regels).toHaveLength(s.dagen.reduce((n, d) => n + d.regels.length, 0))
    })

    it(`${s.naam}: geen gedachtestreepjes of klemtoon-accenten in de teksten`, () => {
      const teksten = [s.naam, s.uitleg, s.perWeek, ...s.dagen.flatMap((d) => [d.titel, ...d.regels.map((x) => x.notitie ?? '')])].join(' ')
      expect(teksten).not.toMatch(/[–—]| - |[éèëáíóú]/)
    })
  }

  it('supersets krijgen per dag een eigen nummer', () => {
    const { regels } = basisRegels(basisSjabloon('boven-onder-4x')!, OPNAAM)
    const groepen = [...new Set(regels.map((r) => r.groep).filter((g) => g !== null))]
    expect(groepen).toEqual([1, 2, 3, 4])
  })

  it('het circuit is een ronde: alles in een groep, rust pas na de laatste oefening', () => {
    const s = basisSjabloon('circuit-lichaamsgewicht')!
    const regels = s.dagen[0].regels
    expect(new Set(regels.map((x) => x.groep))).toEqual(new Set([1]))
    expect(regels.slice(0, -1).every((x) => x.rustSec === 0)).toBe(true)
    expect(regels.at(-1)!.rustSec).toBeGreaterThan(0)
  })

  it('het startschema met lichaamsgewicht gebruikt geen materiaal en heeft twee dagen', () => {
    const s = basisSjabloon('lichaamsgewicht-start')!
    expect(s.dagen).toHaveLength(2)
    for (const naam of oefeningNamen(s)) expect(naam, naam).not.toMatch(/barbell|dumbbell|kettlebell|machine/i)
  })

  it('op een dag staat een oefening nooit twee keer', () => {
    for (const s of BASIS_SJABLONEN) {
      for (const d of s.dagen) {
        const namen = d.regels.map((x) => x.oefening)
        expect(new Set(namen).size, `${s.naam}, ${d.titel}`).toBe(namen.length)
      }
    }
  })

  it('maakt niets als een oefening ontbreekt', () => {
    const zonder = new Map([...OPNAAM].filter(([k]) => k !== naamSleutel('Plank')))
    expect(basisRegels(basisSjabloon('full-body-2x')!, zonder)).toEqual({ regels: [], ontbreekt: ['Plank'] })
  })
})
