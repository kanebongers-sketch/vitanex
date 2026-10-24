import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ONDERDELEN, actiefOnderdeel, groepenMet, inMenu, menuOnderdeel, onderdelenVan } from '@/components/club/shell/onderdelen'
import { HULPBALK, hulpItemOp } from '@/components/club/shell/hulpbalk-items'
import { ONDERDEEL_SLEUTELS } from './org-instellingen'
import { NOOIT_VOOR_CLUBMANAGER } from '@/lib/club/beheerders/rechten'
import { INSTEL_GROEPEN, INSTEL_PAGINAS, heeftInstellingen, instelHref, kaalInstelPad, zichtbareInstelPaginas, type InstelKijker } from './instel-paginas'

const APP = join(process.cwd(), 'src', 'app', '(aiyourgym)', '(club)', 'club')
const ALLES: InstelKijker = { uit: [], toegestaan: null, medewerker: false, betalenAan: true, lidgeldAan: true }

describe('INSTEL_PAGINAS', () => {
  it('elk ding een naam en een plek: unieke ids, titels en paden', () => {
    const uniek = (l: string[]) => new Set(l).size === l.length
    expect(uniek(INSTEL_PAGINAS.map((p) => p.id))).toBe(true)
    expect(uniek(INSTEL_PAGINAS.map((p) => p.titel))).toBe(true)
    expect(uniek(INSTEL_PAGINAS.map((p) => p.pad))).toBe(true)
  })

  it('elk pad bestaat en hoort bij het onderdeel van de rechten', () => {
    for (const p of INSTEL_PAGINAS) {
      const kaal = kaalInstelPad(p.pad)
      expect(existsSync(join(APP, ...kaal.split('/').filter(Boolean), 'page.tsx')), p.id).toBe(true)
      expect((ONDERDEEL_SLEUTELS as readonly string[]).includes(p.sleutel), p.id).toBe(true)
      expect(actiefOnderdeel(`/club${kaal}`).sleutel, p.id).toBe(p.sleutel)
    }
  })

  it('elke groep heeft regels', () => {
    for (const g of INSTEL_GROEPEN) expect(INSTEL_PAGINAS.some((p) => p.groep === g.sleutel), g.sleutel).toBe(true)
  })

  it('elk onderdeel buiten het menu is te vinden in het instellingencentrum of in de hulpbalk', () => {
    for (const o of ONDERDELEN.filter((x) => !inMenu(x))) {
      const ergens = INSTEL_PAGINAS.some((p) => p.sleutel === o.sleutel) || HULPBALK.some((i) => i.onderdeel === o.sleutel)
      expect(ergens, o.sleutel).toBe(true)
    }
  })

  it('niets dubbel: geen instel-pagina naar een pad uit de hulpbalk', () => {
    const hulpPaden = HULPBALK.map((i) => i.pad)
    for (const p of INSTEL_PAGINAS) expect(hulpPaden, p.id).not.toContain(kaalInstelPad(p.pad))
  })

  it('schrijfstijl: geen gedachtestreepjes en geen klemtoon-accenten', () => {
    const tekst = JSON.stringify([INSTEL_PAGINAS, INSTEL_GROEPEN])
    expect(tekst).not.toMatch(/[–—]/)
    expect(tekst).not.toMatch(/\s-\s/)
    expect(tekst).not.toMatch(/[éèáàíóú]/i)
  })
})

describe('zichtbareInstelPaginas', () => {
  it('Kane en de eigenaar zien alles wat aan staat', () => {
    expect(zichtbareInstelPaginas(ALLES)).toHaveLength(INSTEL_PAGINAS.length)
    expect(zichtbareInstelPaginas({ ...ALLES, betalenAan: false }).some((p) => p.id === 'betalen')).toBe(false)
    // Kortingen en acties alleen met lidgeld aan (CLUB_LIDGELD_ACTIEF).
    expect(zichtbareInstelPaginas({ ...ALLES, lidgeldAan: false }).some((p) => p.id === 'kortingen')).toBe(false)
    expect(zichtbareInstelPaginas(ALLES).some((p) => p.id === 'kortingen')).toBe(true)
    expect(zichtbareInstelPaginas({ ...ALLES, uit: ['rooster'] }).some((p) => p.id === 'weekrooster')).toBe(false)
  })

  it('een clubmanager ziet alleen wat zijn rechten zeggen, nooit iets van de eigenaar', () => {
    const k: InstelKijker = { ...ALLES, toegestaan: ['vandaag', 'instellingen', 'afspraken'] }
    const ids = zichtbareInstelPaginas(k).map((p) => p.id)
    expect(ids).toEqual(['vestigingen', 'regels', 'zalen', 'medewerkers', 'lestypen', 'weekrooster', 'afspraaktypen'])
    for (const p of zichtbareInstelPaginas(k)) {
      expect(p.alleenEigenaar).toBeFalsy()
      expect(NOOIT_VOOR_CLUBMANAGER.has(p.sleutel)).toBe(false)
    }
  })

  it('een medewerker beheert geen vestigingen, ook niet met het recht', () => {
    const ids = zichtbareInstelPaginas({ ...ALLES, toegestaan: ['vandaag', 'instellingen'], medewerker: true }).map((p) => p.id)
    expect(ids).not.toContain('vestigingen')
    expect(ids).toContain('medewerkers')
  })

  it('zonder enig instelrecht geen instellingencentrum', () => {
    expect(heeftInstellingen({ ...ALLES, toegestaan: ['vandaag', 'leden', 'rooster'] })).toBe(false)
    expect(heeftInstellingen({ ...ALLES, toegestaan: ['vandaag', 'instellingen'] })).toBe(true)
  })
})

describe('instelHref', () => {
  it('vestiging alleen waar de pagina per vestiging werkt, met behoud van ?tab en #anker', () => {
    expect(instelHref({ pad: '/instellingen/zalen', perVestiging: true }, 'budel')).toBe('/club/instellingen/zalen?v=budel')
    expect(instelHref({ pad: '/training?tab=oefeningen', perVestiging: true }, 'budel')).toBe('/club/training?tab=oefeningen&v=budel')
    expect(instelHref({ pad: '/huisstijl#adres-kop' }, 'budel')).toBe('/club/huisstijl#adres-kop')
    expect(instelHref({ pad: '/instellingen/regels', perVestiging: true }, null)).toBe('/club/instellingen/regels')
  })
})

describe('menu', () => {
  it('Beheer in het menu: alleen Cijfers en Rapporten (Instellingen en Hulp staan in de hulpbalk)', () => {
    expect(onderdelenVan('beheer').map((o) => o.label)).toEqual(['Cijfers', 'Rapporten'])
  })

  it('geen instel-pagina in de menubalk', () => {
    const inBalk = groepenMet().flatMap((g) => onderdelenVan(g.sleutel)).map((o) => o.sleutel)
    for (const s of ['huisstijl', 'bedrijf', 'sluiting', 'lidmaatschappen', 'start', 'instellingen', 'app', 'beheer', 'hulp']) expect(inBalk).not.toContain(s)
    expect(new Set(inBalk).size).toBe(inBalk.length)
  })

  it('zonder Cijfers en Rapporten geen groep Beheer', () => {
    expect(onderdelenVan('beheer', [], ['vandaag', 'cijfers']).map((o) => o.sleutel)).toEqual(['cijfers'])
    expect(groepenMet([], ['vandaag', 'leden']).map((g) => g.sleutel)).not.toContain('beheer')
  })

  it('een instel-pagina licht geen groep op maar Instellingen in de hulpbalk', () => {
    for (const pad of ['/club/instellingen/zalen', '/club/huisstijl', '/club/beheer/sluiting', '/club/beheer', '/club/start']) {
      expect(menuOnderdeel(pad), pad).toBeNull()
      expect(hulpItemOp(pad), pad).toBe('instellingen')
    }
    expect(menuOnderdeel('/club/rooster')?.sleutel).toBe('rooster')
    expect(hulpItemOp('/club/rooster')).toBeNull()
  })
})
