import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { AVATAR_NAMEN, avatarVan, initialenVan, voornaamSleutel } from './avatars'
import { COACHES } from './voorbeeld'

const MAP = path.resolve(__dirname, '../../../../public/aiyourgym/avatars')

interface Bron {
  bestand: string
  voorbeeldpersoon: string
  bron: string
  fotograaf: string
  licentie: string
  gedownload: string
}

const BRONNEN = JSON.parse(readFileSync(path.join(MAP, 'BRONNEN.json'), 'utf8')) as { fotos: Bron[] }

describe('profielfoto’s van de voorbeeldmensen', () => {
  it('heeft voor elke naam een 1x- en 2x-bestand', () => {
    for (const naam of AVATAR_NAMEN) {
      expect(existsSync(path.join(MAP, `${naam}.webp`)), naam).toBe(true)
      expect(existsSync(path.join(MAP, `${naam}@2x.webp`)), naam).toBe(true)
    }
  })

  it('heeft geen losse bestanden zonder naam in de lijst', () => {
    const bestanden = readdirSync(MAP).filter((f) => f.endsWith('.webp'))
    const namen = new Set(bestanden.map((f) => f.replace(/(@2x)?\.webp$/, '')))
    expect([...namen].sort()).toEqual([...AVATAR_NAMEN].sort())
  })

  it('legt per foto bron, fotograaf en een vrije licentie vast (Unsplash of Pexels)', () => {
    const vastgelegd = BRONNEN.fotos.map((f) => f.bestand).sort()
    expect(vastgelegd).toEqual([...AVATAR_NAMEN].sort())
    for (const f of BRONNEN.fotos) {
      expect(['Unsplash License', 'Pexels License']).toContain(f.licentie)
      expect(f.bron).toMatch(f.licentie === 'Unsplash License' ? /^https:\/\/unsplash\.com\/photos\// : /^https:\/\/www\.pexels\.com\/photo\//)
      expect(f.bron).not.toMatch(/plus\.unsplash\.com/)
      expect(f.fotograaf.length).toBeGreaterThan(0)
      expect(f.voorbeeldpersoon.length).toBeGreaterThan(0)
      expect(f.gedownload).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('geeft de coaches en de vaste voorbeeldleden een foto', () => {
    const mensen = [...COACHES.map((c) => c.naam), 'Sanne Bakker', 'Ravi Janssen', 'Lotte Smit', 'Noah Peters']
    for (const naam of mensen) expect(avatarVan(naam), naam).not.toBeNull()
  })

  it('valt terug op initialen zonder foto', () => {
    expect(avatarVan('Open dienst')).toBeNull()
    expect(initialenVan('Sanne Bakker')).toBe('SB')
    expect(initialenVan('Mo de Vries')).toBe('MV')
    expect(initialenVan('Daan')).toBe('D')
  })

  it('maakt de sleutel van de voornaam, zonder accenten', () => {
    expect(voornaamSleutel('  Noor Bos ')).toBe('noor')
    expect(voornaamSleutel('Éva')).toBe('eva')
    expect(avatarVan('Sanne Bakker')).toEqual({ src: '/aiyourgym/avatars/sanne.webp', src2x: '/aiyourgym/avatars/sanne@2x.webp' })
  })
})
