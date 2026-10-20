import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  STANDAARD_TERMIJNEN,
  TERMIJN_GRENZEN,
  TERMIJN_KOLOM,
  TERMIJN_VELDEN,
  VASTE_TERMIJNEN,
  keuzesVoor,
  leesTermijnen,
  maandenTekst,
  naarRij,
  uitRij,
} from './termijnen'

const MIGRATIE = join(process.cwd(), 'supabase', 'lifeos-migrations', '449_club_avg_compleet.sql')

describe('bewaartermijnen', () => {
  it('de grenzen zijn gelijk aan de checks in de migratie', () => {
    // Arrange
    const sql = readFileSync(MIGRATIE, 'utf8')
    for (const veld of TERMIJN_VELDEN) {
      const kolom = TERMIJN_KOLOM[veld]
      // Act
      const m = new RegExp(`check \\(${kolom} between (\\d+) and (\\d+)\\)`).exec(sql)
      const standaard = new RegExp(`${kolom} integer not null default (\\d+)`).exec(sql)
      // Assert
      expect(m, kolom).not.toBeNull()
      expect(Number(m?.[1]), kolom).toBe(TERMIJN_GRENZEN[veld].min)
      expect(Number(m?.[2]), kolom).toBe(TERMIJN_GRENZEN[veld].max)
      expect(Number(standaard?.[1]), kolom).toBe(STANDAARD_TERMIJNEN[veld])
    }
  })

  it('leest geldige invoer', () => {
    // Arrange
    const body = { leadsMaanden: 6, oudLedenMaanden: 12, bezoekenMaanden: 36, logboekMaanden: 84, extra: 'weg' }
    // Act
    const uit = leesTermijnen(body)
    // Assert
    expect(uit).toEqual({ ok: true, waarde: { leadsMaanden: 6, oudLedenMaanden: 12, bezoekenMaanden: 36, logboekMaanden: 84 } })
  })

  it('weigert waarden buiten de grenzen, geen hele getallen of ontbrekende velden', () => {
    // Arrange
    const goed = { ...STANDAARD_TERMIJNEN }
    const fout = [
      null,
      'tekst',
      [],
      { ...goed, leadsMaanden: 2 },
      { ...goed, leadsMaanden: 37 },
      { ...goed, oudLedenMaanden: 5 },
      { ...goed, bezoekenMaanden: 85 },
      { ...goed, logboekMaanden: 12.5 },
      { ...goed, logboekMaanden: '24' },
      { leadsMaanden: 12 },
    ]
    // Act en Assert
    for (const body of fout) expect(leesTermijnen(body).ok, JSON.stringify(body)).toBe(false)
  })

  it('geeft een nette foutmelding met de grenzen', () => {
    // Act
    const uit = leesTermijnen({ ...STANDAARD_TERMIJNEN, leadsMaanden: 99 })
    // Assert
    expect(uit).toEqual({ ok: false, fout: 'Leads: kies een termijn van 3 tot 36 maanden.' })
  })

  it('geen rij of een vreemde waarde wordt de standaard', () => {
    // Act en Assert
    expect(uitRij(null)).toEqual(STANDAARD_TERMIJNEN)
    expect(uitRij(undefined)).toEqual(STANDAARD_TERMIJNEN)
    expect(uitRij({ leads_maanden: 6, oud_leden_maanden: 'x', bezoeken_maanden: 999, logboek_maanden: 36 })).toEqual({
      leadsMaanden: 6,
      oudLedenMaanden: 24,
      bezoekenMaanden: 24,
      logboekMaanden: 36,
    })
  })

  it('naarRij en uitRij zijn elkaars omgekeerde', () => {
    // Arrange
    const t = { leadsMaanden: 18, oudLedenMaanden: 48, bezoekenMaanden: 3, logboekMaanden: 6 }
    // Act en Assert
    expect(uitRij(naarRij(t))).toEqual(t)
    expect(naarRij(t)).toEqual({ leads_maanden: 18, oud_leden_maanden: 48, bezoeken_maanden: 3, logboek_maanden: 6 })
  })

  it('keuzes blijven binnen de grenzen en bevatten altijd de huidige waarde', () => {
    // Act
    const leads = keuzesVoor('leadsMaanden', 12)
    const eigen = keuzesVoor('oudLedenMaanden', 30)
    // Assert
    expect(leads).toEqual([3, 6, 9, 12, 18, 24, 36])
    expect(eigen).toContain(30)
    expect(eigen[0]).toBe(6)
    expect(eigen.at(-1)).toBe(84)
  })

  it('maanden als tekst', () => {
    expect(maandenTekst(1)).toBe('1 maand')
    expect(maandenTekst(12)).toBe('12 maanden')
    expect(maandenTekst(18)).toBe('18 maanden')
    expect(maandenTekst(24)).toBe('2 jaar')
    expect(maandenTekst(84)).toBe('7 jaar')
  })

  it('schrijfstijl: geen gedachtestreepjes en geen klemtoon-accenten', () => {
    // Arrange
    const tekst = JSON.stringify(VASTE_TERMIJNEN)
    // Assert
    expect(tekst).not.toMatch(/[–—]/)
    expect(tekst).not.toMatch(/\s-\s/)
    expect(tekst).not.toMatch(/[éèáàíóú]/i)
  })
})
