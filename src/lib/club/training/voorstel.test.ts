import { describe, expect, it } from 'vitest'
import { stelSchemaVoor, type VoorstelIntake } from './voorstel'
import { aantalOefeningen, dosering, hoofddoel, kiesSplit } from './voorstel-regels'
import type { Oefening } from './rijen'
import type { Materiaal, Niveau, Patroon, Spiergroep, Zone } from './typen'

let teller = 0
function oef(naam: string, patroon: Patroon, spiergroep: Spiergroep, materiaal: Materiaal, niveau: Niveau = 1, belast: Zone[] = []): Oefening {
  teller += 1
  const id = `00000000-0000-4000-8000-${String(teller).padStart(12, '0')}`
  return { id, naam, spiergroep, materiaal, niveau, patroon, belast, uitleg: null, aandachtspunten: null, actief: true, beeld: null }
}

const BIB: Oefening[] = [
  oef('Leg press', 'squat', 'benen', 'machine', 1, ['knie']),
  oef('Goblet squat', 'squat', 'benen', 'dumbbell', 1, ['knie']),
  oef('Back squat', 'squat', 'benen', 'barbell', 3, ['knie', 'rug']),
  oef('Box squat lichaamsgewicht', 'squat', 'benen', 'geen', 1, ['knie']),
  oef('Hip thrust', 'heupscharnier', 'billen', 'barbell', 2, []),
  oef('Glute bridge', 'heupscharnier', 'billen', 'geen', 1, []),
  oef('Roemeense deadlift', 'heupscharnier', 'benen', 'dumbbell', 2, ['rug']),
  oef('Deadlift', 'heupscharnier', 'onderrug', 'barbell', 3, ['rug']),
  oef('Lunge', 'lunge', 'benen', 'dumbbell', 2, ['knie']),
  oef('Step-up', 'lunge', 'benen', 'bank', 1, ['knie']),
  oef('Chest press machine', 'duwen_horizontaal', 'borst', 'machine', 1, ['schouder']),
  oef('Push-up', 'duwen_horizontaal', 'borst', 'geen', 1, ['schouder', 'pols']),
  oef('Bankdrukken', 'duwen_horizontaal', 'borst', 'barbell', 2, ['schouder']),
  oef('Dumbbell press', 'duwen_horizontaal', 'borst', 'dumbbell', 2, ['schouder']),
  oef('Shoulder press machine', 'duwen_verticaal', 'schouders', 'machine', 1, ['schouder']),
  oef('Dumbbell shoulder press', 'duwen_verticaal', 'schouders', 'dumbbell', 2, ['schouder']),
  oef('Lat pulldown', 'trekken_verticaal', 'rug', 'kabel', 1, ['schouder']),
  oef('Pull-up', 'trekken_verticaal', 'rug', 'geen', 3, ['schouder']),
  oef('Seated row', 'trekken_horizontaal', 'rug', 'kabel', 1, []),
  oef('Dumbbell row', 'trekken_horizontaal', 'rug', 'dumbbell', 1, []),
  oef('Band row', 'trekken_horizontaal', 'rug', 'band', 1, []),
  oef('Biceps curl', 'isolatie', 'biceps', 'dumbbell', 1, []),
  oef('Triceps pushdown', 'isolatie', 'triceps', 'kabel', 1, ['elleboog']),
  oef('Lateral raise', 'isolatie', 'schouders', 'dumbbell', 1, ['schouder']),
  oef('Leg extension', 'isolatie', 'benen', 'machine', 1, ['knie']),
  oef('Leg curl', 'isolatie', 'benen', 'machine', 1, []),
  oef('Calf raise', 'isolatie', 'kuiten', 'machine', 1, []),
  oef('Plank', 'core', 'buik', 'geen', 1, []),
  oef('Dead bug', 'core', 'buik', 'geen', 1, []),
  oef('Roeiergometer', 'cardio', 'cardio', 'cardio_apparaat', 1, []),
  oef('Crosstrainer', 'cardio', 'cardio', 'cardio_apparaat', 1, []),
]

const basis: VoorstelIntake = {
  doelen: ['spiermassa'],
  niveau: 2,
  dagenPerWeek: 3,
  minutenPerSessie: 60,
  voorkeuren: ['sportschool'],
  gezondheid: null,
}

const perId = new Map(BIB.map((o) => [o.id, o]))
const oefeningenVan = (v: ReturnType<typeof stelSchemaVoor>) => v.dagen.flatMap((d) => d.regels.map((r) => perId.get(r.oefeningId)!))

describe('kiesSplit', () => {
  it('kiest full body bij 1 tot 3 dagen', () => {
    expect(kiesSplit(1, 2).dagen).toHaveLength(1)
    expect(kiesSplit(2, 2).dagen.map((d) => d.titel)).toEqual(['Full body A', 'Full body B'])
    expect(kiesSplit(3, 2).naam).toBe('Full body')
  })
  it('kiest boven en onder bij 4 dagen', () => {
    const s = kiesSplit(4, 2)
    expect(s.naam).toBe('Boven en onder')
    expect(s.dagen).toHaveLength(4)
  })
  it('kiest vijf dagen bij 5 of meer, met een hint boven de 5', () => {
    expect(kiesSplit(5, 3).dagen).toHaveLength(5)
    expect(kiesSplit(6, 3).uitleg).toContain('herstel')
  })
  it('houdt een beginner op maximaal drie full body dagen', () => {
    const s = kiesSplit(5, 1)
    expect(s.dagen).toHaveLength(3)
    expect(s.uitleg).toContain('beginner')
  })
})

describe('dosering en hoofddoel', () => {
  it('geeft per doel andere herhalingen en rust', () => {
    expect(dosering('kracht', 'squat', 3)).toEqual({ sets: 4, herhalingen: '4-6', rustSec: 150 })
    expect(dosering('spiermassa', 'squat', 2).herhalingen).toBe('8-12')
    expect(dosering('conditie', 'squat', 2).rustSec).toBeLessThan(dosering('kracht', 'squat', 2).rustSec)
  })
  it('maakt het voor een beginner lichter', () => {
    expect(dosering('kracht', 'squat', 1)).toEqual({ sets: 3, herhalingen: '6-8', rustSec: 150 })
  })
  it('doseert core en cardio in tijd', () => {
    expect(dosering('afvallen', 'core', 2).herhalingen).toBe('30-45 sec')
    expect(dosering('afvallen', 'cardio', 2)).toEqual({ sets: 1, herhalingen: '20-30 min', rustSec: 0 })
  })
  it('zet revalidatie altijd voorop', () => {
    expect(hoofddoel(['afvallen', 'revalidatie', 'kracht'])).toBe('revalidatie')
    expect(hoofddoel(['conditie', 'spiermassa'])).toBe('spiermassa')
    expect(hoofddoel([])).toBe('gezondheid')
  })
  it('rekent het aantal oefeningen uit de tijd', () => {
    expect(aantalOefeningen(30)).toBe(3)
    expect(aantalOefeningen(60)).toBe(6)
    expect(aantalOefeningen(180)).toBe(8)
  })
})

describe('stelSchemaVoor', () => {
  it('maakt drie gevulde full body dagen zonder dubbele oefening per dag', () => {
    const v = stelSchemaVoor(basis, BIB)
    expect(v.dagen).toHaveLength(3)
    for (const dag of v.dagen) {
      expect(dag.regels.length).toBe(6)
      expect(new Set(dag.regels.map((r) => r.oefeningId)).size).toBe(dag.regels.length)
    }
    expect(v.doel).toBe('spiermassa')
    expect(v.notitie).not.toMatch(/[–—]/)
  })

  it('kiest geen oefeningen boven het niveau van het lid', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 1 }, BIB)
    expect(oefeningenVan(v).every((o) => o.niveau === 1)).toBe(true)
  })

  it('laat oefeningen weg die een geblesseerde knie of schouder belasten', () => {
    const v = stelSchemaVoor({ ...basis, gezondheid: { blessures: ['knie', 'schouder'], blessureToelichting: null, klachten: null, medicatie: null, parqJa: [] } }, BIB)
    const gekozen = oefeningenVan(v)
    expect(gekozen.length).toBeGreaterThan(0)
    expect(gekozen.some((o) => o.belast.includes('knie') || o.belast.includes('schouder'))).toBe(false)
    expect(v.waarschuwingen.join(' ')).toContain('knie')
  })

  it('vermijdt de rug bij rugklachten', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 3, gezondheid: { blessures: ['rug'], blessureToelichting: null, klachten: null, medicatie: null, parqJa: [] } }, BIB)
    expect(oefeningenVan(v).some((o) => o.belast.includes('rug'))).toBe(false)
  })

  it('gebruikt thuis alleen thuismateriaal', () => {
    const v = stelSchemaVoor({ ...basis, voorkeuren: ['thuis'] }, BIB)
    expect(oefeningenVan(v).every((o) => ['geen', 'band', 'dumbbell', 'kettlebell'].includes(o.materiaal))).toBe(true)
  })

  it('sluit bij afvallen af met cardio', () => {
    const v = stelSchemaVoor({ ...basis, doelen: ['afvallen'] }, BIB)
    for (const dag of v.dagen) {
      expect(perId.get(dag.regels[dag.regels.length - 1].oefeningId)?.patroon).toBe('cardio')
    }
  })

  it('zet revalidatie op niveau 1 met lichte dosering', () => {
    const v = stelSchemaVoor({ ...basis, niveau: 3, doelen: ['revalidatie', 'kracht'] }, BIB)
    expect(v.niveau).toBe(1)
    expect(v.doel).toBe('revalidatie')
    expect(v.dagen[0].regels[0].sets).toBe(2)
  })

  it('waarschuwt bij een ja op de gezondheidsvragen', () => {
    const v = stelSchemaVoor({ ...basis, gezondheid: { blessures: [], blessureToelichting: null, klachten: null, medicatie: null, parqJa: ['hart', 'duizelig'] } }, BIB)
    expect(v.waarschuwingen[0]).toContain('huisarts')
    expect(v.notitie).toContain('huisarts')
  })

  it('kiest bij vier dagen boven en onder', () => {
    const v = stelSchemaVoor({ ...basis, dagenPerWeek: 4 }, BIB)
    expect(v.dagen.map((d) => d.titel)).toEqual(['Bovenlichaam', 'Onderlichaam', 'Bovenlichaam 2', 'Onderlichaam 2'])
    const onder = v.dagen[1].regels.map((r) => perId.get(r.oefeningId)!)
    expect(onder.every((o) => ['benen', 'billen', 'kuiten', 'buik', 'onderrug'].includes(o.spiergroep))).toBe(true)
  })

  it('geeft lege dagen zonder oefeningen en negeert inactieve oefeningen', () => {
    expect(stelSchemaVoor(basis, []).dagen.every((d) => d.regels.length === 0)).toBe(true)
    const inactief = BIB.map((o) => ({ ...o, actief: false }))
    expect(stelSchemaVoor(basis, inactief).dagen.every((d) => d.regels.length === 0)).toBe(true)
  })

  it('is deterministisch', () => {
    expect(stelSchemaVoor(basis, BIB)).toEqual(stelSchemaVoor(basis, [...BIB].reverse()))
  })
})
