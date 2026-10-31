import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OEFENRENDERS } from '@/components/aiyourgym/inhoud/oefenrenders'
import { repRenderVoor } from '@/components/club/training/repspeler/render-bron'
import { REPDB_ALLE_KOPPELINGEN, isStandaardOefening } from './beelden-repdb'
import { heeftOefenbeeld, telBeelden } from './beeld'
import { BLENDER_OEFENINGEN, blenderSlugVoor, hoortInArchief, isBlenderOefening, isGearchiveerd, telKiesbareOefeningen } from './blender-bibliotheek'
import { coachingVoor } from './coaching'
import { oefeningUitRij } from './rijen'
import { stelSchemaVoor } from './voorstel'
import { BLENDER_BIB } from './blender-test-bib'

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
      // Gearchiveerd in de database (migratie 465) maar met render: weer kiesbaar.
      expect(isGearchiveerd(o.naam, true)).toBe(false)
      expect(hoortInArchief(o.naam)).toBe(false)
    })
  }

  it('golf 1 en 1A (29-10-2026): alle 30 nieuwe renders zijn kiesbaar', () => {
    const golf1 = [
      'Push-up op knieën', 'Push-up met smalle handen', 'Glute bridge op een been', 'Zijplank', 'Superman',
      'Roemeense deadlift met barbell', 'Sumo deadlift', 'Good morning', 'Barbell row met onderhandse greep',
      'Schouders ophalen met barbell', 'Thruster met barbell', 'Squat met lichaamsgewicht', 'Achterwaartse lunge',
      'Split squat', 'Walking lunge met lichaamsgewicht', 'Zijwaartse lunge', 'Calf raise met lichaamsgewicht',
      'Pike push-up', 'Mountain climber', 'Bird dog', 'Squat jump', 'Burpee',
      'Crunch', 'Reverse crunch', 'Leg raise liggend', 'Hollow hold', 'Dead bug', 'Crunch met draai',
      'Fietsende crunch', 'Russian twist',
    ]
    expect(golf1).toHaveLength(30)
    expect(golf1.filter((n) => !isBlenderOefening(n))).toEqual([])
    for (const naam of golf1) {
      const o = oefeningUitRij({ id: 'g', naam, spiergroep: 'benen', actief: true, gearchiveerd: true, beeld_start: null, beeld_eind: null })
      expect(o?.actief, naam).toBe(true)
      expect(o?.gearchiveerd, naam).toBe(false)
    }
  })

  it('golf 2 (31-10-2026): de 32 renders met dumbbells, kettlebell en banken zijn kiesbaar, en migratie 487 haalt precies die uit het archief', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase/lifeos-migrations/487_club_oefeningen_golf2_uit_archief.sql'), 'utf8')
    const golf2 = [...sql.matchAll(/^\s*\('((?:[^']|'')+)'\)/gm)].map((m) => m[1].replace(/''/g, "'"))
    expect(golf2).toHaveLength(32)
    expect(sql).not.toMatch(/\b(delete|drop|truncate)\b/i)
    expect(golf2.filter((n) => !isBlenderOefening(n))).toEqual([])
    for (const naam of golf2) {
      expect(isStandaardOefening(naam), naam).toBe(true)
      const o = oefeningUitRij({ id: 'g', naam, spiergroep: 'benen', actief: true, gearchiveerd: true, beeld_start: null, beeld_eind: null })
      expect(o?.actief, naam).toBe(true)
      expect(o?.gearchiveerd, naam).toBe(false)
    }
  })

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
  const BIB = BLENDER_BIB

  it('de testbibliotheek is precies de renderlijst', () => {
    expect(BIB.map((o) => o.naam).sort()).toEqual(BLENDER_OEFENINGEN.map((o) => o.naam).sort())
  })

  it('een gevorderde krijgt elke dag een volledig schema', () => {
    const v = stelSchemaVoor({ doelen: ['spiermassa'], niveau: 3, dagenPerWeek: 3, minutenPerSessie: 60, voorkeuren: ['sportschool'], gezondheid: null }, BIB)
    expect(v.dagen.every((d) => d.regels.length >= 3)).toBe(true)
  })

  it('een beginner krijgt alleen niveau 1 en toch een schema', () => {
    const v = stelSchemaVoor({ doelen: ['gezondheid'], niveau: 1, dagenPerWeek: 2, minutenPerSessie: 45, voorkeuren: ['sportschool'], gezondheid: null }, BIB)
    const gekozen = v.dagen.flatMap((d) => d.regels.map((r) => BIB.find((o) => o.id === r.oefeningId)))
    expect(gekozen.length).toBeGreaterThan(0)
    for (const o of gekozen) expect(o?.niveau, o?.naam).toBe(1)
  })

  it('een beginner thuis krijgt een schema met alleen thuismateriaal uit de renders', () => {
    const v = stelSchemaVoor({ doelen: ['gezondheid'], niveau: 1, dagenPerWeek: 2, minutenPerSessie: 45, voorkeuren: ['thuis'], gezondheid: null }, BIB)
    const gekozen = v.dagen.flatMap((d) => d.regels.map((r) => BIB.find((o) => o.id === r.oefeningId)))
    expect(v.dagen.every((d) => d.regels.length >= 3)).toBe(true)
    // Thuis: lichaamsgewicht, elastiek, dumbbells en kettlebell (THUIS_MATERIAAL in voorstel-regels.ts).
    for (const o of gekozen) expect(['geen', 'band', 'dumbbell', 'kettlebell'], o?.naam).toContain(o?.materiaal)
  })
})

describe('telKiesbareOefeningen (instellingencentrum, 29-10-2026)', () => {
  it('telt de Blender-oefeningen plus de eigen oefeningen, nooit het archief of wat uit staat', () => {
    const archief = REPDB_ALLE_KOPPELINGEN.map((k) => k.naam).find((n) => hoortInArchief(n))
    expect(archief).toBeDefined()
    const rijen = [
      ...BLENDER_OEFENINGEN.map((o) => ({ naam: o.naam, actief: true, gearchiveerd: false })),
      { naam: archief!, actief: true, gearchiveerd: true },
      { naam: 'Eigen oefening van de sportschool', actief: true, gearchiveerd: false },
      { naam: 'Eigen oefening die uit staat', actief: false, gearchiveerd: false },
    ]
    expect(telKiesbareOefeningen(rijen)).toBe(BLENDER_OEFENINGEN.length + 1)
  })

  it('een Blender-oefening die nog op gearchiveerd staat telt mee (hij is weer kiesbaar)', () => {
    expect(telKiesbareOefeningen([{ naam: BLENDER_OEFENINGEN[0].naam, gearchiveerd: true }])).toBe(1)
    expect(telKiesbareOefeningen([{ naam: null }])).toBe(0)
  })
})
