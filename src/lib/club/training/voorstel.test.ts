import { describe, expect, it } from 'vitest'
import type { Gezondheid } from './intake'
import type { Oefening } from './rijen'
import { stelSchemaVoor, type Voorstel, type VoorstelIntake } from './voorstel'
import { BIB, PER_ID } from './voorstel-test-bib'
import { volgordeRang } from './voorstel-regels'

const basis: VoorstelIntake = {
  doelen: ['spiermassa'],
  niveau: 2,
  dagenPerWeek: 3,
  minutenPerSessie: 60,
  voorkeuren: ['sportschool'],
  gezondheid: null,
}

function gezond(deel: Partial<Gezondheid>): Gezondheid {
  return { blessures: [], blessureToelichting: null, klachten: null, medicatie: null, parqJa: [], ...deel }
}

const oefeningenVan = (v: Voorstel): Oefening[] => v.dagen.flatMap((d) => d.regels.map((r) => PER_ID.get(r.oefeningId)!))
const dagOef = (v: Voorstel, i: number): Oefening[] => v.dagen[i].regels.map((r) => PER_ID.get(r.oefeningId)!)
const DUWEN = ['duwen_horizontaal', 'duwen_verticaal']
const TREKKEN = ['trekken_horizontaal', 'trekken_verticaal']
const STREEPJES = /[–—]| - /
const ACCENTEN = /[éèëêáàäóòöúùüíìï]/

describe('stelSchemaVoor: split per aantal dagen', () => {
  it.each([
    [1, ['Full body A']],
    [2, ['Full body A', 'Full body B']],
    [3, ['Full body A', 'Full body B', 'Full body C']],
    [4, ['Bovenlichaam', 'Onderlichaam', 'Bovenlichaam 2', 'Onderlichaam 2']],
    [5, ['Duwen', 'Trekken', 'Benen', 'Bovenlichaam', 'Onderlichaam']],
  ])('%i dagen geeft %j', (dagen, titels) => {
    const v = stelSchemaVoor({ ...basis, dagenPerWeek: dagen }, BIB)
    expect(v.dagen.map((d) => d.titel)).toEqual(titels)
    expect(v.dagen.every((d) => d.regels.length >= 3)).toBe(true)
  })

  it('houdt een beginner die 5 dagen wil op drie full body trainingen', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 1, dagenPerWeek: 5 }, BIB)
    expect(v.dagen).toHaveLength(3)
    expect(v.waarom[0]).toContain('beginner')
  })

  it('zet bij vier dagen alleen beenoefeningen en romp op de onderdag', () => {
    const v = stelSchemaVoor({ ...basis, dagenPerWeek: 4 }, BIB)
    expect(dagOef(v, 1).every((o) => ['benen', 'billen', 'kuiten', 'buik', 'onderrug'].includes(o.spiergroep))).toBe(true)
    expect(dagOef(v, 0).every((o) => !['benen', 'billen', 'kuiten'].includes(o.spiergroep))).toBe(true)
  })
})

describe('stelSchemaVoor: balans en volgorde', () => {
  it('geeft elke full body dag een been-, duw- en trekoefening', () => {
    const v = stelSchemaVoor(basis, BIB)
    for (let i = 0; i < 3; i++) {
      const p = dagOef(v, i).map((o) => o.patroon)
      expect(p.some((x) => x === 'squat' || x === 'lunge' || x === 'heupscharnier')).toBe(true)
      expect(p.some((x) => DUWEN.includes(x ?? ''))).toBe(true)
      expect(p.some((x) => TREKKEN.includes(x ?? ''))).toBe(true)
    }
  })

  it.each([2, 3, 4, 5])('traint bij %i dagen minstens zoveel trekken als duwen', (dagen) => {
    const alle = oefeningenVan(stelSchemaVoor({ ...basis, dagenPerWeek: dagen, minutenPerSessie: 75 }, BIB))
    const duwen = alle.filter((o) => DUWEN.includes(o.patroon ?? '')).length
    const trekken = alle.filter((o) => TREKKEN.includes(o.patroon ?? '')).length
    expect(trekken).toBeGreaterThanOrEqual(duwen)
  })

  it('zet elke dag van groot naar klein: samengesteld, isolatie, romp, cardio', () => {
    for (const doelen of [['spiermassa'], ['afvallen'], ['sport']] as const) {
      const v = stelSchemaVoor({ ...basis, doelen: [...doelen], minutenPerSessie: 90 }, BIB)
      for (let i = 0; i < v.dagen.length; i++) {
        const rangen = dagOef(v, i).map((o) => volgordeRang(o.patroon))
        expect(rangen).toEqual([...rangen].sort((a, b) => a - b))
      }
    }
  })

  it('kiest geen oefening twee keer op een dag en wisselt tussen de dagen', () => {
    const v = stelSchemaVoor(basis, BIB)
    for (const dag of v.dagen) expect(new Set(dag.regels.map((r) => r.oefeningId)).size).toBe(dag.regels.length)
    expect(new Set(v.dagen[0].regels.map((r) => r.oefeningId))).not.toEqual(new Set(v.dagen[1].regels.map((r) => r.oefeningId)))
  })

  it('geeft een benendag quadriceps, hamstrings en bilspieren, ook in korte tijd', () => {
    for (const minuten of [30, 60]) {
      const v = stelSchemaVoor({ ...basis, dagenPerWeek: 4, minutenPerSessie: minuten }, BIB)
      const spieren = new Set(dagOef(v, 1).flatMap((o) => o.spierenPrimair))
      expect(spieren.has('quadriceps') && spieren.has('hamstrings') && spieren.has('bilspieren')).toBe(true)
    }
  })
})

describe('stelSchemaVoor: dosering per doel', () => {
  const eerste = (v: Voorstel) => v.dagen[0].regels[0]

  it('kracht: 4 sets van 4 tot 6, lange rust, 2 in reserve', () => {
    const v = stelSchemaVoor({ ...basis, doelen: ['kracht'], niveau: 3 }, BIB)
    expect(eerste(v)).toMatchObject({ sets: 4, herhalingen: '4-6', rustSec: 150, rir: 2 })
  })

  it('spiermassa: 3 sets van 8 tot 12, 1 in reserve', () => {
    expect(eerste(stelSchemaVoor(basis, BIB))).toMatchObject({ sets: 3, herhalingen: '8-12', rustSec: 90, rir: 1 })
  })

  it('afvallen: korte rust en elke dag cardio als afsluiter', () => {
    const v = stelSchemaVoor({ ...basis, doelen: ['afvallen'] }, BIB)
    expect(eerste(v).rustSec).toBe(60)
    for (const dag of v.dagen) {
      const laatste = dag.regels[dag.regels.length - 1]
      expect(PER_ID.get(laatste.oefeningId)?.patroon).toBe('cardio')
      expect(laatste.herhalingen).toBe('20-30 min')
    }
  })

  it('conditie met weinig tijd: kortere cardio', () => {
    const v = stelSchemaVoor({ ...basis, doelen: ['conditie'], minutenPerSessie: 40 }, BIB)
    const laatste = v.dagen[0].regels[v.dagen[0].regels.length - 1]
    expect(laatste.herhalingen).toBe('10-15 min')
  })

  it('fit en gezond: 10 tot 12 herhalingen, ruim in reserve, geen cardio', () => {
    const v = stelSchemaVoor({ ...basis, doelen: ['gezondheid'] }, BIB)
    expect(eerste(v)).toMatchObject({ herhalingen: '10-12', rir: 3 })
    expect(oefeningenVan(v).some((o) => o.patroon === 'cardio')).toBe(false)
  })

  it('sport: een explosieve oefening vooraan, niet voor beginners', () => {
    const v = stelSchemaVoor({ ...basis, doelen: ['sport'] }, BIB)
    for (let i = 0; i < v.dagen.length; i++) expect(dagOef(v, i)[0].patroon).toBe('explosief')
    expect(eerste(v)).toMatchObject({ sets: 3, herhalingen: '3-5', rir: null })
    const beginner = stelSchemaVoor({ ...basis, doelen: ['sport'], niveau: 1 }, BIB)
    expect(oefeningenVan(beginner).some((o) => o.patroon === 'explosief')).toBe(false)
  })

  it('revalidatie gaat voor en zet alles op niveau 1 met lichte dosering', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 3, doelen: ['revalidatie', 'kracht'] }, BIB)
    expect(v.niveau).toBe(1)
    expect(v.doel).toBe('revalidatie')
    expect(eerste(v)).toMatchObject({ sets: 2, rir: 3 })
  })

  it('romp in tijd, zonder RIR', () => {
    const core = stelSchemaVoor({ ...basis, minutenPerSessie: 90 }, BIB).dagen[0].regels.find((r) => PER_ID.get(r.oefeningId)?.patroon === 'core')
    expect(core).toMatchObject({ herhalingen: '30-45 sec', rir: null })
  })
})

describe('stelSchemaVoor: ervaring en materiaal', () => {
  it('kiest voor een beginner alleen niveau 1 en eerst machines en kabels', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 1 }, BIB)
    const gekozen = oefeningenVan(v)
    expect(gekozen.every((o) => o.niveau === 1)).toBe(true)
    expect(dagOef(v, 0)[0].naam).toBe('Leg press')
    expect(gekozen.some((o) => o.materiaal === 'barbell')).toBe(false)
    expect(eerste3(v).every((r) => r.rir === 3)).toBe(true)
  })

  it('kiest voor een gevorderde vrije gewichten als basis', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 3, doelen: ['kracht'] }, BIB)
    expect(dagOef(v, 0)[0].naam).toBe('Back squat')
  })

  it('gebruikt thuis alleen thuismateriaal', () => {
    const v = stelSchemaVoor({ ...basis, voorkeuren: ['thuis'] }, BIB)
    expect(oefeningenVan(v).every((o) => ['geen', 'band', 'dumbbell', 'kettlebell'].includes(o.materiaal))).toBe(true)
    expect(v.waarom.join(' ')).toContain('thuis')
  })
})

function eerste3(v: Voorstel) {
  return v.dagen[0].regels.slice(0, 3)
}

describe('stelSchemaVoor: tijd', () => {
  it('past meer oefeningen in meer tijd en altijd tussen 3 en 8', () => {
    const aantal = (min: number) => stelSchemaVoor({ ...basis, minutenPerSessie: min }, BIB).dagen[0].regels.length
    expect(aantal(30)).toBeGreaterThanOrEqual(3)
    expect(aantal(45)).toBeLessThanOrEqual(aantal(75))
    expect(aantal(180)).toBeLessThanOrEqual(8)
  })

  it('past bij kracht minder oefeningen in een uur dan bij conditie (langere rust)', () => {
    const kracht = stelSchemaVoor({ ...basis, niveau: 3, doelen: ['kracht'] }, BIB).dagen[0].regels.length
    const conditie = stelSchemaVoor({ ...basis, doelen: ['gezondheid'] }, BIB).dagen[0].regels.length
    expect(kracht).toBeLessThan(conditie)
  })

  it('haalt een set eraf als drie oefeningen niet in de tijd passen', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 3, doelen: ['kracht'], minutenPerSessie: 30 }, BIB)
    expect(v.dagen[0].regels[0].sets).toBe(3)
    expect(v.waarom.join(' ')).toContain('set minder')
  })
})

describe('stelSchemaVoor: blessures en klachten', () => {
  it('knie: geen oefening die de knie belast, de benen via heupscharnier en leg curl', () => {
    const v = stelSchemaVoor({ ...basis, dagenPerWeek: 4, gezondheid: gezond({ blessures: ['knie'] }) }, BIB)
    const gekozen = oefeningenVan(v)
    expect(gekozen.some((o) => o.belast.includes('knie'))).toBe(false)
    expect(dagOef(v, 1).some((o) => o.patroon === 'heupscharnier')).toBe(true)
    expect(v.waarschuwingen.join(' ')).toMatch(/knie spaart voor: squat, lunge/)
    expect(v.waarom.join(' ')).toContain('Overleg met je trainer')
  })

  it('schouder: duwen met elastiek in plaats van de machine, met notitie voor de trainer', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 1, gezondheid: gezond({ blessures: ['schouder'] }) }, BIB)
    const gekozen = oefeningenVan(v)
    expect(gekozen.some((o) => o.belast.includes('schouder'))).toBe(false)
    const duw = v.dagen[0].regels.find((r) => PER_ID.get(r.oefeningId)?.naam === 'Band chest press')
    expect(duw?.notitie).toMatch(/^In plaats van (Push-up|Chest press machine) \(belast je schouder\)\. Overleg met je trainer/)
  })

  it('rug: geen deadlift of back squat, ook niet voor een gevorderde', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 3, gezondheid: gezond({ blessures: ['rug'] }) }, BIB)
    expect(oefeningenVan(v).some((o) => o.belast.includes('rug'))).toBe(false)
  })

  it('met een klacht geen zware lasten en ruim in reserve, ook bij kracht', () => {
    const v = stelSchemaVoor({ ...basis, doelen: ['kracht'], niveau: 3, gezondheid: gezond({ blessures: ['pols'] }) }, BIB)
    expect(v.dagen[0].regels[0]).toMatchObject({ herhalingen: '8-12', rir: 3 })
  })

  it('waarschuwt bij een ja op de gezondheidsvragen en bij genoemde klachten', () => {
    const v = stelSchemaVoor({ ...basis, gezondheid: gezond({ parqJa: ['hart', 'duizelig'], klachten: 'Soms last van mijn heup' }) }, BIB)
    expect(v.waarschuwingen[0]).toContain('huisarts')
    expect(v.notitie).toContain('Let op: Bij de gezondheidsvragen is 2 keer ja')
    expect(v.waarom[v.waarom.length - 1]).toContain('klachten')
  })
})

describe('stelSchemaVoor: uitleg en randgevallen', () => {
  it('geeft 3 tot 5 korte zinnen zonder streepjes of accenten, ook in de notitie', () => {
    const intakes: VoorstelIntake[] = [
      basis,
      { ...basis, doelen: ['kracht'], niveau: 3, dagenPerWeek: 4, minutenPerSessie: 90 },
      { ...basis, doelen: ['afvallen'], niveau: 1, dagenPerWeek: 2, minutenPerSessie: 45, voorkeuren: ['thuis'] },
      { ...basis, doelen: ['sport'], dagenPerWeek: 5, gezondheid: gezond({ blessures: ['knie', 'schouder'], parqJa: ['gewricht'] }) },
    ]
    for (const intake of intakes) {
      const v = stelSchemaVoor(intake, BIB)
      expect(v.waarom.length).toBeGreaterThanOrEqual(3)
      expect(v.waarom.length).toBeLessThanOrEqual(5)
      const tekst = [v.notitie, ...v.waarom, ...v.dagen.flatMap((d) => d.regels.map((r) => r.notitie ?? ''))].join('\n')
      expect(tekst).not.toMatch(STREEPJES)
      expect(tekst).not.toMatch(ACCENTEN)
      expect(v.notitie.length).toBeLessThanOrEqual(1000)
      expect(v.notitie.startsWith('Waarom dit schema\n')).toBe(true)
    }
  })

  it('gebruikt alleen oefeningen met coaching als dat gevraagd wordt', () => {
    const metCoaching = new Set(['Goblet squat', 'Dumbbell press', 'Dumbbell row', 'Roemeense deadlift', 'Plank', 'Lat pulldown'])
    const v = stelSchemaVoor(basis, BIB, { heeftCoaching: (o) => metCoaching.has(o.naam) })
    expect(oefeningenVan(v).every((o) => metCoaching.has(o.naam))).toBe(true)
    expect(oefeningenVan(v).length).toBeGreaterThan(0)
  })

  it('geeft lege dagen zonder oefeningen en negeert inactieve oefeningen', () => {
    expect(stelSchemaVoor(basis, []).dagen.every((d) => d.regels.length === 0)).toBe(true)
    const inactief = BIB.map((o) => ({ ...o, actief: false }))
    expect(stelSchemaVoor(basis, inactief).dagen.every((d) => d.regels.length === 0)).toBe(true)
  })

  it('is deterministisch, ook met een andere volgorde van de bibliotheek', () => {
    expect(stelSchemaVoor(basis, BIB)).toEqual(stelSchemaVoor(basis, [...BIB].reverse()))
  })

  it('werkt ook met oefeningen zonder spieren (terugval op de grove spiergroep)', () => {
    const zonder = BIB.map((o) => ({ ...o, spierenPrimair: [] }))
    const v = stelSchemaVoor({ ...basis, dagenPerWeek: 4 }, zonder)
    expect(v.dagen.every((d) => d.regels.length > 0)).toBe(true)
  })

  it('kiest na een squat een heupscharnier dat de hamstrings toevoegt', () => {
    const scharnier = dagOef(stelSchemaVoor(basis, BIB), 0).find((o) => o.patroon === 'heupscharnier')
    expect(scharnier?.spierenPrimair).toContain('hamstrings')
  })
})
