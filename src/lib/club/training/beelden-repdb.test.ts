import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isEnkeleHouding,
  isRepdbBeeldPad,
  REPDB_ENKELE_HOUDING,
  REPDB_GEEN_MATCH,
  REPDB_KOPPELING,
  REPDB_SLUG,
  repdbBeeldBestand,
} from './beelden-repdb'

const ROOT = process.cwd()
const MIGRATIES = join(ROOT, 'supabase', 'lifeos-migrations')
const lees = (bestand: string) => readFileSync(join(MIGRATIES, bestand), 'utf8')
const oefeningRij = /^\s+\('([^']+)','[a-z_]+','[a-z_]+',\d,/gm
const alleOefeningen = new Set(
  [lees('382_club_oefeningen.sql'), lees('391_club_oefening_beelden.sql')].flatMap((sql) =>
    [...sql.matchAll(oefeningRij)].map((m) => m[1].toLowerCase()),
  ),
)
const sql395 = lees('395_club_oefening_repdb.sql')

describe('koppeling oefening naar RepDB-illustratie', () => {
  it('heeft geen lege velden en alleen geldige ids', () => {
    for (const k of REPDB_KOPPELING) {
      expect(k.naam.trim()).not.toBe('')
      expect(k.titel.trim()).not.toBe('')
      expect(k.id).toMatch(REPDB_SLUG)
    }
  })

  it('heeft geen dubbele namen of dubbele RepDB-ids', () => {
    const namen = REPDB_KOPPELING.map((k) => k.naam.toLowerCase())
    const ids = REPDB_KOPPELING.map((k) => k.id)
    expect(new Set(namen).size).toBe(namen.length)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('koppelt alleen oefeningen die echt in de bibliotheek staan', () => {
    expect(alleOefeningen.size).toBe(146)
    for (const naam of [...REPDB_KOPPELING.map((k) => k.naam), ...REPDB_GEEN_MATCH]) {
      expect(alleOefeningen.has(naam.toLowerCase()), naam).toBe(true)
    }
  })

  it('beslist voor elke oefening precies een keer: koppeling of bewust geen match', () => {
    const gekoppeld = new Set(REPDB_KOPPELING.map((k) => k.naam.toLowerCase()))
    const geen = new Set(REPDB_GEEN_MATCH.map((n) => n.toLowerCase()))
    expect(geen.size).toBe(REPDB_GEEN_MATCH.length)
    for (const naam of geen) expect(gekoppeld.has(naam), naam).toBe(false)
    expect(gekoppeld.size + geen.size).toBe(alleOefeningen.size)
  })

  it('heeft voor elke koppeling beide beelden in public', () => {
    for (const k of REPDB_KOPPELING) {
      for (const houding of ['start', 'eind'] as const) {
        expect(existsSync(join(ROOT, 'public', repdbBeeldBestand(k.id, houding))), `${k.id} ${houding}`).toBe(true)
      }
    }
    expect(existsSync(join(ROOT, 'public', 'club', 'oefeningen-repdb', 'ATTRIBUTION.txt'))).toBe(true)
  })

  it('markeert precies de oefeningen met gelijke start en eind als enkele houding', () => {
    const ids = new Set(REPDB_KOPPELING.map((k) => k.id))
    for (const id of REPDB_ENKELE_HOUDING) expect(ids.has(id), id).toBe(true)
    for (const k of REPDB_KOPPELING) {
      const pad = (h: 'start' | 'eind') => join(ROOT, 'public', repdbBeeldBestand(k.id, h))
      const gelijk = readFileSync(pad('start')).equals(readFileSync(pad('eind')))
      expect(REPDB_ENKELE_HOUDING.has(k.id), k.id).toBe(gelijk)
    }
    expect(isEnkeleHouding('/club/oefeningen-repdb/plank-eind.webp')).toBe(true)
    expect(isEnkeleHouding('/club/oefeningen-repdb/push-up-start.webp')).toBe(false)
  })

  it('staat met dezelfde id in migratie 395', () => {
    for (const k of REPDB_KOPPELING) {
      expect(sql395, k.naam).toContain(`('${k.naam.replace(/'/g, "''")}','${k.id}')`)
    }
  })
})

describe('RepDB-beeldpaden', () => {
  it('maakt paden in onze eigen map', () => {
    expect(repdbBeeldBestand('push-up', 'start')).toBe('/club/oefeningen-repdb/push-up-start.webp')
    expect(repdbBeeldBestand('t-bar-row', 'eind')).toBe('/club/oefeningen-repdb/t-bar-row-eind.webp')
    expect(() => repdbBeeldBestand('../x', 'start')).toThrow()
  })

  it('laat alleen eigen RepDB-paden door', () => {
    expect(isRepdbBeeldPad('/club/oefeningen-repdb/push-up-start.webp')).toBe(true)
    expect(isRepdbBeeldPad('/club/oefeningen-repdb/push-up-eind.webp')).toBe(true)
    expect(isRepdbBeeldPad('/club/oefeningen/0077-start.svg')).toBe(false)
    expect(isRepdbBeeldPad('/club/oefeningen-repdb/Push-up-start.webp')).toBe(false)
    expect(isRepdbBeeldPad('/club/oefeningen-repdb/push-up-peak.webp')).toBe(false)
    expect(isRepdbBeeldPad('https://example.com/a-start.webp')).toBe(false)
    expect(isRepdbBeeldPad('/club/oefeningen-repdb/a-start.webp")')).toBe(false)
    expect(isRepdbBeeldPad(null)).toBe(false)
  })
})
