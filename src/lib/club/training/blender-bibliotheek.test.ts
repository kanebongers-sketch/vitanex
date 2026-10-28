import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OEFENRENDERS } from '@/components/aiyourgym/inhoud/oefenrenders'
import { repRenderVoor } from '@/components/club/training/repspeler/render-bron'
import { REPDB_ALLE_KOPPELINGEN, isStandaardOefening } from './beelden-repdb'
import { heeftOefenbeeld, telBeelden } from './beeld'
import { BLENDER_OEFENINGEN, blenderSlugVoor, hoortInArchief, isBlenderOefening, isGearchiveerd } from './blender-bibliotheek'
import { coachingVoor } from './coaching'
import { oefeningUitRij } from './rijen'
import { stelSchemaVoor } from './voorstel'
import { oef } from './voorstel-test-bib'

// Besluit Kane (28-10-2026): alleen de oefeningen met een eigen Blender-render
// zijn kiesbaar. De renderlijst is de bron; migratie 465 archiveert de rest
// van de standaardbibliotheek.

const MIGRATIE = readFileSync(join(process.cwd(), 'supabase/lifeos-migrations/465_club_oefeningen_alleen_blender.sql'), 'utf8')
const IN_MIGRATIE = new Set([...MIGRATIE.matchAll(/^\s*\('((?:[^']|'')+)'\)/gm)].map((m) => m[1].replace(/''/g, "'")))

describe('koppeling render en oefening', () => {
  it('elke render met losse beelden telt, en alleen die', () => {
    const metFrames = OEFENRENDERS.filter((r) => r.frames !== null && r.frames.aantal >= 2)
    expect(BLENDER_OEFENINGEN.map((o) => o.slug)).toEqual(metFrames.map((r) => r.slug))
    expect(BLENDER_OEFENINGEN.length).toBeGreaterThan(0)
  })

  it('naam en slug zijn uniek', () => {
    expect(new Set(BLENDER_OEFENINGEN.map((o) => o.naam.toLowerCase())).size).toBe(BLENDER_OEFENINGEN.length)
    expect(new Set(BLENDER_OEFENINGEN.map((o) => o.slug)).size).toBe(BLENDER_OEFENINGEN.length)
  })

  for (const o of BLENDER_OEFENINGEN) {
    it(`${o.naam}: staat in de standaardbibliotheek, heeft coaching en een rep-speler`, () => {
      // Exacte naam: zo vindt elke sportschool hem in de eigen bibliotheek.
      expect(isStandaardOefening(o.naam), 'naam exact zoals in club_oefeningen').toBe(true)
      expect(coachingVoor(o.naam), 'coaching').not.toBeNull()
      expect(repRenderVoor(o.naam)?.slug).toBe(o.slug)
      expect(blenderSlugVoor(o.naam)).toBe(o.slug)
      expect(isBlenderOefening(o.naam.toUpperCase())).toBe(true)
    })
  }

  it('onbekend of geen tekst is geen Blender-oefening', () => {
    expect(isBlenderOefening('Bestaat niet')).toBe(false)
    expect(isBlenderOefening(null)).toBe(false)
    expect(blenderSlugVoor('Bestaat niet')).toBeNull()
  })
})

describe('archief (migratie 465)', () => {
  it('de migratie raakt alleen namen uit de standaardbibliotheek, nooit eigen oefeningen', () => {
    expect(IN_MIGRATIE.size).toBeGreaterThan(100)
    for (const naam of IN_MIGRATIE) expect(isStandaardOefening(naam), naam).toBe(true)
  })

  it('elke standaardoefening zonder render staat in de migratie', () => {
    const zonder = REPDB_ALLE_KOPPELINGEN.map((k) => k.naam).filter(hoortInArchief)
    expect(zonder.filter((n) => !IN_MIGRATIE.has(n))).toEqual([])
    expect(zonder.length + BLENDER_OEFENINGEN.length).toBe(REPDB_ALLE_KOPPELINGEN.length)
  })

  it('een render haalt een oefening vanzelf uit het archief', () => {
    const blender = BLENDER_OEFENINGEN[0].naam
    expect(isGearchiveerd(blender, true)).toBe(false)
    expect(isGearchiveerd('Leg press', true)).toBe(!isBlenderOefening('Leg press'))
    expect(isGearchiveerd('Leg press', false)).toBe(false)
    expect(isGearchiveerd('Eigen oefening', null)).toBe(false)
  })

  it('een gearchiveerde rij is leesbaar maar niet kiesbaar', () => {
    const rij = { id: 'a', naam: 'Leg press', spiergroep: 'benen', actief: true, gearchiveerd: true, beeld_start: '/club/oefeningen-repdb/leg-press-start.webp', beeld_eind: '/club/oefeningen-repdb/leg-press-eind.webp' }
    const o = oefeningUitRij(rij)
    expect(o?.naam).toBe('Leg press')
    expect(o?.gearchiveerd).toBe(!isBlenderOefening('Leg press'))
    expect(o?.actief).toBe(isBlenderOefening('Leg press'))
  })

  it('een Blender-oefening toont nooit de oude illustratie', () => {
    const naam = BLENDER_OEFENINGEN[0].naam
    const o = oefeningUitRij({ id: 'b', naam, spiergroep: 'benen', actief: true, gearchiveerd: false, beeld_start: '/club/oefeningen-repdb/x-start.webp', beeld_eind: '/club/oefeningen-repdb/x-eind.webp' })
    expect(o?.beeld).toBeNull()
    expect(o && heeftOefenbeeld(o)).toBe(true)
    expect(telBeelden([{ naam, beeld: null }, { naam: 'Eigen', beeld: null }])).toEqual({ met: 1, totaal: 2 })
  })
})

describe('voorstel met alleen de Blender-oefeningen', () => {
  // De kenmerken zoals in club_oefeningen (gelezen 28-10-2026).
  const BIB = [
    oef('Back squat', 'squat', 'benen', 'barbell', 3, ['knie', 'rug'], ['quadriceps', 'bilspieren']),
    oef('Front squat', 'squat', 'benen', 'barbell', 3, ['knie', 'pols'], ['quadriceps', 'bilspieren']),
    oef('Deadlift', 'heupscharnier', 'benen', 'barbell', 3, ['rug', 'knie'], ['bilspieren', 'hamstrings', 'onderrug']),
    oef('Glute bridge', 'heupscharnier', 'billen', 'geen', 1, [], ['bilspieren']),
    oef('Lunge met barbell', 'lunge', 'benen', 'barbell', 3, ['knie'], ['quadriceps', 'bilspieren']),
    oef('Overhead press', 'duwen_verticaal', 'schouders', 'barbell', 3, ['schouder', 'rug'], ['voorste_schouder']),
    oef('Push-up', 'duwen_horizontaal', 'borst', 'geen', 1, ['schouder', 'pols'], ['borstspieren']),
    oef('Barbell row', 'trekken_horizontaal', 'rug', 'barbell', 2, ['rug'], ['latissimus', 'rhomboideus']),
    oef('Barbell curl', 'isolatie', 'biceps', 'barbell', 2, ['elleboog', 'pols'], ['biceps']),
    oef('Plank', 'core', 'buik', 'geen', 1, [], ['rechte_buikspier', 'diepe_buikspier']),
  ]

  it('de testbibliotheek is precies de renderlijst', () => {
    expect(BIB.map((o) => o.naam).sort()).toEqual(BLENDER_OEFENINGEN.map((o) => o.naam).sort())
  })

  it('een gevorderde krijgt elke dag een volledig schema', () => {
    const v = stelSchemaVoor({ doelen: ['spiermassa'], niveau: 3, dagenPerWeek: 3, minutenPerSessie: 60, voorkeuren: ['sportschool'], gezondheid: null }, BIB)
    expect(v.dagen.every((d) => d.regels.length >= 3)).toBe(true)
  })

  it('een beginner krijgt alleen niveau 1 en toch een schema', () => {
    const v = stelSchemaVoor({ doelen: ['gezondheid'], niveau: 1, dagenPerWeek: 2, minutenPerSessie: 45, voorkeuren: ['sportschool'], gezondheid: null }, BIB)
    const namen = new Set(v.dagen.flatMap((d) => d.regels.map((r) => BIB.find((o) => o.id === r.oefeningId)?.naam)))
    expect(namen.size).toBeGreaterThan(0)
    for (const n of namen) expect(['Glute bridge', 'Push-up', 'Plank']).toContain(n)
  })
})
