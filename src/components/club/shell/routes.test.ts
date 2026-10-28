// Bewaker: elke link in Club en de ledenapp wijst naar een pagina die echt bestaat.
// Leest de routemappen onder src/app/(aiyourgym)/(club) en legt daar naast:
// het menu (ONDERDELEN plus hun schermen), de hulpbalk, het instellingencentrum
// en elke letterlijke '/club/...' of '/mijn/...' in de broncode van Club.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { ONDERDELEN } from './onderdelen'
import { HULPBALK } from './hulpbalk-items'
import { INSTEL_PAGINAS } from '@/lib/club/kern/instel-paginas'

const ROOT = path.resolve(__dirname, '../../../..')
const APP = path.join(ROOT, 'src/app/(aiyourgym)/(club)')
const BRONNEN = ['src/components/club', 'src/lib/club', 'src/app/(aiyourgym)/(club)']
const WILDCARD = '*'

/** Alle routes als lijst segmenten, bijvoorbeeld ['club', 'leden', '[id]']. */
function routes(): string[][] {
  const uit: string[][] = []
  const loop = (dir: string, segs: string[]) => {
    const items = fs.readdirSync(dir, { withFileTypes: true })
    if (items.some((e) => e.isFile() && /^(page|route)\.tsx?$/.test(e.name))) uit.push(segs)
    for (const e of items) {
      if (!e.isDirectory()) continue
      const groep = /^\(.*\)$/.test(e.name)
      loop(path.join(dir, e.name), groep ? segs : [...segs, e.name])
    }
  }
  loop(APP, [])
  return uit
}

const ROUTES = routes()

function segmentPast(link: string, route: string): boolean {
  if (link === WILDCARD) return true
  if (/^\[\[?\.\.\./.test(route)) return true
  if (/^\[.+\]$/.test(route)) return true
  return link === route
}

/** Bestaat er een pagina voor dit pad (zonder query of anker)? */
function bestaat(pad: string): boolean {
  const kaal = pad.split(/[?#]/)[0].replace(/\/+$/, '')
  const segs = kaal.split('/').filter(Boolean)
  return ROUTES.some((r) => {
    const vangt = r.length > 0 && /^\[\[?\.\.\./.test(r[r.length - 1])
    if (vangt ? segs.length < r.length - 1 : segs.length !== r.length) return false
    return segs.every((s, i) => i >= r.length || segmentPast(s, r[i]))
  })
}

const clubPad = (pad: string) => `/club${pad}`

function bronbestanden(): string[] {
  const uit: string[] = []
  const loop = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) loop(p)
      else if (/\.tsx?$/.test(e.name) && !/\.(test|spec)\.tsx?$/.test(e.name)) uit.push(p)
    }
  }
  for (const m of BRONNEN) loop(path.join(ROOT, m))
  return uit
}

const LETTERLIJK = /(['"`])(\/(?:club|mijn)(?:\/[^'"`\s?#]*)?)/g

/** Letterlijke links in de broncode; `${...}` telt als een willekeurig segment. */
function letterlijkeLinks(): { bestand: string; pad: string }[] {
  const uit: { bestand: string; pad: string }[] = []
  for (const p of bronbestanden()) {
    const tekst = fs.readFileSync(p, 'utf8')
    for (const m of tekst.matchAll(LETTERLIJK)) {
      const ruw = m[2].replace(/\$\{[^}]*\}/g, WILDCARD)
      // Bestanden in public/ (oefenbeelden) zijn geen pagina.
      if (/\.[a-z0-9]{2,4}$/i.test(ruw)) continue
      const pad = ruw.split('/').map((s) => (s.includes(WILDCARD) ? WILDCARD : s)).join('/')
      uit.push({ bestand: path.relative(ROOT, p).split(path.sep).join('/'), pad })
    }
  }
  return uit
}

describe('routes van Club en de ledenapp', () => {
  it('de routelezer kent vaste en dynamische routes', () => {
    expect(bestaat('/club')).toBe(true)
    expect(bestaat('/club/leden/abc')).toBe(true)
    expect(bestaat('/club/leden/*')).toBe(true)
    expect(bestaat('/mijn/start/xyz')).toBe(true)
    expect(bestaat('/club/bestaat-niet')).toBe(false)
    expect(bestaat('/club/leden/abc/extra')).toBe(false)
  })

  it('elk onderdeel van het menu en elk scherm erachter heeft een pagina', () => {
    const fout = ONDERDELEN.flatMap((o) => [o.pad, ...(o.schermen ?? []).map((s) => s.pad)])
      .filter((p) => !p.startsWith('#'))
      .map(clubPad)
      .filter((p) => !bestaat(p))
    expect(fout).toEqual([])
  })

  it('elk item van de hulpbalk heeft een pagina', () => {
    expect(HULPBALK.map((i) => clubPad(i.pad)).filter((p) => !bestaat(p))).toEqual([])
  })

  it('elke pagina van het instellingencentrum bestaat', () => {
    expect(INSTEL_PAGINAS.map((p) => clubPad(p.pad)).filter((p) => !bestaat(p))).toEqual([])
  })

  it('elke letterlijke /club- of /mijn-link in de code wijst naar een bestaande pagina', () => {
    const links = letterlijkeLinks()
    expect(links.length).toBeGreaterThan(50)
    const fout = links.filter((l) => !bestaat(l.pad)).map((l) => `${l.bestand}: ${l.pad}`)
    expect(fout).toEqual([])
  })
})

describe('rechten op de pagina passen bij het menu', () => {
  const CLUB = path.join(APP, 'club')
  const sleutels = new Set(ONDERDELEN.map((o) => o.sleutel))
  const eisen = bronbestanden()
    .filter((p) => p.startsWith(CLUB) && /(page|layout)\.tsx$/.test(p))
    .flatMap((p) => [...fs.readFileSync(p, 'utf8').matchAll(/eisOnderdeel\('([a-z_]+)'\)/g)].map((m) => ({ bestand: path.relative(CLUB, p).split(path.sep).join('/'), sleutel: m[1] })))

  it('elke eisOnderdeel noemt een onderdeel dat bestaat (anders is de pagina dicht voor elke rol met rechten)', () => {
    expect(eisen.length).toBeGreaterThan(20)
    expect(eisen.filter((e) => !sleutels.has(e.sleutel)).map((e) => `${e.bestand}: ${e.sleutel}`)).toEqual([])
  })

  it('de layout van een menumap eist het onderdeel van die map', () => {
    const fout = eisen
      .filter((e) => /^[a-z]+\/layout\.tsx$/.test(e.bestand))
      .flatMap((e) => {
        const map = `/${e.bestand.split('/')[0]}`
        const verwacht = ONDERDELEN.find((o) => o.pad === map && !o.sectie)
        return verwacht && verwacht.sleutel !== e.sleutel ? [`${e.bestand}: ${e.sleutel}, verwacht ${verwacht.sleutel}`] : []
      })
    expect(fout).toEqual([])
  })
})
