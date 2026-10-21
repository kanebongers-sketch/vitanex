import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ONDERDELEN, isActief } from '@/components/club/shell/onderdelen'
import { ARTIKELEN, filterArtikelen, kaalPad, normaliseer, zichtbareArtikelen } from './artikelen'

const APP = join(process.cwd(), 'src', 'app', '(hoofd)')

/** Bestaat er een page.tsx voor dit pad onder src/app? */
function paginaBestaat(pad: string): boolean {
  return existsSync(join(APP, ...kaalPad(pad).split('/').filter(Boolean), 'page.tsx'))
}

describe('ARTIKELEN', () => {
  it('unieke sleutels en een bestaand onderdeel', () => {
    const sleutels = ARTIKELEN.map((a) => a.sleutel)
    expect(new Set(sleutels).size).toBe(sleutels.length)
    for (const a of ARTIKELEN) {
      if (a.onderdeel !== null) expect(ONDERDELEN.some((o) => o.sleutel === a.onderdeel), a.sleutel).toBe(true)
    }
  })

  it('elke link wijst naar een bestaande pagina van een onderdeel', () => {
    for (const a of ARTIKELEN) {
      expect(a.links.length, a.sleutel).toBeGreaterThan(0)
      for (const l of a.links) {
        expect(l.pad.startsWith('/clubkane'), l.pad).toBe(true)
        expect(paginaBestaat(l.pad), `${a.sleutel}: ${l.pad}`).toBe(true)
        expect(ONDERDELEN.some((o) => isActief(o, kaalPad(l.pad))), `${a.sleutel}: ${l.pad}`).toBe(true)
      }
    }
  })

  it('kort en concreet: 3 tot 6 stappen', () => {
    for (const a of ARTIKELEN) {
      expect(a.stappen.length, a.sleutel).toBeGreaterThanOrEqual(3)
      expect(a.stappen.length, a.sleutel).toBeLessThanOrEqual(6)
    }
  })

  it('schrijfstijl: geen gedachtestreepjes en geen klemtoon-accenten', () => {
    const tekst = JSON.stringify(ARTIKELEN)
    expect(tekst).not.toMatch(/[–—]/)
    expect(tekst).not.toMatch(/\s-\s/)
    expect(tekst).not.toMatch(/[éèëáàíóú]/i)
  })
})

describe('filterArtikelen', () => {
  it('leeg zoeken geeft alles', () => {
    expect(filterArtikelen(ARTIKELEN, '  ')).toHaveLength(ARTIKELEN.length)
  })
  it('vindt op titel, stappen en trefwoorden, elk woord moet passen', () => {
    expect(filterArtikelen(ARTIKELEN, 'wachtlijst').map((a) => a.sleutel)).toContain('rooster')
    expect(filterArtikelen(ARTIKELEN, 'CSV salaris').map((a) => a.sleutel)).toEqual(['personeel'])
    expect(filterArtikelen(ARTIKELEN, 'xyzonzin')).toEqual([])
  })
  it('accenten maken niet uit', () => {
    expect(normaliseer('Caloriëen')).toBe('calorieen')
    expect(filterArtikelen(ARTIKELEN, 'caloriëen').map((a) => a.sleutel)).toEqual(['voeding'])
  })
})

describe('zichtbareArtikelen', () => {
  it('Kane of de eigenaar ziet alles', () => {
    expect(zichtbareArtikelen([], null)).toHaveLength(ARTIKELEN.length)
  })
  it('een uitgezet onderdeel verdwijnt', () => {
    expect(zichtbareArtikelen(['checkin'], null).some((a) => a.sleutel === 'checkin')).toBe(false)
  })
  it('een clubmanager ziet alleen zijn onderdelen, en alleen links die hij mag openen', () => {
    const lijst = zichtbareArtikelen([], ['vandaag', 'rooster'])
    expect(lijst.map((a) => a.sleutel)).toEqual(['eerste-stappen', 'rooster'])
    const rooster = lijst.find((a) => a.sleutel === 'rooster')
    expect(rooster?.links.map((l) => l.pad)).toEqual(['/clubkane/rooster'])
    expect(ARTIKELEN.find((a) => a.sleutel === 'rooster')?.links.length).toBe(3)
  })
})
