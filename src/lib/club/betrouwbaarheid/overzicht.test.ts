import { describe, expect, it } from 'vitest'
import { dagTerug, foutenPerDag, leesbareGrootte, opslagProcent, GRATIS_DB_BYTES } from './overzicht'
import { dbStandUit, statusAntwoord } from './status'

describe('dagTerug', () => {
  it('telt terug over een maandgrens', () => {
    expect(dagTerug('2026-11-02', 3)).toBe('2026-10-30')
    expect(dagTerug('2026-10-17', 0)).toBe('2026-10-17')
  })
})

describe('foutenPerDag', () => {
  it('geeft elke dag, ook zonder fouten, van oud naar nieuw', () => {
    const dagen = foutenPerDag([], '2026-10-17', 3)
    expect(dagen.map((d) => d.dag)).toEqual(['2026-10-15', '2026-10-16', '2026-10-17'])
    expect(dagen.every((d) => d.totaal === 0)).toBe(true)
  })

  it('telt per dag en per gebied op en negeert dagen buiten het venster', () => {
    const dagen = foutenPerDag(
      [
        { dag: '2026-10-17', gebied: 'club', aantal: 3 },
        { dag: '2026-10-17', gebied: 'leden', aantal: 2 },
        { dag: '2026-10-16', gebied: 'aiyourgym', aantal: 1 },
        { dag: '2026-09-01', gebied: 'club', aantal: 50 },
      ],
      '2026-10-17',
      2,
    )
    expect(dagen[1]).toEqual({ dag: '2026-10-17', totaal: 5, perGebied: { club: 3, leden: 2, aiyourgym: 0 } })
    expect(dagen[0].totaal).toBe(1)
  })
})

describe('leesbareGrootte en opslagProcent', () => {
  it('maakt bytes leesbaar', () => {
    expect(leesbareGrootte(512)).toBe('512 B')
    expect(leesbareGrootte(33_754_259)).toBe('32,2 MB')
    expect(leesbareGrootte(-1)).toBe('Onbekend')
  })

  it('rekent het deel van de gratis opslag uit', () => {
    expect(opslagProcent(GRATIS_DB_BYTES / 4)).toBe(25)
    expect(opslagProcent(GRATIS_DB_BYTES * 2)).toBe(100)
    expect(opslagProcent(0)).toBe(0)
  })
})

describe('statusAntwoord', () => {
  it('200 met ok als de database antwoordt, anders 503', () => {
    expect(statusAntwoord('ok')).toEqual({ body: { ok: true, db: 'ok' }, status: 200 })
    expect(statusAntwoord('fout')).toEqual({ body: { ok: false, db: 'fout' }, status: 503 })
    expect(statusAntwoord('traag').status).toBe(503)
  })

  it('dbStandUit: verlopen gaat voor fout', () => {
    expect(dbStandUit({ fout: true, verlopen: true })).toBe('traag')
    expect(dbStandUit({ fout: true, verlopen: false })).toBe('fout')
    expect(dbStandUit({ fout: false, verlopen: false })).toBe('ok')
  })
})
