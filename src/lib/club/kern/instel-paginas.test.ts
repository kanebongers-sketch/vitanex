import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ONDERDELEN, actiefOnderdeel, inMenu } from '@/components/club/shell/onderdelen'
import { ONDERDEEL_SLEUTELS } from './org-instellingen'
import { NOOIT_VOOR_CLUBMANAGER } from '@/lib/club/beheerders/rechten'
import { INSTEL_GROEPEN, INSTEL_LOSSE_LINKS, INSTEL_PAGINAS, KOPPELINGEN_PAD, heeftInstellingen, instelLosseLinks, instelCategorieHref, instelGroepUitleg, instelHref, instelIndeling, instelPagina, isInstelGroep, kaalInstelPad, zichtbareInstelPaginas, type InstelKijker } from './instel-paginas'

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

  it('niets dubbel: geen instel-pagina naar Koppelingen (een losse link), Hulp of de Ledenapp (Leden · Ledenapp)', () => {
    for (const p of INSTEL_PAGINAS) expect([KOPPELINGEN_PAD, '/hulp', '/nieuw', '/app'], p.id).not.toContain(kaalInstelPad(p.pad))
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
    // Zonder rollen v2 alles behalve Team; met v2 alles behalve Beheerders (dat wordt Team).
    expect(zichtbareInstelPaginas(ALLES)).toHaveLength(INSTEL_PAGINAS.filter((p) => p.rollenV2 !== 'alleen').length)
    expect(zichtbareInstelPaginas({ ...ALLES, rollenV2: true })).toHaveLength(INSTEL_PAGINAS.filter((p) => p.rollenV2 !== 'niet').length)
    expect(zichtbareInstelPaginas({ ...ALLES, betalenAan: false }).some((p) => p.id === 'betalen')).toBe(false)
    // Kortingen en acties alleen met lidgeld aan (CLUB_LIDGELD_ACTIEF).
    expect(zichtbareInstelPaginas({ ...ALLES, lidgeldAan: false }).some((p) => p.id === 'kortingen')).toBe(false)
    expect(zichtbareInstelPaginas(ALLES).some((p) => p.id === 'kortingen')).toBe(true)
    expect(zichtbareInstelPaginas({ ...ALLES, uit: ['rooster'] }).some((p) => p.id === 'weekrooster')).toBe(false)
  })

  it('een clubmanager ziet alleen wat zijn rechten zeggen, nooit iets van de eigenaar', () => {
    const k: InstelKijker = { ...ALLES, toegestaan: ['vandaag', 'instellingen', 'afspraken'] }
    const ids = zichtbareInstelPaginas(k).map((p) => p.id)
    expect(ids).toEqual(['vestigingen', 'regels', 'medewerkers', 'lestypen', 'weekrooster', 'zalen', 'afspraaktypen'])
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

describe('instelIndeling (besluit Kane 29-10-2026: overzichtelijker)', () => {
  /** Waar een pagina in het centrum staat: als regel of als kleine link, per categorie. */
  const plekken = (k: InstelKijker) =>
    instelIndeling(k).flatMap((c) => c.rijen.flatMap((r) => [{ id: r.pagina.id, cat: c.sleutel }, ...r.kinderen.map((l) => ({ id: l.id, cat: c.sleutel }))]))

  it('zes tot acht categorieen, elk met een naam en een uitleg in beide talen', () => {
    expect(INSTEL_GROEPEN.length).toBeGreaterThanOrEqual(6)
    expect(INSTEL_GROEPEN.length).toBeLessThanOrEqual(8)
    for (const g of INSTEL_GROEPEN) {
      expect(instelGroepUitleg(g.sleutel, 'nl'), g.sleutel).not.toBe('')
      expect(instelGroepUitleg(g.sleutel, 'en'), g.sleutel).not.toBe('')
    }
  })

  it('elke instel-pagina staat in precies een categorie en is daar bereikbaar (behalve de startwizard: een losse link)', () => {
    for (const pagina of INSTEL_PAGINAS) {
      // Pagina's van het rollenmodel v2 staan er alleen met v2 aan.
      const hier = plekken(pagina.rollenV2 === 'alleen' ? { ...ALLES, rollenV2: true } : ALLES).filter((x) => x.id === pagina.id)
      if (pagina.losseLink) {
        expect(hier, pagina.id).toEqual([])
        continue
      }
      expect(hier, pagina.id).toEqual([{ id: pagina.id, cat: pagina.groep }])
    }
    expect(INSTEL_PAGINAS.filter((x) => x.losseLink).map((x) => x.id)).toEqual(['start'])
  })

  it('onder, onderAnders en ookNaar wijzen naar een bestaande pagina; onder blijft in dezelfde categorie', () => {
    for (const p of INSTEL_PAGINAS) {
      for (const ouder of [p.onder, p.onderAnders]) {
        if (!ouder) continue
        expect(instelPagina(ouder)?.groep, p.id).toBe(p.groep)
        expect(instelPagina(ouder)?.onder, `${p.id}: niet dubbel genest`).toBeUndefined()
      }
      if (p.ookNaar) expect(instelPagina(p.ookNaar), p.id).toBeDefined()
    }
  })

  it('minder losse regels: hoogstens vijf regels per categorie', () => {
    for (const c of instelIndeling(ALLES)) expect(c.rijen.length, c.sleutel).toBeLessThanOrEqual(5)
  })

  it('mag iemand de hoofdpagina niet zien, dan wordt een kleine link een eigen regel', () => {
    // Sluitingsdagen hoort onder Regels; met alleen het recht Sluiting is het een eigen regel.
    const k: InstelKijker = { ...ALLES, toegestaan: ['vandaag', 'sluiting'] }
    expect(plekken(k)).toEqual([{ id: 'sluiting', cat: 'vestigingen' }])
    expect(instelIndeling(k)[0].rijen[0].links).toEqual([])
  })

  it('een clubmanager ziet alleen wat de eigenaar aanzet, nooit Abonnement of Rechten', () => {
    const k: InstelKijker = { ...ALLES, toegestaan: ['vandaag', 'instellingen', 'huisstijl'] }
    const ids = plekken(k).map((x) => x.id)
    for (const id of ids) expect(zichtbareInstelPaginas(k).some((p) => p.id === id), id).toBe(true)
    expect(ids).toContain('onderdelen')
    expect(ids).not.toContain('abonnement')
    expect(ids).not.toContain('rechten')
    // Pakketten en onderdelen linkt alleen naar Abonnement als iemand dat mag zien.
    const pakketten = instelIndeling(k).flatMap((c) => c.rijen).find((r) => r.pagina.id === 'onderdelen')
    expect(pakketten?.links).toEqual([])
    const eigenaar = instelIndeling(ALLES).flatMap((c) => c.rijen).find((r) => r.pagina.id === 'onderdelen')
    expect(eigenaar?.links.map((l) => l.id)).toEqual(['abonnement'])
  })

  it('wat een sportschool niet afneemt of uit heeft gezet staat er niet; een lege categorie valt weg', () => {
    const zonderRooster = instelIndeling({ ...ALLES, uit: ['rooster'] })
    expect(zonderRooster.map((c) => c.sleutel)).not.toContain('groepslessen')
    expect(plekken({ ...ALLES, uit: ['rooster'] }).map((x) => x.id)).not.toContain('widget')
  })

  it('?categorie= in de url: alleen bestaande categorieen, met de vestiging erbij', () => {
    expect(isInstelGroep('coaching')).toBe(true)
    expect(isInstelGroep('onzin')).toBe(false)
    expect(isInstelGroep(undefined)).toBe(false)
    expect(instelCategorieHref('coaching', 'budel')).toBe('/club/beheer?categorie=coaching&v=budel')
    expect(instelCategorieHref('team', null)).toBe('/club/beheer?categorie=team')
  })
})

describe('Medewerkers en losse links (ontwerp 03-11-2026)', () => {
  const rijIds = (k: InstelKijker) => instelIndeling(k).flatMap((c) => c.rijen.map((r) => r.pagina.id))
  const kinderenVan = (k: InstelKijker, id: string) => instelIndeling(k).flatMap((c) => c.rijen).find((r) => r.pagina.id === id)?.kinderen.map((p) => p.id)

  it('Medewerkers is nooit een eigen regel naast Team of Rechten: met v2 onder Team, zonder v2 onder Rechten', () => {
    expect(rijIds({ ...ALLES, rollenV2: true })).not.toContain('medewerkers')
    expect(kinderenVan({ ...ALLES, rollenV2: true, eigenaar: true }, 'team')).toEqual(['medewerkers'])
    expect(rijIds(ALLES)).not.toContain('medewerkers')
    expect(kinderenVan(ALLES, 'rechten')).toEqual(['medewerkers'])
  })

  it('zonder Team en Rechten blijft Medewerkers bereikbaar als eigen regel', () => {
    expect(rijIds({ ...ALLES, toegestaan: ['vandaag', 'instellingen'] })).toContain('medewerkers')
  })

  it('Koppelingen staat als losse link bovenaan, naast de Startwizard, alleen met minstens een koppeling', () => {
    expect(INSTEL_LOSSE_LINKS).toEqual(['start', 'koppelingen'])
    expect(instelLosseLinks({ ...ALLES, rollenV2: true, eigenaar: true }, true)).toEqual(['start', 'koppelingen'])
    expect(instelLosseLinks({ ...ALLES, rollenV2: true, eigenaar: true }, false)).toEqual(['start'])
    // Een clubmanager ziet de startwizard niet, wel Koppelingen als hij er een mag zien.
    expect(instelLosseLinks({ ...ALLES, toegestaan: ['vandaag', 'instellingen'], rollenV2: true }, true)).toEqual(['koppelingen'])
    expect(existsSync(join(APP, 'koppelingen', 'page.tsx'))).toBe(true)
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
  it('geen losse instel-pagina in het menu: instellen gebeurt alleen in Beheer · Instellingen (het centrum zelf)', () => {
    const inBalk = ONDERDELEN.filter((o) => inMenu(o) && !o.sectie).map((o) => o.sleutel)
    for (const s of ['huisstijl', 'bedrijf', 'sluiting', 'lidmaatschappen', 'start', 'instellingen']) expect(inBalk).not.toContain(s)
  })
})
