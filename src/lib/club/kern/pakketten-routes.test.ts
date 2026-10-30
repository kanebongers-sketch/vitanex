// Bewaker van de losse pakketten (besluit Kane 29-10-2026, "enorm belangrijk"):
//   1. Elke pagina en elke API van een pakket geeft een 404 zonder dat pakket.
//   2. Elk pakket alleen (kern plus een pakket) heeft geen dode links: niet in
//      het menu, het zoekveld, de hulpbalk, de secties van Vandaag, het
//      instellingencentrum, de hulpartikelen, de ledenkaart of de ledenapp.
//   3. De kern alleen werkt ook, en alles afgenomen is precies zoals voor 29-10.
// De verwachting per pagina (VERWACHT) staat hier los van de code, zodat een
// nieuwe pagina zonder slot opvalt.

import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  ALLE_PAKKETTEN, API_PAKKET, LID_API_PAKKET, MODULE_PAKKET, ONDERDEEL_PAKKET, apiAfgenomen, apiPakket, ledenappTabAfgenomen,
  leesAfgenomen, onderdeelPakket, verborgenVoor, wizardStapNodig, zichtbaar, type PakketSleutel, type Verborgen,
} from './pakketten'
import { MODULES, moduleAan, organisatieUitRij } from './organisatie'
import { ONDERDEEL_SLEUTELS, orgInstellingenUitRij } from './org-instellingen'
import { INSTEL_PAGINAS, instelPagina, zichtbareInstelPaginas, type InstelKijker } from './instel-paginas'
import { ONDERDELEN, groepenMet, onderbalkOnderdelen, onderdelenVan, sectiesVoor } from '@/components/club/shell/onderdelen'
import { zoekItems } from '@/components/club/shell/zoeken'
import { HULPBALK, hulpbalkVoor } from '@/components/club/shell/hulpbalk-items'
import { zichtbareArtikelen } from '@/lib/club/hulp/artikelen'
import { kaartRechten, zichtbareLidTabs } from '@/lib/club/leden/hub/rechten'
import { tabsUitVoor } from '@/lib/club/ledenlogin/tabs'
import { LEDENAPP_TABBLADEN } from '@/lib/club/ledenlogin/contract'
import { stappenStand, STAPPEN, NIEUWE_START, type StartFeiten } from '@/lib/club/start/stappen'

const ROOT = path.resolve(__dirname, '../../../..')
const CLUB = path.join(ROOT, 'src/app/(aiyourgym)/(club)/club')
const API = path.join(ROOT, 'src/app/(aiyourgym)/api/club')

/** Welk pakket een pagina binnen /club nodig heeft; wat hier niet staat is kern. */
const VERWACHT: readonly [RegExp, PakketSleutel][] = [
  [/^\/checkin(\/|$)/, 'administratie'],
  [/^\/cijfers(\/|$)/, 'administratie'],
  [/^\/rapporten(\/|$)/, 'administratie'],
  [/^\/beheer\/lidmaatschappen(\/|$)/, 'administratie'],
  [/^\/beheer\/checkin(\/|$)/, 'administratie'],
  [/^\/rooster(\/|$)/, 'lessen'],
  [/^\/beheer\/widget(\/|$)/, 'lessen'],
  [/^\/instellingen\/(lestypen|weekrooster|zalen)(\/|$)/, 'lessen'],
  [/^\/training(\/|$)/, 'training'],
  [/^\/voeding(\/|$)/, 'training'],
  [/^\/beheer\/intake(\/|$)/, 'training'],
  [/^\/afspraken(\/|$)/, 'afspraken'],
  [/^\/personeel(\/|$)/, 'team'],
  [/^\/taken(\/|$)/, 'team'],
  [/^\/leads(\/|$)/, 'groei'],
  [/^\/opvolgen(\/|$)/, 'groei'],
  [/^\/challenges(\/|$)/, 'groei'],
  [/^\/community(\/|$)/, 'groei'],
  [/^\/berichten(\/|$)/, 'groei'],
  [/^\/beheer\/automatiseringen(\/|$)/, 'groei'],
]

function nodigVoorPad(pad: string): PakketSleutel | null {
  const kaal = pad.replace(/^\/club/, '').split(/[?#]/)[0] || '/'
  return VERWACHT.find(([r]) => r.test(kaal))?.[1] ?? null
}

/** Een link uit het menu of zoekveld: een pad binnen /club, of een sectie op Vandaag (#anker). */
function nodigVoorLink(pad: string): PakketSleutel | null {
  if (pad.startsWith('#')) {
    const o = ONDERDELEN.find((x) => x.sectie === pad.slice(1))
    return o ? onderdeelPakket(o.sleutel) : null
  }
  return nodigVoorPad(pad)
}

function bestanden(dir: string, naam: string): string[] {
  const uit: string[] = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) uit.push(...bestanden(p, naam))
    else if (e.name === naam) uit.push(p)
  }
  return uit
}

const CONSTANTEN: Record<string, string> = { LIDGELD_ONDERDEEL: 'lidmaatschappen' }

/** De pakketten die de sloten van een pagina (en de layouts erboven) afdwingen. */
function afgedwongen(pagina: string): Set<PakketSleutel> {
  const uit = new Set<PakketSleutel>()
  let dir = path.dirname(pagina)
  const bronnen = [fs.readFileSync(pagina, 'utf8')]
  while (dir.startsWith(CLUB)) {
    const layout = path.join(dir, 'layout.tsx')
    if (fs.existsSync(layout)) bronnen.push(fs.readFileSync(layout, 'utf8'))
    dir = path.dirname(dir)
  }
  const bron = bronnen.join('\n')
  const voeg = (p: PakketSleutel | null | undefined) => p && uit.add(p)
  for (const m of bron.matchAll(/eisModule\('(\w+)'\)/g)) voeg(MODULE_PAKKET[m[1] as keyof typeof MODULE_PAKKET])
  for (const m of bron.matchAll(/eisOnderdeel\((?:'(\w+)'|(\w+))\)/g)) voeg(onderdeelPakket(m[1] ?? CONSTANTEN[m[2]] ?? ''))
  for (const m of bron.matchAll(/eisPakket\('(\w+)'\)/g)) voeg(m[1] as PakketSleutel)
  // Instel-pagina's via InstellingenOnderdeel: de module van die pagina (instelModuleAan).
  for (const m of bron.matchAll(/<InstellingenOnderdeel onderdeel="(\w+)"/g)) {
    const p = instelPagina(m[1])
    voeg(p?.module ? MODULE_PAKKET[p.module] : null)
  }
  return uit
}

function clubPad(pagina: string): string {
  const rel = path.relative(CLUB, path.dirname(pagina)).split(path.sep).join('/')
  return rel ? `/${rel}` : '/'
}

function apiPad(route: string): string {
  const rel = path.relative(API, path.dirname(route)).split(path.sep).join('/')
  return `/api/club/${rel}`.replace(/\[([^\]]+)\]/g, '$1')
}

const zonder = (p: PakketSleutel) => ALLE_PAKKETTEN.filter((x) => x !== p)
const kijker = (uit: readonly Verborgen[]): InstelKijker => ({ uit, toegestaan: null, medewerker: false, betalenAan: false, lidgeldAan: false })

describe('de indeling is compleet', () => {
  it('elk onderdeel heeft een plek (kern of pakket)', () => {
    for (const s of ONDERDEEL_SLEUTELS) expect(Object.keys(ONDERDEEL_PAKKET), s).toContain(s)
    for (const o of ONDERDELEN) expect(Object.keys(ONDERDEEL_PAKKET), o.sleutel).toContain(o.sleutel)
    for (const m of MODULES) expect(Object.keys(MODULE_PAKKET), m).toContain(m)
  })
  it('een onderdeel met een schakelaar hoort bij hetzelfde pakket als die schakelaar', () => {
    for (const o of ONDERDELEN) {
      if (!o.module || MODULE_PAKKET[o.module] === null) continue
      expect(onderdeelPakket(o.sleutel), o.sleutel).toBe(MODULE_PAKKET[o.module])
    }
  })
  it('elke API-map van Club heeft een plek; een nieuwe map moet erin', () => {
    const mappen = fs.readdirSync(API, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
    for (const m of mappen) expect(Object.keys(API_PAKKET), `api/club/${m}`).toContain(m)
  })
  it('de kern zit altijd erbij: leden, ledenapp, vestigingen, team, huisstijl, instellingen, hulp', () => {
    for (const s of ['vandaag', 'leden', 'app', 'huisstijl', 'instellingen', 'hulp', 'beheer', 'start']) expect(onderdeelPakket(s), s).toBeNull()
    expect(MODULE_PAKKET.leden).toBeNull()
    expect(MODULE_PAKKET.app).toBeNull()
  })
})

describe('elke route van een pakket bestaat niet zonder dat pakket', () => {
  const paginas = bestanden(CLUB, 'page.tsx')

  it('er zijn pagina\'s gevonden', () => {
    expect(paginas.length).toBeGreaterThan(40)
  })

  for (const pagina of paginas) {
    const pad = clubPad(pagina)
    const nodig = nodigVoorPad(pad)
    it(`/club${pad === '/' ? '' : pad}: ${nodig ?? 'kern'}`, () => {
      const slot = afgedwongen(pagina)
      if (nodig) expect([...slot], `geen slot op ${nodig}`).toContain(nodig)
      // Een kernpagina mag nooit aan een pakket hangen (anders werkt de kern alleen niet).
      else expect([...slot], 'kernpagina met pakketslot').toEqual([])
    })
  }

  const routes = bestanden(API, 'route.ts')
  const SLOTEN = /vereisClubToegang|vereisBeheerdersBeheer|vereisPlatformEigenaar|vereisLidToegang|vereisLidVoeding|vereisLidHealth|vereisCommunityLid|vereisCommunityBeheer|vereisLidgeldBeheer|vereisBetalenBeheer|vereisLidAi|vereisHulpToegang/
  for (const route of routes) {
    const pad = apiPad(route)
    const p = apiPakket(pad)
    if (!p) continue
    it(`${pad}: 404 zonder ${p}`, () => {
      // Het slot loopt via vereisClubToegang of vereisLidToegang, die apiAfgenomen controleren.
      expect(fs.readFileSync(route, 'utf8')).toMatch(SLOTEN)
      expect(apiAfgenomen(zonder(p), pad)).toBe(false)
      expect(apiAfgenomen([p], pad)).toBe(true)
      expect(apiAfgenomen(ALLE_PAKKETTEN, pad)).toBe(true)
    })
  }

  it('de leden-API per deel: lessen, afspraken, schema en community', () => {
    expect(apiPakket('/api/club/lid/reserveringen/abc/annuleren')).toBe('lessen')
    expect(apiPakket('/api/club/lid/afspraken/sloten')).toBe('afspraken')
    expect(apiPakket('/api/club/lid/training/x')).toBe('training')
    expect(apiPakket('/api/club/lid/voeding')).toBe('training')
    expect(apiPakket('/api/club/lid/community/gezien')).toBe('groei')
    expect(apiPakket('/api/club/lid/checkin-code')).toBe('administratie')
    for (const kern of ['ik', 'inloggen', 'push', 'meldingen', 'logo', 'betalen']) expect(apiPakket(`/api/club/lid/${kern}`), kern).toBeNull()
    expect(Object.values(LID_API_PAKKET).every((p) => ALLE_PAKKETTEN.includes(p))).toBe(true)
  })
  it('delen van een kernmap die bij een pakket horen', () => {
    expect(apiPakket('/api/club/instellingen/lestypen')).toBe('lessen')
    expect(apiPakket('/api/club/instellingen/zalen')).toBeNull()
    expect(apiPakket('/api/club/instellingen/medewerkers/x')).toBeNull()
    expect(apiPakket('/api/club/betalen/plannen/x')).toBe('administratie')
  })
})

/** Alles wat een eigenaar ziet met deze pakketten: menu, zoeken, hulpbalk, Vandaag, instellingen en hulp. */
function alleLinks(uit: readonly Verborgen[]): string[] {
  const k = kijker(uit)
  const menu = groepenMet(uit).flatMap((g) => onderdelenVan(g.sleutel, uit)).map((o) => o.pad)
  const onder = onderbalkOnderdelen(uit).map((o) => o.pad)
  const secties = sectiesVoor(uit).map((o) => `#${o.sectie}`)
  const zoeken = zoekItems(k, true).map((i) => i.pad)
  const hulpbalk = hulpbalkVoor(k, true).map((s) => HULPBALK.find((h) => h.sleutel === s)?.pad ?? '')
  const instel = zichtbareInstelPaginas(k).map((p) => p.pad)
  const artikelen = zichtbareArtikelen(uit, null).flatMap((a) => a.links.map((l) => l.pad))
  return [...menu, ...onder, ...secties, ...zoeken, ...hulpbalk, ...instel, ...artikelen]
}

const FEITEN: StartFeiten = { heeftLogo: true, heeftAdres: true, vestigingen: 1, vestigingenMetAdres: 1, vestigingenIngericht: 1, lestypen: 0, vasteLessen: 0, medewerkers: 1, leden: 1, uit: [] }

describe('elk pakket alleen (kern plus een pakket) heeft geen dode links', () => {
  for (const p of ALLE_PAKKETTEN) {
    describe(p, () => {
      const uit = verborgenVoor([], [p])
      const mag = (nodig: PakketSleutel | null) => nodig === null || nodig === p

      it('menu, zoekveld, hulpbalk, Vandaag, instellingen en hulp linken alleen naar wat er is', () => {
        const links = alleLinks(uit)
        expect(links.length).toBeGreaterThan(5)
        for (const l of links) expect(mag(nodigVoorLink(l)), `dode link ${l}`).toBe(true)
      })
      it('het pakket zelf is te vinden in het menu of het zoekveld', () => {
        const eigen = alleLinks(uit).filter((l) => nodigVoorLink(l) === p)
        expect(eigen.length, `niets van ${p} te vinden`).toBeGreaterThan(0)
      })
      it('de ledenkaart toont alleen blokken en tabbladen van dit pakket en de kern', () => {
        const r = kaartRechten({ onderdelen: null, modulesUit: uit, healthAan: true, lidgeldOpen: false })
        const blok: [boolean, PakketSleutel][] = [
          [r.training, 'training'], [r.voeding, 'training'], [r.apps, 'training'], [r.rooster, 'lessen'], [r.afspraken, 'afspraken'],
          [r.checkin, 'administratie'], [r.challenges, 'groei'], [r.berichten, 'groei'], [r.lidmaatschap, 'administratie'],
        ]
        for (const [aan, nodig] of blok) if (aan) expect(nodig).toBe(p)
        const tabs = zichtbareLidTabs(r)
        expect(tabs).toEqual(expect.arrayContaining(['overzicht', 'contact', 'privacy']))
        if (tabs.includes('training')) expect(p).toBe('training')
        if (tabs.includes('lidmaatschap')) expect(p).toBe('administratie')
        if (tabs.includes('planning')) expect(['lessen', 'afspraken']).toContain(p)
      })
      it('de ledenapp toont alleen tabbladen waarvan de API er is', () => {
        const org = { uit, instellingen: orgInstellingenUitRij({}, ONDERDEEL_SLEUTELS) }
        const zichtbareTabs = LEDENAPP_TABBLADEN.filter((t) => !tabsUitVoor(org).includes(t))
        expect(zichtbareTabs).toEqual(expect.arrayContaining(['home', 'profiel']))
        for (const tab of zichtbareTabs) expect(ledenappTabAfgenomen([p], tab), tab).toBe(true)
        if (zichtbareTabs.includes('lessen')) expect(apiAfgenomen([p], '/api/club/lid/reserveringen')).toBe(true)
        if (zichtbareTabs.includes('afspraken')) expect(apiAfgenomen([p], '/api/club/lid/afspraken')).toBe(true)
        if (zichtbareTabs.includes('schema')) expect(apiAfgenomen([p], '/api/club/lid/training')).toBe(true)
      })
      it('de startwizard heeft alleen de stappen van de kern en dit pakket, en kan af', () => {
        const stand = stappenStand({ ...NIEUWE_START, soort: 'gym', klaar: ['huisstijl', 'onderdelen'], bevestigd: ['geen_vaste_lessen'], afgerondOp: '2026-10-29T10:00:00Z' }, { ...FEITEN, uit }, 'nl', [p])
        const lessen = stand.find((s) => s.sleutel === 'lessen')
        expect(lessen?.nodig).toBe(p === 'lessen')
        // Zonder Groepslessen telt de stap Lessen niet mee; afronden kan dan zonder lestypen.
        if (p !== 'lessen') expect(stand.find((s) => s.sleutel === 'klaar')?.af).toBe(true)
        expect(stand).toHaveLength(STAPPEN.length)
      })
    })
  }
})

describe('de kern alleen en alles afgenomen', () => {
  it('kern alleen: geen enkele link naar een pakket', () => {
    const uit = verborgenVoor([], [])
    for (const l of alleLinks(uit)) expect(nodigVoorLink(l), l).toBeNull()
    expect(wizardStapNodig([], 'lessen')).toBe(false)
  })
  it('alles afgenomen en niets uit: precies zoals voor de pakketten (geen markers, niets verborgen)', () => {
    expect(verborgenVoor([], ALLE_PAKKETTEN)).toEqual([])
    const uit: Verborgen[] = []
    for (const o of ONDERDELEN) expect(zichtbaar(uit, o), o.sleutel).toBe(true)
    for (const p of INSTEL_PAGINAS) expect(zichtbareInstelPaginas(kijker(uit)).some((x) => x.id === p.id) || Boolean(p.betalen || p.lidgeld || p.rollenV2 === 'alleen'), p.id).toBe(true)
  })
  it('de eigen keuze (uit) en het afnemen werken samen: zichtbaar = afgenomen EN aan', () => {
    // Afgenomen maar zelf uitgezet: weg.
    expect(moduleAan({ uit: verborgenVoor(['rooster'], ALLE_PAKKETTEN) }, 'rooster')).toBe(false)
    // Aan maar niet afgenomen: weg.
    expect(moduleAan({ uit: verborgenVoor([], ['groei']) }, 'rooster')).toBe(false)
    // Afgenomen en aan: zichtbaar.
    expect(moduleAan({ uit: verborgenVoor([], ['lessen']) }, 'rooster')).toBe(true)
  })
})

describe('de organisatie uit de database', () => {
  const basis = { id: 'de000000-0000-4000-8000-0000000000c1', naam: 'Voorbeeld', modules: { leads: false } }
  it('zonder kolom (oude rij): alles afgenomen, alleen de eigen keuze verborgen', () => {
    const o = organisatieUitRij(basis)
    expect(o?.afgenomen).toEqual([...ALLE_PAKKETTEN])
    expect(o?.eigenUit).toEqual(['leads'])
    expect(o?.uit).toEqual(['leads'])
  })
  it('met losse pakketten: de rest is verborgen, de eigen keuze blijft apart bewaard', () => {
    const o = organisatieUitRij({ ...basis, pakketten: ['lessen', 'onzin'] })
    expect(o?.afgenomen).toEqual(['lessen'])
    expect(o?.eigenUit).toEqual(['leads'])
    expect(o?.uit).toContain('pakket:groei')
    expect(o?.uit).toContain('checkin')
    expect(o?.uit).not.toContain('rooster')
    expect(o && moduleAan(o, 'rooster')).toBe(true)
  })
  it('een lege lijst is alleen de kern', () => {
    expect(leesAfgenomen([])).toEqual([])
    expect(leesAfgenomen(null)).toEqual([...ALLE_PAKKETTEN])
  })
})
