import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OPZEG_REDENEN, TOELICHTING_MAX, leesOpzegReden, opzegActie, vraagtOpzegReden, zonderToelichting } from './opzegreden'
import { LEAD_UITKOMSTEN, LID_UITKOMSTEN, isLeadUitkomst, isLidUitkomst } from './uitkomst'
import { BEHOUD_DATA } from '@/lib/aiyourgym/taal/woorden/club/behoud-data'

const MIGRATIE = readFileSync(join(process.cwd(), 'supabase', 'lifeos-migrations', '482_club_opzegreden_uitkomst.sql'), 'utf8')

/** De waarden in de check van een kolom uit de migratie, in volgorde. */
function checkLijst(kolom: string): string[] {
  const m = new RegExp(`${kolom} in \\(([^)]*)\\)`).exec(MIGRATIE)
  return m ? [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]) : []
}

describe('opzegreden', () => {
  it('vraagt een reden zodra een lopend lid opzegt of stopt', () => {
    expect(vraagtOpzegReden('actief', 'opgezegd')).toBe(true)
    expect(vraagtOpzegReden('gepauzeerd', 'gestopt')).toBe(true)
    expect(vraagtOpzegReden('proef', 'gestopt')).toBe(true)
    expect(vraagtOpzegReden('opgezegd', 'gestopt')).toBe(false)
    expect(vraagtOpzegReden('actief', 'gepauzeerd')).toBe(false)
    expect(vraagtOpzegReden('gestopt', 'actief')).toBe(false)
  })

  it('leest een reden met toelichting en weigert zonder geldige reden', () => {
    // Arrange
    const goed = { reden: 'verhuizing', toelichting: '  Naar   Utrecht ' }
    // Act
    const uit = leesOpzegReden(goed)
    // Assert
    expect(uit).toEqual({ ok: true, waarde: { reden: 'verhuizing', toelichting: 'Naar Utrecht' } })
    expect(leesOpzegReden({ reden: 'zomaar' })).toEqual({ ok: false, fout: 'geenReden' })
    expect(leesOpzegReden(undefined)).toEqual({ ok: false, fout: 'geenReden' })
    expect(leesOpzegReden({ reden: 'prijs', toelichting: 'a'.repeat(TOELICHTING_MAX + 1) })).toEqual({ ok: false, fout: 'teLang' })
    expect(leesOpzegReden({ reden: 'prijs', toelichting: '   ' })).toEqual({ ok: true, waarde: { reden: 'prijs', toelichting: null } })
  })

  it('bewaart bij gezondheid nooit details', () => {
    expect(zonderToelichting('gezondheid')).toBe(true)
    expect(leesOpzegReden({ reden: 'gezondheid', toelichting: 'Knieoperatie' })).toEqual({ ok: true, waarde: { reden: 'gezondheid', toelichting: null } })
    expect(MIGRATIE).toContain("check (reden <> 'gezondheid' or toelichting is null)")
  })

  it('noemt de actie naar de nieuwe status', () => {
    expect(opzegActie('opgezegd')).toBe('opzeggen')
    expect(opzegActie('gestopt')).toBe('stoppen')
  })

  it('de lijst in de code is gelijk aan de check in de database', () => {
    expect(checkLijst('reden')).toEqual([...OPZEG_REDENEN])
  })
})

describe('uitkomsten', () => {
  it('kent alleen de vaste lijsten', () => {
    expect(isLidUitkomst('bereikt_blijft')).toBe(true)
    expect(isLidUitkomst('lid_geworden')).toBe(false)
    expect(isLeadUitkomst('lid_geworden')).toBe(true)
    expect(isLeadUitkomst('opgezegd')).toBe(false)
  })

  it('de lijsten in de code zijn gelijk aan de checks in de database', () => {
    const [lid, lead] = [...MIGRATIE.matchAll(/uitkomst is null or uitkomst in \(([^)]*)\)/g)].map((m) => [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]))
    expect(lid).toEqual([...LID_UITKOMSTEN])
    expect(lead).toEqual([...LEAD_UITKOMSTEN])
  })

  it('heeft voor elke reden en uitkomst een tekst in beide talen', () => {
    for (const taal of ['nl', 'en'] as const) {
      const w = BEHOUD_DATA[taal]
      expect(Object.keys(w.opzeg.redenen)).toEqual([...OPZEG_REDENEN])
      expect(Object.keys(w.uitkomst.lid)).toEqual([...LID_UITKOMSTEN])
      expect(Object.keys(w.uitkomst.lead)).toEqual([...LEAD_UITKOMSTEN])
    }
  })
})
