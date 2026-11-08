import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { COACHING_EN_NAMEN } from '@/lib/aiyourgym/taal/woorden/club/coaching'
import { REPDB_ALLE_KOPPELINGEN, REPDB_GEEN_MATCH, STANDAARD_OEFENING_NAMEN, isStandaardOefening } from './beelden-repdb'
import { hoortInArchief, isBlenderOefening, isGearchiveerd } from './blender-bibliotheek'
import { coachingVoor } from './coaching'
import { SPIEREN } from './spieren'
import STANDAARD_500 from './standaard-500.json'
import { UITVOERING } from './repspeler/uitvoering'
import { STANDAARD_500_NAMEN } from './standaard-500-namen'
import { MATERIALEN, NIVEAUS, PATRONEN, SPIERGROEPEN, ZONES } from './typen'

// De uitbreiding van migratie 500 (opdracht Kane 05-11-2026: "Nog meer
// oefeningen!"): eigen standaardoefeningen zonder RepDB-beeld. Ze horen bij de
// standaardbibliotheek, hebben coaching in beide talen en staan in het archief
// tot ze een eigen Blender-render hebben.

const MIGRATIE = readFileSync(join(process.cwd(), 'supabase/lifeos-migrations/500_club_oefeningen_uitbreiding_500.sql'), 'utf8')
const sleutel = (n: string): string => n.trim().toLowerCase()

describe('uitbreiding standaardbibliotheek (migratie 500)', () => {
  it('migratie 502 (golf 14) noemt alleen namen uit de lijst met een tempo en verwijdert niets', () => {
    const sql = readFileSync(join(process.cwd(), 'supabase/lifeos-migrations/502_club_oefeningen_golf14_uit_archief.sql'), 'utf8')
    const namen = [...sql.matchAll(/^\s*\('((?:[^']|'')+)'\)/gm)].map((m) => m[1].replace(/''/g, "'"))
    expect(namen).toHaveLength(12)
    expect(namen.filter((n) => !(STANDAARD_500_NAMEN as readonly string[]).includes(n))).toEqual([])
    for (const o of STANDAARD_500.filter((x) => namen.includes(x.naam))) expect(UITVOERING[o.slug], o.slug).toBeDefined()
    expect(sql).not.toMatch(/\b(delete|drop|truncate)\b/i)
  })

  it('de namenlijst is precies de gegevensbron', () => {
    expect([...STANDAARD_500_NAMEN]).toEqual(STANDAARD_500.map((o) => o.naam))
    expect(STANDAARD_500.length).toBeGreaterThanOrEqual(50)
  })

  it('geen dubbele namen of slugs, ook niet met de oude bibliotheek', () => {
    const namen = STANDAARD_OEFENING_NAMEN.map(sleutel)
    expect(new Set(namen).size).toBe(namen.length)
    const oud = new Set([...REPDB_ALLE_KOPPELINGEN.map((k) => k.naam), ...REPDB_GEEN_MATCH].map(sleutel))
    for (const o of STANDAARD_500) expect(oud.has(sleutel(o.naam)), o.naam).toBe(false)
    const slugs = STANDAARD_500.map((o) => o.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it.each(STANDAARD_500.map((o) => [o.naam, o] as const))('%s heeft geldige kenmerken', (_naam, o) => {
    expect(SPIERGROEPEN).toContain(o.spiergroep)
    expect(MATERIALEN).toContain(o.materiaal)
    expect(PATRONEN).toContain(o.patroon)
    expect(NIVEAUS).toContain(o.niveau)
    for (const z of o.belast) expect(ZONES).toContain(z)
    expect(o.primair.length).toBeGreaterThan(0)
    for (const s of [...o.primair, ...o.secundair]) expect(SPIEREN).toContain(s)
    expect(o.primair.filter((s) => o.secundair.includes(s))).toEqual([])
    for (const t of [o.uitleg, o.aandachtspunten, o.pijplijn]) {
      expect(t).not.toMatch(/[–—]|\s-\s|[áéíóúàèìòù]/i)
    }
  })

  it('hoort bij de standaardbibliotheek en gaat zo mee naar een nieuwe sportschool', () => {
    for (const naam of STANDAARD_500_NAMEN) expect(isStandaardOefening(naam), naam).toBe(true)
  })

  it('staat in het archief tot er een eigen render is', () => {
    for (const naam of STANDAARD_500_NAMEN) {
      expect(hoortInArchief(naam), naam).toBe(!isBlenderOefening(naam))
      expect(isGearchiveerd(naam, true), naam).toBe(!isBlenderOefening(naam))
    }
  })

  it('heeft coaching in het Nederlands en het Engels', () => {
    expect(STANDAARD_500_NAMEN.filter((n) => coachingVoor(n) === null)).toEqual([])
    expect(STANDAARD_500_NAMEN.filter((n) => !COACHING_EN_NAMEN.includes(n))).toEqual([])
  })

  it('de migratie voegt elke oefening toe, gearchiveerd en zonder iets te verwijderen', () => {
    for (const naam of STANDAARD_500_NAMEN) expect(MIGRATIE, naam).toContain(`('${naam.replace(/'/g, "''")}',`)
    expect(MIGRATIE).toMatch(/actief, gearchiveerd\)/)
    expect(MIGRATIE).toMatch(/true, true\s+from/)
    expect(MIGRATIE).not.toMatch(/\b(delete|drop|truncate)\b/i)
  })
})
