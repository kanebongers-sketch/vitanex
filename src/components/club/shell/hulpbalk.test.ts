import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RECHTEN } from '@/lib/club/kern/medewerker'
import type { InstelKijker } from '@/lib/club/kern/instel-paginas'
import { heeftInstellingen } from '@/lib/club/kern/instel-paginas'
import { HULPBALK, clubHref, hulpbalkVoor, hulpItemOp, hulpItems, hulpToets, kijkerSleutel } from './hulpbalk'
import { menuOnderdeel, onderdeelVoorToets } from './onderdelen'

// De hulpbalk onderaan (idee Kane 23-10-2026): vijf items, elk met een eigen
// plek, binnen de rechten van de persoon.

const APP = join(process.cwd(), 'src', 'app', '(aiyourgym)', '(club)', 'club')
const ALLES: InstelKijker = { uit: [], toegestaan: null, medewerker: false, betalenAan: false }
const TRAINER: InstelKijker = { ...ALLES, toegestaan: ['vandaag', ...RECHTEN.trainer], medewerker: true }

describe('HULPBALK', () => {
  it('vijf items in vaste volgorde, elk pad bestaat', () => {
    expect(HULPBALK.map((i) => i.label)).toEqual(['Instellingen', 'Koppelingen', 'Ledenapp', 'Wat is nieuw', 'Hulp'])
    for (const i of HULPBALK) expect(existsSync(join(APP, ...i.pad.split('/').filter(Boolean), 'page.tsx')), i.pad).toBe(true)
  })

  it('schrijfstijl: geen gedachtestreepjes, geen klemtoon-accenten, geen andere systemen', () => {
    const tekst = JSON.stringify(HULPBALK)
    expect(tekst).not.toMatch(/[–—]|\s-\s/)
    expect(tekst).not.toMatch(/[éèáàíóú]/i)
    expect(tekst).not.toMatch(/virtuagym|sportivity|marketplace/i)
  })
})

describe('hulpbalkVoor', () => {
  it('Kane en de eigenaar zien alles', () => {
    expect(hulpbalkVoor(ALLES, true)).toEqual(['instellingen', 'koppelingen', 'ledenapp', 'nieuw', 'hulp'])
  })

  it('een trainer zonder instelrechten: geen Instellingen, wel Wat is nieuw en Hulp', () => {
    const balk = hulpbalkVoor(TRAINER, heeftInstellingen(TRAINER))
    expect(balk).not.toContain('instellingen')
    expect(balk).toEqual(expect.arrayContaining(['nieuw', 'hulp']))
  })

  it('een clubmanager met alleen Vandaag: alleen Wat is nieuw en Hulp', () => {
    expect(hulpbalkVoor({ ...ALLES, toegestaan: ['vandaag'] }, false)).toEqual(['nieuw', 'hulp'])
  })

  it('ledenapp uit: geen Ledenapp', () => {
    expect(hulpbalkVoor({ ...ALLES, uit: ['app'] }, true)).not.toContain('ledenapp')
  })

  it('hulpItems houdt de vaste volgorde aan', () => {
    expect(hulpItems(['hulp', 'instellingen']).map((i) => i.sleutel)).toEqual(['instellingen', 'hulp'])
  })
})

describe('waar je bent', () => {
  it('elk item licht op zijn eigen pagina op, en dan licht geen groep op', () => {
    const gevallen: [string, string][] = [
      ['/club/beheer', 'instellingen'],
      ['/club/beheer/betalen', 'instellingen'],
      ['/club/huisstijl', 'instellingen'],
      ['/club/koppelingen', 'koppelingen'],
      ['/club/app', 'ledenapp'],
      ['/club/nieuw', 'nieuw'],
      ['/club/hulp', 'hulp'],
      ['/club/hulp/meldingen', 'hulp'],
    ]
    for (const [pad, sleutel] of gevallen) {
      expect(hulpItemOp(pad), pad).toBe(sleutel)
      expect(menuOnderdeel(pad), pad).toBeNull()
    }
  })

  it('gewone onderdelen en onbekende paden horen niet bij de hulpbalk', () => {
    expect(hulpItemOp('/club/leden/abc')).toBeNull()
    expect(hulpItemOp('/club')).toBeNull()
    expect(hulpItemOp('/club/platform')).toBeNull()
    expect(menuOnderdeel('/club/platform')).toBeNull()
    expect(menuOnderdeel('/club')?.sleutel).toBe('vandaag')
  })
})

describe('sneltoetsen en links', () => {
  it('G I en G H werken nog, binnen de rechten', () => {
    expect(onderdeelVoorToets('i', [], null)?.pad).toBe('/beheer')
    expect(onderdeelVoorToets('h', [], ['vandaag'], false)?.pad).toBe('/hulp')
    expect(onderdeelVoorToets('i', [], ['vandaag'], false)).toBeNull()
    expect(hulpToets(HULPBALK[0])).toBe('G I')
    expect(hulpToets(HULPBALK[3])).toBeNull()
  })

  it('links nemen de vestiging mee', () => {
    expect(clubHref('/koppelingen', 'budel')).toBe('/club/koppelingen?v=budel')
    expect(clubHref('/nieuw', null)).toBe('/club/nieuw')
  })

  it('wat je zag bij Wat is nieuw, telt per sportschool en per persoon', () => {
    expect(kijkerSleutel({ userId: 'org', persoonId: 'p1', beheerderId: 'kane' })).toBe('org:p1')
    expect(kijkerSleutel({ userId: 'org', persoonId: null, beheerderId: 'kane' })).toBe('org:kane')
  })
})
