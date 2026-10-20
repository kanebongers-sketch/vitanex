import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SECTIES } from './export'
import { AVG_BRONNEN } from './opslag'
import { LID_TABELLEN } from './tabellen'

// Bewaakt de AVG-rechten van een lid: elke tabel die ooit een lid_id kreeg
// (in een migratie) moet in de inzage en in het definitief verwijderen zitten.

const MAP = join(process.cwd(), 'supabase', 'lifeos-migrations')
const BESTANDEN = readdirSync(MAP).filter((b) => b.endsWith('.sql')).sort()
const lees = (bestand: string): string => readFileSync(join(MAP, bestand), 'utf8')

/** Alle club_-tabellen die in een migratie een kolom lid_id krijgen. */
function tabellenMetLidId(): Set<string> {
  const uit = new Set<string>()
  for (const bestand of BESTANDEN) {
    const sql = lees(bestand).replace(/--[^\n]*/g, '')
    for (const m of sql.matchAll(/create table (?:if not exists )?(?:public\.)?(club_\w+)\s*\(([\s\S]*?)\n\);/gi)) {
      if (/\blid_id\b/.test(m[2])) uit.add(m[1])
    }
    for (const m of sql.matchAll(/alter table (?:if exists )?(?:only )?(?:public\.)?(club_\w+)\s+add column (?:if not exists )?lid_id\b/gi)) uit.add(m[1])
  }
  return uit
}

/** De body van de laatste versie van club_lid_definitief_verwijderen. */
function laatsteVerwijderfunctie(): { bestand: string; body: string } {
  const kop = /create or replace function public\.club_lid_definitief_verwijderen\([\s\S]*?\$\$([\s\S]*?)\$\$/i
  const metFunctie = BESTANDEN.filter((b) => kop.test(lees(b)))
  const bestand = metFunctie[metFunctie.length - 1]
  const body = lees(bestand).match(kop)?.[1] ?? ''
  return { bestand, body }
}

describe('AVG: tabellen met gegevens van een lid', () => {
  it('elke tabel met lid_id uit de migraties staat in LID_TABELLEN', () => {
    // Arrange
    const gevonden = tabellenMetLidId()
    // Act
    const vergeten = [...gevonden].filter((t) => !(t in LID_TABELLEN))
    // Assert
    expect(gevonden.size).toBeGreaterThan(20)
    expect(vergeten, `Nieuwe tabel met lid_id: voeg toe aan tabellen.ts, de export en club_lid_definitief_verwijderen`).toEqual([])
  })

  it('elke tabel in LID_TABELLEN bestaat echt in een migratie', () => {
    const gevonden = tabellenMetLidId()
    expect(Object.keys(LID_TABELLEN).filter((t) => !gevonden.has(t))).toEqual([])
  })

  it('elke tabel zit in de inzage (export) met de juiste tabel als bron', () => {
    const secties = new Set(SECTIES.map((s) => s.sleutel))
    for (const [tabel, info] of Object.entries(LID_TABELLEN)) {
      expect(info.export, `${tabel} mist in de export`).not.toBeNull()
      if (!info.export) continue
      expect(secties.has(info.export), `${tabel}: geen sectie ${info.export} in export.ts`).toBe(true)
      const bron = (AVG_BRONNEN as Record<string, { tabel: string }>)[info.export]
      expect(bron?.tabel, `${tabel}: bron ${info.export} in opslag.ts leest een andere tabel`).toBe(tabel)
    }
  })

  it('elke tabel staat in de laatste versie van club_lid_definitief_verwijderen', () => {
    // Arrange
    const { bestand, body } = laatsteVerwijderfunctie()
    // Act
    const ontbreekt = Object.entries(LID_TABELLEN)
      .filter(([, info]) => !info.viaCascade)
      .map(([tabel]) => tabel)
      .filter((tabel) => !new RegExp(`public\\.${tabel}\\b`).test(body))
    // Assert
    expect(bestand >= '449', `laatste versie staat in ${bestand}`).toBe(true)
    expect(ontbreekt, `Niet in club_lid_definitief_verwijderen (${bestand})`).toEqual([])
  })

  it('wat blijft (anoniem of bewaarplicht) heeft een reden', () => {
    for (const [tabel, info] of Object.entries(LID_TABELLEN)) {
      if (info.afhandeling !== 'verwijderd') expect(info.reden, tabel).toBeTruthy()
    }
  })
})
