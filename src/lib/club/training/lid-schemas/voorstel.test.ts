import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BLENDER_OEFENINGEN, isBlenderOefening } from '../blender-bibliotheek'
import { BLENDER_BIB } from '../blender-test-bib'
import { kenmerkenVan } from '../oefening-kenmerken'
import { oefeningUitRij, type Oefening } from '../rijen'
import type { Niveau } from '../typen'
import { filterBibliotheek, filterKeuzes, LEEG_FILTER } from './bewerken'
import { LID_DOELEN, MATERIAAL_BIJ, type LidMateriaal } from './regels'
import type { LidOefening } from './typen'
import { kiesbaarVoorLid, lidVoorstel } from './voorstel'

// Probleem 30-10-2026: "thuis zonder materiaal" gaf maar 3 oefeningen (Push-up,
// Plank, Glute bridge), terwijl golf 1 ruim 20 Blender-oefeningen met
// lichaamsgewicht bracht. Oorzaken: de kolom gearchiveerd stond nog op true
// (migratie 475 zet hem terug), de cardiotijd ging van de training af terwijl
// er thuis geen cardio is, en slots zonder thuisvariant (trekken) bleven leeg.

/** Zoals de database ze levert: de golf 1-oefeningen nog met gearchiveerd = true. */
function alsDatabaseRij(o: Oefening): Oefening {
  const rij = {
    id: o.id, naam: o.naam, spiergroep: o.spiergroep, spieren_primair: o.spierenPrimair, spieren_secundair: [], materiaal: o.materiaal,
    niveau: o.niveau, patroon: o.patroon, belast: o.belast, actief: true, gearchiveerd: !['Push-up', 'Plank', 'Glute bridge'].includes(o.naam),
  }
  const uit = oefeningUitRij(rij)
  if (!uit) throw new Error(o.naam)
  return uit
}

const ALLE = BLENDER_BIB.map(alsDatabaseRij)
const ZONDER_MATERIAAL = ALLE.filter((o) => kenmerkenVan(o).materiaal === 'geen')
const NIVEAUS: readonly Niveau[] = [1, 2, 3]

function gekozen(materiaal: LidMateriaal, doel: (typeof LID_DOELEN)[number], dagen: number, niveau: Niveau): Oefening[] {
  const v = lidVoorstel({ doel, dagen, materiaal, niveau }, ALLE)
  if (!v) return []
  return v.regels.map((r) => ALLE.find((o) => o.id === r.oefeningId)).filter((o): o is Oefening => o !== undefined)
}

describe('thuis zonder materiaal (lid-voorstel)', () => {
  it('de testbibliotheek is precies de renderlijst', () => {
    expect(BLENDER_BIB.map((o) => o.naam).sort()).toEqual(BLENDER_OEFENINGEN.map((o) => o.naam).sort())
  })

  it('elke Blender-oefening met lichaamsgewicht valt onder thuis, ook met gearchiveerd = true in de database', () => {
    expect(ZONDER_MATERIAAL.length).toBeGreaterThanOrEqual(20)
    for (const o of ZONDER_MATERIAAL) {
      expect(kiesbaarVoorLid(o), o.naam).toBe(true)
      expect(MATERIAAL_BIJ.thuis.includes(kenmerkenVan(o).materiaal), o.naam).toBe(true)
    }
  })

  it('geeft per training minstens 4 oefeningen, allemaal zonder materiaal', () => {
    for (const doel of LID_DOELEN) {
      for (const niveau of NIVEAUS) {
        const v = lidVoorstel({ doel, dagen: 3, materiaal: 'thuis', niveau }, ALLE)
        expect(v, `${doel} ${niveau}`).not.toBeNull()
        const perDag = new Map<number, number>()
        for (const r of v?.regels ?? []) perDag.set(r.dag, (perDag.get(r.dag) ?? 0) + 1)
        for (const [dag, aantal] of perDag) expect(aantal, `${doel} niveau ${niveau} dag ${dag}`).toBeGreaterThanOrEqual(4)
        for (const o of gekozen('thuis', doel, 3, niveau)) expect(o.materiaal, o.naam).toBe('geen')
      }
    }
  })

  it('gebruikt over de week veel meer dan de oude drie oefeningen', () => {
    const namen = new Set(gekozen('thuis', 'gezondheid', 3, 1).map((o) => o.naam))
    expect(namen.size).toBeGreaterThanOrEqual(10)
    expect([...namen].some((n) => !['Push-up', 'Plank', 'Glute bridge'].includes(n))).toBe(true)
  })

  it('afvallen en conditie thuis verliezen geen oefeningen aan cardio die er niet is', () => {
    for (const doel of ['afvallen', 'conditie'] as const) {
      const v = lidVoorstel({ doel, dagen: 1, materiaal: 'thuis', niveau: 1 }, ALLE)
      expect(v?.regels.length, doel).toBeGreaterThanOrEqual(5)
    }
  })

  it('met lichaamsgewicht nooit zware herhalingen of lange rust', () => {
    const v = lidVoorstel({ doel: 'kracht', dagen: 2, materiaal: 'thuis', niveau: 3 }, ALLE)
    for (const r of v?.regels ?? []) {
      expect(['4-6', '6-8']).not.toContain(r.herhalingen)
      expect(r.rustSec).toBeLessThanOrEqual(90)
    }
  })
})

describe('andere materiaalfilters (lid-voorstel)', () => {
  it('dumbbells: alleen zonder materiaal of dumbbell', () => {
    for (const o of gekozen('dumbbells', 'spiermassa', 3, 2)) expect(['geen', 'dumbbell'], o.naam).toContain(o.materiaal)
  })

  it('volledige gym: ook barbell, en elke Blender-oefening valt binnen het materiaal van de gym', () => {
    for (const o of ALLE) expect(MATERIAAL_BIJ.gym.includes(o.materiaal), o.naam).toBe(true)
    expect(gekozen('gym', 'kracht', 3, 3).some((o) => o.materiaal === 'barbell')).toBe(true)
  })

  it('een oude oefening zonder render blijft onkiesbaar', () => {
    const oud = oefeningUitRij({ id: 'x', naam: 'Wall sit', spiergroep: 'benen', materiaal: 'geen', patroon: 'isolatie', actief: true, gearchiveerd: true })
    expect(oud && kiesbaarVoorLid(oud)).toBe(false)
  })
})

describe('filters in de bibliotheek van de ledenapp (echte Blender-set)', () => {
  const lijst: LidOefening[] = ALLE.map((o) => ({
    id: o.id, naam: o.naam, spiergroep: o.spiergroep, materiaal: o.materiaal, niveau: o.niveau, patroon: o.patroon,
    spierenPrimair: o.spierenPrimair, spierenSecundair: o.spierenSecundair, uitleg: null, aandachtspunten: null,
  }))
  const keuzes = filterKeuzes(lijst)

  it('materiaal "geen" toont alle oefeningen met lichaamsgewicht', () => {
    expect(filterBibliotheek(lijst, { ...LEEG_FILTER, materiaal: 'geen' })).toHaveLength(ZONDER_MATERIAAL.length)
    expect(keuzes.materialen).toEqual(expect.arrayContaining(['geen', 'barbell']))
  })

  it('elke oefening staat onder precies een spiergroep en geen spiergroep is leeg', () => {
    const perGroep = keuzes.spiergroepen.map((g) => filterBibliotheek(lijst, { ...LEEG_FILTER, spiergroep: g }))
    for (const groep of perGroep) expect(groep.length).toBeGreaterThan(0)
    expect(perGroep.reduce((n, g) => n + g.length, 0)).toBe(lijst.length)
  })
})

describe('migratie 475 (Blender-oefeningen uit het archief)', () => {
  const sql = readFileSync(join(process.cwd(), 'supabase/lifeos-migrations/475_club_oefeningen_blender_uit_archief.sql'), 'utf8')
  const namen = [...sql.matchAll(/^\s*\('((?:[^']|'')+)'\)/gm)].map((m) => m[1].replace(/''/g, "'"))

  it('haalt alleen Blender-oefeningen uit het archief, en alle lichaamsgewicht-oefeningen', () => {
    expect(namen.length).toBeGreaterThan(0)
    for (const n of namen) expect(isBlenderOefening(n), n).toBe(true)
    for (const o of ZONDER_MATERIAAL) expect(namen, o.naam).toContain(o.naam)
  })

  it('verwijdert niets', () => {
    expect(sql).not.toMatch(/\b(delete|drop|truncate)\b/i)
  })
})
