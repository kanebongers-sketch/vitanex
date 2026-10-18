import { describe, expect, it } from 'vitest'
import { coachingVoor } from '../coaching'
import { leesSchema } from '../invoer'
import { BASIS_SJABLONEN, basisRegels, basisSjabloon, naamSleutel, oefeningNamen } from './basis'

// De standaardbibliotheek (club_oefeningen, gelijk voor elke sportschool bij de
// start). Een basissjabloon mag alleen deze namen gebruiken.
const BIBLIOTHEEK = [
  'Goblet squat', 'Chest press machine', 'Lat pulldown', 'Roemeense deadlift met dumbbells', 'Shoulder press machine', 'Plank', 'Leg press',
  'Dumbbell bankdrukken', 'Seated cable row', 'Glute bridge', 'Dumbbell curl', 'Triceps pushdown', 'Dead bug', 'Bankdrukken met barbell',
  'Barbell row', 'Dumbbell shoulder press', 'Hammer curl', 'Back squat', 'Roemeense deadlift met barbell', 'Lunge met dumbbells',
  'Leg curl liggend', 'Calf raise staand', 'Hanging knee raise', 'Schuin bankdrukken met dumbbells', 'Lat pulldown met onderhandse greep',
  'Lateral raise', 'Face pull', 'Skull crusher', 'Hip thrust met barbell', 'Hack squat', 'Bulgarian split squat', 'Leg extension',
  'Leg curl zittend', 'Calf raise zittend', 'Cable crunch', 'Overhead press', 'Deadlift', 'Pull-up', 'Barbell curl', 'Ab wheel rollout',
  'Crosstrainer', 'Seated row machine', 'Pallof press', 'Squat met lichaamsgewicht', 'Achterwaartse lunge', 'Band pull-apart', 'Bird dog',
  'Zijplank', 'Superman',
]

const OPNAAM = new Map(BIBLIOTHEEK.map((n, i) => [naamSleutel(n), `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`]))

describe('basisset startschema', () => {
  it("heeft de vijf afgesproken schema's", () => {
    expect(BASIS_SJABLONEN.map((s) => s.sleutel)).toEqual(['full-body-2x', 'boven-onder-4x', 'duwen-trekken-benen', 'machine-circuit', 'mobiliteit-core'])
    expect(basisSjabloon('onbekend')).toBeNull()
  })

  for (const s of BASIS_SJABLONEN) {
    it(`${s.naam}: alleen oefeningen uit de bibliotheek met coaching`, () => {
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
    expect(groepen).toEqual([1, 2, 3, 4, 5])
  })

  it('maakt niets als een oefening ontbreekt', () => {
    const zonder = new Map([...OPNAAM].filter(([k]) => k !== naamSleutel('Plank')))
    expect(basisRegels(basisSjabloon('full-body-2x')!, zonder)).toEqual({ regels: [], ontbreekt: ['Plank'] })
  })
})
