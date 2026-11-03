import fs from 'node:fs'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { MENU } from '@/lib/aiyourgym/taal/woorden/club/menu'
import { KOP_HULP, clubHref, initialen, kijkerSleutel, kopHulpInTaal, kopHulpOp } from './kop-hulp'
import { menuOnderdeel } from './onderdelen'

// Hulp en Wat is nieuw rechtsboven (ontwerp "Club in 10 minuten"): de
// hulpbalk onderaan is weg, een navigatie in plaats van twee.

const APP = path.join(process.cwd(), 'src', 'app', '(aiyourgym)', '(club)', 'club')

describe('KOP_HULP', () => {
  it('Hulp en Wat is nieuw, elk pad bestaat', () => {
    expect(KOP_HULP.map((i) => i.label)).toEqual(['Hulp', 'Wat is nieuw'])
    for (const i of KOP_HULP) expect(existsSync(path.join(APP, ...i.pad.split('/').filter(Boolean), 'page.tsx')), i.pad).toBe(true)
    expect(kopHulpInTaal(KOP_HULP[1], 'en').label).toBe("What's new")
  })

  it('schrijfstijl: geen gedachtestreepjes, geen klemtoon-accenten, geen andere systemen', () => {
    const tekst = JSON.stringify([KOP_HULP, MENU.nl.plekken, MENU.en.plekken, MENU.nl.naamMenu, MENU.en.naamMenu, MENU.nl.nieuw.kortUitleg, MENU.en.nieuw.kortUitleg])
    expect(tekst).not.toMatch(/[–—]|\s-\s/)
    expect(tekst).not.toMatch(/[éèáàíóúë]/i)
    expect(tekst).not.toMatch(/virtuagym|sportivity|marketplace/i)
  })
})

describe('waar je bent', () => {
  it('Hulp en Wat is nieuw lichten het vraagteken op en geen plek', () => {
    for (const [pad, sleutel] of [['/club/hulp', 'hulp'], ['/club/hulp/meldingen', 'hulp'], ['/club/nieuw', 'nieuw']] as const) {
      expect(kopHulpOp(pad), pad).toBe(sleutel)
      expect(menuOnderdeel(pad), pad).toBeNull()
    }
    expect(kopHulpOp('/club/leden')).toBeNull()
    expect(kopHulpOp('/club')).toBeNull()
  })
})

describe('geen hulpbalk meer', () => {
  it('de layout zet geen balk onderaan, het naam-menu heeft de links van het master account', () => {
    const layout = fs.readFileSync(path.join(APP, 'layout.tsx'), 'utf8')
    expect(layout).not.toMatch(/Hulpbalk/)
    const paneel = fs.readFileSync(path.join(__dirname, 'MenuPaneel.tsx'), 'utf8')
    for (const pad of ['/club/platform', '/club/systeem', '/club/hulp/meldingen']) expect(paneel).toContain(pad)
  })

  it('Hulp toont bovenaan Wat is nieuw', () => {
    expect(fs.readFileSync(path.join(APP, 'hulp', 'page.tsx'), 'utf8')).toContain('<NieuwKort')
  })
})

describe('links en wie er kijkt', () => {
  it('links nemen de vestiging mee, ook met een zoekstring', () => {
    expect(clubHref('/nieuw', 'budel')).toBe('/club/nieuw?v=budel')
    expect(clubHref('/nieuw', null)).toBe('/club/nieuw')
    expect(clubHref('/beheer?categorie=team', 'budel')).toBe('/club/beheer?categorie=team&v=budel')
  })

  it('wat je zag bij Wat is nieuw, telt per sportschool en per persoon', () => {
    expect(kijkerSleutel({ userId: 'org', persoonId: 'p1', beheerderId: 'kane' })).toBe('org:p1')
    expect(kijkerSleutel({ userId: 'org', persoonId: null, beheerderId: 'kane' })).toBe('org:kane')
  })

  it('initialen voor het rondje rechtsboven', () => {
    expect(initialen('Kane Bongers')).toBe('KB')
    expect(initialen('kane')).toBe('K')
    expect(initialen('Anna de Vries')).toBe('AV')
    expect(initialen('  ')).toBe('?')
  })
})
