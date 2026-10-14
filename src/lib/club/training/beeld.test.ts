import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { beeldenUitRij, isBeeldPad, telBeelden } from './beeld'
import { BEELD_KOPPELING, beeldBestand, KOPPELING_BESTAAND, KOPPELING_NIEUW } from './beelden-koppeling'

const ROOT = process.cwd()
const MIGRATIES = join(ROOT, 'supabase', 'lifeos-migrations')
const sql382 = readFileSync(join(MIGRATIES, '382_club_oefeningen.sql'), 'utf8')
const sql391 = readFileSync(join(MIGRATIES, '391_club_oefening_beelden.sql'), 'utf8')
const startbibliotheek = new Set([...sql382.matchAll(/^\s+\('([^']+)','/gm)].map((m) => m[1].toLowerCase()))

describe('koppeling oefening naar tekening', () => {
  it('heeft geen lege of dubbele koppelingen', () => {
    for (const k of BEELD_KOPPELING) {
      expect(k.naam.trim()).not.toBe('')
      expect(k.titel.trim()).not.toBe('')
      expect(k.id).toMatch(/^\d{4}$/)
    }
    const namen = BEELD_KOPPELING.map((k) => k.naam.toLowerCase())
    const ids = BEELD_KOPPELING.map((k) => k.id)
    expect(new Set(namen).size).toBe(namen.length)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('koppelt bestaande oefeningen alleen aan namen uit de startbibliotheek', () => {
    expect(startbibliotheek.size).toBeGreaterThan(100)
    for (const k of KOPPELING_BESTAAND) expect(startbibliotheek.has(k.naam.toLowerCase()), k.naam).toBe(true)
  })

  it('nieuwe oefeningen staan in migratie 391 en niet al in 382', () => {
    for (const k of KOPPELING_NIEUW) {
      expect(startbibliotheek.has(k.naam.toLowerCase()), k.naam).toBe(false)
      expect(sql391.includes(`('${k.naam}','`), k.naam).toBe(true)
    }
  })

  it('migratie 391 zet het pad voor elke koppeling', () => {
    for (const k of BEELD_KOPPELING) expect(sql391.includes(`('${k.naam}','${k.id}')`), k.naam).toBe(true)
  })

  it('heeft voor elke koppeling beide tekeningen in public', () => {
    for (const k of BEELD_KOPPELING) {
      for (const h of ['start', 'eind'] as const) {
        expect(existsSync(join(ROOT, 'public', beeldBestand(k.id, h))), `${k.naam} ${h}`).toBe(true)
      }
    }
    expect(existsSync(join(ROOT, 'public', 'club', 'oefeningen', 'LICENSE.txt'))).toBe(true)
  })

  it('tekeningen hebben geen witte achtergrond en volgen de tekstkleur', () => {
    const svg = readFileSync(join(ROOT, 'public', beeldBestand(BEELD_KOPPELING[0].id, 'start')), 'utf8')
    expect(svg).toContain('currentColor')
    expect(svg).not.toMatch(/#fff\b|#ffffff\b|<script|width="/i)
  })
})

describe('beeldpaden uit de database', () => {
  const start = '/club/oefeningen/0122-start.svg'
  const eind = '/club/oefeningen/0122-eind.svg'

  it('laat alleen onze eigen paden door', () => {
    expect(isBeeldPad(start)).toBe(true)
    expect(isBeeldPad('/club/oefeningen/0122-midden.svg')).toBe(false)
    expect(isBeeldPad('https://elders.nl/club/oefeningen/0122-start.svg')).toBe(false)
    expect(isBeeldPad('/club/oefeningen/0122-start.svg) ; background:url(x')).toBe(false)
    expect(isBeeldPad(null)).toBe(false)
  })

  it('geeft beide houdingen of niets', () => {
    expect(beeldenUitRij({ beeld_start: start, beeld_eind: eind })).toEqual({ start, eind })
    expect(beeldenUitRij({ beeld_start: start, beeld_eind: null })).toBeNull()
    expect(beeldenUitRij({})).toBeNull()
  })

  it('telt hoeveel oefeningen een tekening hebben', () => {
    expect(telBeelden([{ beeld: { start, eind } }, { beeld: null }, { beeld: null }])).toEqual({ met: 1, totaal: 3 })
  })
})
