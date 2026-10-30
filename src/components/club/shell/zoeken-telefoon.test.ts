import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { OPEN_ZOEKEN, openClubZoeken } from './ClubZoeken'

// Zoeken op telefoon en tablet: het menupaneel (Meer) opent hetzelfde venster als Ctrl K.

describe('zoeken op de telefoon', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('openClubZoeken stuurt het event waar het zoekvenster op luistert', () => {
    const doel = new EventTarget()
    vi.stubGlobal('window', doel)
    const gehoord = vi.fn()
    doel.addEventListener(OPEN_ZOEKEN, gehoord)
    openClubZoeken()
    expect(gehoord).toHaveBeenCalledTimes(1)
  })

  it('het menupaneel heeft een zoekknop die het venster opent, met tekst in NL en EN', () => {
    const bron = fs.readFileSync(path.join(__dirname, 'MenuPaneel.tsx'), 'utf8')
    expect(bron).toContain('openClubZoeken()')
    expect(bron).toContain('club-menu-zoek')
    for (const taal of ['nl', 'en'] as const) {
      expect(MENU[taal].zoeken.knop.length).toBeGreaterThan(0)
      expect(MENU[taal].zoeken.knopLeden.length).toBeGreaterThan(0)
    }
  })

  it('het vergrootglas in de kop krimpt op de telefoon nooit weg', () => {
    const css = fs.readFileSync(path.join(__dirname, 'navigatie.css'), 'utf8')
    expect(css).toMatch(/\.club-balk-rechts \.club-zoekknop \{ flex: none; \}/)
  })
})
