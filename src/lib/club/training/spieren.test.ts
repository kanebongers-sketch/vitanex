import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  hoofdspieren, isSpier, KERNSPIEREN, leesSpierKeuze, opsomming, SPIER_GROEPEN, SPIER_INFO, SPIEREN, spierenInGroep,
  spierStaat, spierUitleg, volgendeStaat, type Spier,
} from './spieren'
import { schemaOverzicht, type OverzichtOefening } from './spier-overzicht'

const MIGRATIES = join(process.cwd(), 'supabase', 'lifeos-migrations')
const lees = (bestand: string) => readFileSync(join(MIGRATIES, bestand), 'utf8')

/** De oefeningnamen uit de insert-regels van een migratie. */
function namenUit(sql: string): string[] {
  return [...sql.matchAll(/^\s*\('((?:[^']|'')*)','[a-z_]+','[a-z_]+',\d,/gm)].map((m) => m[1].replace(/''/g, "'"))
}

/** Naam, primair en secundair uit 394. */
function spierRijen(sql: string): { naam: string; primair: string[]; secundair: string[] }[] {
  const lijst = (t: string) => (t === '' ? [] : t.split(','))
  return [...sql.matchAll(/^\s*\('((?:[^']|'')*)', '\{([a-z_,]*)\}', '\{([a-z_,]*)\}'\)/gm)].map((m) => ({
    naam: m[1].replace(/''/g, "'"),
    primair: lijst(m[2]),
    secundair: lijst(m[3]),
  }))
}

describe('de spierenlijst', () => {
  it('heeft voor elke spier een naam, een tweede naam en een groep', () => {
    for (const s of SPIEREN) {
      expect(SPIER_INFO[s].naam.length).toBeGreaterThan(2)
      expect(SPIER_INFO[s].ook.length).toBeGreaterThan(2)
      expect(SPIER_GROEPEN).toContain(SPIER_INFO[s].groep)
    }
    expect(SPIER_GROEPEN.flatMap(spierenInGroep)).toHaveLength(SPIEREN.length)
    expect(spierenInGroep('benen')).toEqual(expect.arrayContaining(['quadriceps', 'hamstrings', 'bilspieren', 'adductoren']))
    expect(KERNSPIEREN.every(isSpier)).toBe(true)
  })
  it('schrijft zonder gedachtestreepjes en klemtoon-accenten', () => {
    const tekst = SPIEREN.map((s) => `${SPIER_INFO[s].naam} ${SPIER_INFO[s].ook}`).join(' ')
    expect(tekst).not.toMatch(/[–—]|\s-\s/)
    expect(tekst).not.toMatch(/[éèóòáàíúëïö]/)
  })
})

describe('uitleg in een zin', () => {
  it('somt netjes op', () => {
    expect(opsomming([])).toBe('')
    expect(opsomming(['a'])).toBe('a')
    expect(opsomming(['a', 'b', 'c'])).toBe('a, b en c')
  })
  it('zegt waar een oefening vooral op werkt en wat meewerkt', () => {
    expect(spierUitleg(['quadriceps', 'bilspieren'], ['hamstrings', 'adductoren', 'onderrug'])).toBe(
      'Werkt vooral op quadriceps en bilspieren. Werkt mee: hamstrings, adductoren en onderrug.',
    )
    expect(spierUitleg(['triceps'], [])).toBe('Werkt vooral op triceps.')
    expect(spierUitleg([], ['biceps'])).toBe('')
  })
})

describe('spieren kiezen', () => {
  it('eist minstens een primaire spier en houdt de lijsten apart', () => {
    expect(leesSpierKeuze(['quadriceps', 'quadriceps'], ['hamstrings'])).toEqual({ ok: true, primair: ['quadriceps'], secundair: ['hamstrings'] })
    expect(leesSpierKeuze([], ['hamstrings']).ok).toBe(false)
    expect(leesSpierKeuze(undefined, undefined).ok).toBe(false)
    expect(leesSpierKeuze(['quadriceps'], ['quadriceps'])).toEqual({ ok: false, fout: 'Quadriceps staat bij vooral en bij meewerkend. Kies een van de twee.' })
    expect(leesSpierKeuze(['benen'], []).ok).toBe(false)
  })
  it('wisselt uit, vooral, meewerkend en weer uit', () => {
    const a = volgendeStaat('biceps', [], [])
    expect(a).toEqual({ primair: ['biceps'], secundair: [] })
    const b = volgendeStaat('biceps', a.primair, a.secundair)
    expect(b).toEqual({ primair: [], secundair: ['biceps'] })
    expect(volgendeStaat('biceps', b.primair, b.secundair)).toEqual({ primair: [], secundair: [] })
    expect(spierStaat('biceps', ['biceps'], [])).toBe('primair')
    expect(spierStaat('kuiten', [], ['kuiten'])).toBe('secundair')
    expect(spierStaat('kuiten', [], [])).toBe('rust')
  })
  it('valt zonder spieren terug op de grove spiergroep', () => {
    expect(hoofdspieren({ spierenPrimair: [], spiergroep: 'benen' })).toEqual(['quadriceps', 'hamstrings'])
    expect(hoofdspieren({ spierenPrimair: ['adductoren'], spiergroep: 'benen' })).toEqual(['adductoren'])
  })
})

describe('migratie 394', () => {
  const namen = [...namenUit(lees('382_club_oefeningen.sql')), ...namenUit(lees('391_club_oefening_beelden.sql'))]
  const sql = lees('394_club_oefening_spieren.sql')
  const rijen = spierRijen(sql)

  it('geeft alle 146 oefeningen uit 382 en 391 spieren, elk een keer', () => {
    expect(namen).toHaveLength(146)
    expect(rijen).toHaveLength(146)
    expect(new Set(rijen.map((r) => r.naam))).toEqual(new Set(namen))
  })
  it('gebruikt alleen bekende spieren, minstens een primaire en geen spier dubbel', () => {
    for (const r of rijen) {
      expect(r.primair.length, r.naam).toBeGreaterThan(0)
      expect([...r.primair, ...r.secundair].every(isSpier), r.naam).toBe(true)
      expect(new Set([...r.primair, ...r.secundair]).size, r.naam).toBe(r.primair.length + r.secundair.length)
    }
  })
  it('heeft dezelfde lijst in de databasecontrole als in de code', () => {
    const controle = sql.match(/spieren_primair <@ array\[([^\]]+)\]/)?.[1] ?? ''
    expect(controle.replace(/'/g, '').split(',')).toEqual([...SPIEREN])
  })
  it('deelt bekende oefeningen in zoals een trainer verwacht', () => {
    const van = (naam: string) => rijen.find((r) => r.naam === naam)
    expect(van('Back squat')).toEqual({ naam: 'Back squat', primair: ['quadriceps', 'bilspieren'], secundair: ['adductoren', 'hamstrings', 'onderrug'] })
    expect(van('Lat pulldown')?.primair).toEqual(['latissimus'])
    expect(van('Lat pulldown')?.secundair).toEqual(['biceps', 'rhomboideus', 'achterste_schouder'])
    expect(van('Leg curl liggend')?.primair).toEqual(['hamstrings'])
    expect(van('Crosstrainer')?.primair).toEqual(['hart_longen'])
    // Elke spier uit de lijst komt bij minstens een oefening als primaire of secundaire spier voor.
    const gebruikt = new Set(rijen.flatMap((r) => [...r.primair, ...r.secundair]))
    expect(SPIEREN.filter((s) => !gebruikt.has(s))).toEqual([])
  })
})

describe('schemaOverzicht', () => {
  const oef = (spierenPrimair: Spier[]): OverzichtOefening => ({ spierenPrimair, spiergroep: 'hele_lichaam' })
  const perId = new Map<string, OverzichtOefening>([
    ['squat', oef(['quadriceps', 'bilspieren'])],
    ['curl', oef(['hamstrings'])],
    ['bank', oef(['borstspieren'])],
    ['fiets', oef(['hart_longen'])],
  ])

  it('telt sets per groep per dag en een oefening een keer per groep', () => {
    const o = schemaOverzicht(
      [
        { dag: 1, oefeningId: 'squat', sets: '4' },
        { dag: 1, oefeningId: 'curl', sets: 3 },
        { dag: 2, oefeningId: 'bank', sets: '' },
        { dag: 2, oefeningId: 'fiets', sets: null },
        { dag: 2, oefeningId: 'onbekend', sets: 5 },
      ],
      perId,
      3,
    )
    expect(o.dagen).toHaveLength(3)
    expect(o.dagen[0].setsPerGroep.benen).toBe(7)
    expect(o.dagen[0].totaalSets).toBe(7)
    expect(o.dagen[1].setsPerGroep).toMatchObject({ borst: 1, conditie: 1, benen: 0 })
    expect(o.dagen[2].totaalSets).toBe(0)
    expect(o.setsPerSpier).toMatchObject({ quadriceps: 4, bilspieren: 4, hamstrings: 3, borstspieren: 1 })
  })
  it('noemt kernspieren die nergens als hoofdspier voorkomen', () => {
    const o = schemaOverzicht([{ dag: 1, oefeningId: 'squat', sets: 3 }], perId, 1)
    expect(o.ontbreekt).toContain('hamstrings')
    expect(o.ontbreekt).not.toContain('quadriceps')
    expect(o.ontbreekt).not.toContain('hart_longen')
  })
})
