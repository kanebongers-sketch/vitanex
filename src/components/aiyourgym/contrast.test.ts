import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrast, huisstijlVariabelen, THEMAS } from '@/lib/club/kern/huisstijl'
import { STALEN } from './mockups/stalen'

// Bewaakt het contrast van de verkoopwebsite (WCAG 2.2 AA): normale tekst minstens
// 4.5:1, grote tekst (sierletters, grote nummers) en UI-randen minstens 3:1.
// De kleuren komen rechtstreeks uit de css-bestanden, dus een nieuwe tokenwaarde
// die te licht of te donker is laat deze test falen. Een doorzichtige kleur of een
// color-mix rekenen we eerst uit tegen de achtergrond eronder.

const WORTEL = path.resolve(__dirname, '../../..')
const lees = (bestand: string) => readFileSync(path.join(WORTEL, bestand), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const SITE_CSS = 'src/app/(aiyourgym)/(website)/aiyourgym/aiyourgym.css'
const MOCKUP_CSS = 'src/components/aiyourgym/mockups/mockups.css'
const ALLE_CSS = [
  SITE_CSS,
  MOCKUP_CSS,
  'src/components/aiyourgym/mockups/product/productschermen.css',
  'src/components/aiyourgym/home/home.css',
  'src/components/aiyourgym/home/hoofdpunten.css',
  'src/components/aiyourgym/dag/dag.css',
  'src/components/aiyourgym/schemas/schemas.css',
  'src/components/aiyourgym/demo/demo.css',
  'src/components/aiyourgym/aanmelden/aanmelden.css',
  'src/components/aiyourgym/demo-aanvraag/demo-aanvraag.css',
]

/** De custom properties in het eerste blok met precies deze selector. */
function tokens(bestand: string, selector: string): Record<string, string> {
  const css = lees(bestand)
  const start = css.search(new RegExp(`(^|\\n)${selector.replace('.', '\\.')}\\s*\\{`))
  if (start === -1) throw new Error(`${selector} niet gevonden in ${bestand}`)
  const blok = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries([...blok.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

type Rgba = [number, number, number, number]

function kleur(waarde: string): Rgba {
  const hex = waarde.match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = Number.parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
  }
  const rgba = waarde.match(/^rgba?\(([^)]+)\)$/)
  if (rgba) {
    const [r, g, b, a = 1] = rgba[1].split(/[\s,/]+/).filter(Boolean).map(Number)
    return [r, g, b, a]
  }
  throw new Error(`Onbekende kleur: ${waarde}`)
}

/** Een kleur over een achtergrond gelegd (alfa uitgerekend), als hex. */
function over(voor: Rgba, onder: Rgba): string {
  const a = voor[3]
  const kanaal = (i: number) => Math.round(voor[i] * a + onder[i] * (1 - a)).toString(16).padStart(2, '0')
  return `#${kanaal(0)}${kanaal(1)}${kanaal(2)}`
}

/** color-mix(in srgb, a p%, b): het deel p van a. */
function meng(a: string, b: string, deel: number): string {
  return over([...kleur(a).slice(0, 3), deel] as Rgba, kleur(b))
}

const NORMAAL = 4.5
const GROOT = 3

/** De tokens van de donkere versie: het .ayg-blok binnen @media (prefers-color-scheme: dark). */
function donkereTokens(bestand: string): Record<string, string> {
  const css = lees(bestand)
  const media = css.indexOf('@media (prefers-color-scheme: dark)')
  if (media === -1) throw new Error(`Geen donkere versie in ${bestand}`)
  const start = css.indexOf('.ayg {', media)
  const blok = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries([...blok.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]))
}

const LICHT = tokens(SITE_CSS, '.ayg')
const DONKER = { ...LICHT, ...donkereTokens(SITE_CSS) }
const PALETTEN = [
  { naam: 'licht', S: LICHT },
  { naam: 'donker', S: DONKER },
] as const

interface Paar {
  waar: string
  tekst: string
  op: string
  min: number
}

const LICHT_VLAKKEN = ['ayg-bg', 'ayg-vlak', 'ayg-vlak-2'] as const
const DONKER_VLAKKEN = ['ayg-inkt', 'ayg-inkt-2'] as const
const procent = (w: string) => Number.parseFloat(w) / 100
const P = tokens(SITE_CSS, '.ayg-podium')

/** Hoe dekkend het lichte vlak van de kop (gescrold) en van de vaste knop onderin is; gecontroleerd tegen de css hieronder. */
const KOP_DEKKING = 0.96
const PLAK_DEKKING = 0.97

/**
 * De kop, de contactbalk, het menupaneel en de vaste knop onderin (licht met racegroen,
 * besluit Kane 23-10-2026). De kop en de vaste knop zijn half doorzichtig: we rekenen
 * met het slechtste geval eronder, het donkere podium en de lichte inkttekst.
 */
function kopParen(t: (token: string) => string): Paar[] {
  const onder = [t('ayg-inkt'), t('ayg-inkt-tekst')]
  const doorzichtig = (dekking: number, plek: string) =>
    onder.flatMap((o) => {
      const vlak = meng(t('ayg-vlak'), o, dekking)
      return [
        { waar: `${plek} over ${o}: tekst`, tekst: t('ayg-tekst'), op: vlak, min: NORMAAL },
        { waar: `${plek} over ${o}: menulinks (tekst-2)`, tekst: t('ayg-tekst-2'), op: vlak, min: NORMAAL },
        { waar: `${plek} over ${o}: flessengroene streep onder de huidige pagina`, tekst: t('ayg-accent-sterk'), op: vlak, min: GROOT },
        { waar: `${plek} over ${o}: rand van de randknop`, tekst: t('ayg-lijn-sterk'), op: vlak, min: GROOT },
      ]
    })
  return [
    { waar: 'contactbalk: tekst op de salietint', tekst: t('ayg-tekst'), op: t('ayg-balk'), min: NORMAAL },
    { waar: 'contactbalk: flessengroene iconen en streep op de salietint', tekst: t('ayg-accent-sterk'), op: t('ayg-balk'), min: NORMAAL },
    { waar: 'contactbalk: de tint is te onderscheiden van het papier eronder', tekst: t('ayg-balk'), op: t('ayg-bg'), min: 1.05 },
    { waar: 'menuknop: inkt op het creme vlak', tekst: t('ayg-tekst'), op: t('ayg-vlak'), min: NORMAAL },
    { waar: 'menupaneel: flessengroene lijn bovenaan', tekst: t('ayg-accent-sterk'), op: t('ayg-vlak'), min: GROOT },
    ...doorzichtig(KOP_DEKKING, 'kop gescrold'),
    ...doorzichtig(PLAK_DEKKING, 'vaste knop onderin'),
  ]
}

interface PaletParen {
  site: Paar[]
  hoofdstuk: Paar[]
  podium: Paar[]
}

/** Alle paren van een palet (licht of donker), met de naam van het palet ervoor. */
function paletParen(naam: string, S: Record<string, string>): PaletParen {
  const t = (token: string) => {
    const waarde = S[token]
    if (!waarde) throw new Error(`Token --${token} bestaat niet`)
    return waarde
  }
  const site: Paar[] = [
    ...LICHT_VLAKKEN.flatMap((v) => [
      { waar: `tekst op ${v}`, tekst: t('ayg-tekst'), op: t(v), min: NORMAAL },
      { waar: `bijschriften, labels en placeholder op ${v}`, tekst: t('ayg-tekst-2'), op: t(v), min: NORMAAL },
      { waar: `grote sierletters en nummers op ${v}`, tekst: t('ayg-tekst-spook'), op: t(v), min: GROOT },
      { waar: `randen van invoervelden en randknoppen op ${v}`, tekst: t('ayg-lijn-sterk'), op: t(v), min: GROOT },
      { waar: `foutmelding op ${v}`, tekst: t('ayg-fout'), op: t(v), min: NORMAAL },
      { waar: `beschikbaar-melding op ${v}`, tekst: t('ayg-ok'), op: t(v), min: NORMAAL },
      { waar: `flessengroen als tekst en icoon op het papier (accent-sterk) op ${v}`, tekst: t('ayg-accent-sterk'), op: t(v), min: NORMAAL },
      { waar: `flessengroen als lijn (menu, labelstreep) op ${v}`, tekst: t('ayg-accent-sterk'), op: t(v), min: GROOT },
      { waar: `accentknop, vinkje en badge afgetekend tegen ${v}`, tekst: t('ayg-accent'), op: t(v), min: GROOT },
    ]),
    ...DONKER_VLAKKEN.flatMap((v) => [
      { waar: `tekst op ${v}`, tekst: t('ayg-inkt-tekst'), op: t(v), min: NORMAAL },
      { waar: `bijschriften op ${v}`, tekst: t('ayg-inkt-tekst-2'), op: t(v), min: NORMAAL },
      { waar: `grote sierletters op ${v}`, tekst: t('ayg-inkt-spook'), op: t(v), min: GROOT },
      { waar: `licht accent (salie) als tekst en icoon op ${v}`, tekst: t('ayg-accent-licht'), op: t(v), min: NORMAAL },
      { waar: `lichte accentknop met inkt erop op ${v}`, tekst: t('ayg-inkt'), op: t('ayg-accent-licht'), min: NORMAAL },
    ]),
    { waar: 'tekst op de accentknop, badges, chips en vinkjes', tekst: t('ayg-accent-tekst'), op: t('ayg-accent'), min: NORMAAL },
    { waar: 'tekst op het zachte salievlak (markering)', tekst: t('ayg-tekst'), op: t('ayg-accent-zacht'), min: NORMAAL },
    { waar: 'saliekleurige speelknop en focusrand op de bedieningsbalk (86% inkt over het oefenbeeld)', tekst: t('ayg-accent-licht'), op: meng('#111614', '#e9f3f7', 0.86), min: GROOT },
    { waar: 'inkt op de saliekleurige speelknop', tekst: t('ayg-inkt'), op: t('ayg-accent-licht'), min: NORMAAL },
    { waar: 'tekst op de inktknop', tekst: t('ayg-bg'), op: t('ayg-tekst'), min: NORMAAL },
    { waar: 'gekozen thema in de huisstijl-demo', tekst: t('ayg-inkt'), op: t('ayg-inkt-tekst'), min: NORMAAL },
    { waar: 'foutmelding in het meldingvlak (10% fout)', tekst: t('ayg-fout'), op: meng(t('ayg-fout'), t('ayg-vlak'), 0.1), min: NORMAAL },
    { waar: 'bijschrift op het diepere papier onder in de held', tekst: t('ayg-tekst-2'), op: t('ayg-held-vlak'), min: NORMAAL },
    { waar: 'tekst op het diepere papier onder in de held', tekst: t('ayg-tekst'), op: t('ayg-held-vlak'), min: NORMAAL },
    { waar: 'bijschrift op de flessengroene plek van de aanmeldband', tekst: t('ayg-inkt-tekst-2'), op: meng(t('ayg-inkt-2'), t('ayg-inkt'), procent(t('ayg-gloed-band'))), min: NORMAAL },
    { waar: 'uitgeschakelde accentknop (85%)', tekst: meng(t('ayg-accent-tekst'), t('ayg-vlak'), 0.85), op: meng(t('ayg-accent'), t('ayg-vlak'), 0.85), min: NORMAAL },
    { waar: 'uitgeschakelde inktknop (85%)', tekst: meng(t('ayg-bg'), t('ayg-vlak'), 0.85), op: meng(t('ayg-tekst'), t('ayg-vlak'), 0.85), min: NORMAAL },
    { waar: 'accent als tekst op het papier (de markering in de donkere versie)', tekst: t('ayg-accent'), op: t('ayg-bg'), min: naam === 'donker' ? NORMAAL : 1 },
    { waar: 'focusrand (inkt) tegen het papier', tekst: t('ayg-tekst'), op: t('ayg-bg'), min: GROOT },
    { waar: 'focusrand op een accentknop: inkten rand tegen de halo', tekst: t('ayg-tekst'), op: meng(t('ayg-focus'), t('ayg-bg'), 0.75), min: GROOT },
    { waar: 'lichte knop op het podium met racegroen erop', tekst: t('ayg-inkt'), op: t('ayg-inkt-tekst'), min: NORMAAL },
    ...kopParen(t),
  ]
  // Elk hoofdstuk van de functies heeft een eigen accent: altijd inkt erop (het
  // label) en leesbaar als tekst of lijn op het racegroene podium.
  const hoofdstuk: Paar[] = Object.keys(S)
    .filter((k) => k.startsWith('ayg-h-') && k !== 'ayg-h-tekst')
    .flatMap((k) => [
      { waar: `inkt op het hoofdstukaccent ${k}`, tekst: t('ayg-h-tekst'), op: t(k), min: NORMAAL },
      { waar: `hoofdstukaccent ${k} als tekst op het podium`, tekst: t(k), op: t('ayg-inkt'), min: NORMAAL },
      { waar: `hoofdstukaccent ${k} als lijn op het papier (sier, het label draagt de naam)`, tekst: t(k), op: t('ayg-bg'), min: naam === 'donker' ? GROOT : 1.4 },
    ])
  // Op een donker podium worden de tekstkleuren omgezet; een gewone inktknop wordt daar licht.
  const podiumToken = (token: string) => t((P[token] ?? '').replace(/^var\(--|\)$/g, ''))
  const podium: Paar[] = [
    { waar: 'podium: koppen en tekst (--ayg-tekst) op inkt', tekst: podiumToken('ayg-tekst'), op: t('ayg-inkt'), min: NORMAAL },
    { waar: 'podium: koppen en tekst (--ayg-tekst) op inkt-2', tekst: podiumToken('ayg-tekst'), op: t('ayg-inkt-2'), min: NORMAAL },
    { waar: 'podium: bijschriften (--ayg-tekst-2) op inkt', tekst: podiumToken('ayg-tekst-2'), op: t('ayg-inkt'), min: NORMAAL },
    { waar: 'podium: lichte knop (inkt op --ayg-tekst)', tekst: t('ayg-inkt'), op: podiumToken('ayg-tekst'), min: NORMAAL },
    { waar: 'podium: accentknop (racegroen op salie)', tekst: podiumToken('ayg-accent-tekst'), op: podiumToken('ayg-accent'), min: NORMAAL },
    { waar: 'podium: accentknop afgetekend tegen het podium', tekst: podiumToken('ayg-accent'), op: t('ayg-inkt'), min: GROOT },
    { waar: 'podium: invoerveld (tekst op inkt-2)', tekst: podiumToken('ayg-tekst'), op: t('ayg-inkt-2'), min: NORMAAL },
    { waar: 'podium: rand van een invoerveld', tekst: t('ayg-inkt-tekst-2'), op: t('ayg-inkt-2'), min: GROOT },
    { waar: 'podium: accent als tekst en lijn (--ayg-accent-sterk) op inkt', tekst: podiumToken('ayg-accent-sterk'), op: t('ayg-inkt'), min: NORMAAL },
    { waar: 'podium: accent als tekst en lijn (--ayg-accent-sterk) op inkt-2', tekst: podiumToken('ayg-accent-sterk'), op: t('ayg-inkt-2'), min: NORMAAL },
  ]
  const metNaam = (p: Paar): Paar => ({ ...p, waar: `${naam}: ${p.waar}` })
  return { site: site.map(metNaam), hoofdstuk: hoofdstuk.map(metNaam), podium: podium.map(metNaam) }
}

const PAREN = PALETTEN.map(({ naam, S }) => paletParen(naam, S))
const SITE_PAREN = PAREN.flatMap((p) => p.site)
const HOOFDSTUK_PAREN = PAREN.flatMap((p) => p.hoofdstuk)
const PODIUM_PAREN = PAREN.flatMap((p) => p.podium)
const HOOFDSTUK_TOKENS = Object.keys(LICHT).filter((k) => k.startsWith('ayg-h-') && k !== 'ayg-h-tekst')

describe('de accentkleur', () => {
  it('is racegroen #10302A met creme, flessengroen en salie (besluit Kane 23-10-2026)', () => {
    expect(LICHT['ayg-accent'].toLowerCase()).toBe('#10302a')
    expect(LICHT['ayg-accent-tekst'].toLowerCase()).toBe('#f1ece1')
    expect(LICHT['ayg-bg'].toLowerCase()).toBe('#f1ece1')
    expect(LICHT['ayg-accent-sterk'].toLowerCase()).toBe('#1e4a40')
    expect(LICHT['ayg-inkt'].toLowerCase()).toBe('#10302a')
    expect(LICHT['ayg-tekst'].toLowerCase()).toBe('#111614')
    expect(LICHT['ayg-h-beheer'].toLowerCase()).toBe('#a7b5a8')
  })
  it('nergens nog smaragd (#1FA77A, #2DB886, #08704E) of een gloed in de held', () => {
    for (const bestand of ALLE_CSS) {
      const css = lees(bestand)
      expect(css, bestand).not.toMatch(/1fa77a|2db886|08704e|31,\s*167,\s*122|45,\s*184,\s*134/i)
    }
    expect(lees('src/components/aiyourgym/home/home.css')).not.toMatch(/\.ayg-held::before\s*\{[^}]*radial-gradient/)
    for (const bestand of ['src/components/aiyourgym/mockups/stalen.ts', 'src/app/(aiyourgym)/(website)/aiyourgym/(site)/demo/page.tsx']) {
      expect(readFileSync(path.join(WORTEL, bestand), 'utf8'), bestand).not.toMatch(/1fa77a|2db886/i)
    }
  })
  it('nergens nog de oude volt (#c9f03e)', () => {
    const bestanden = [...ALLE_CSS, 'src/components/aiyourgym/merk/AygSymbool.tsx', 'src/components/aiyourgym/mockups/stalen.ts', 'src/lib/aiyourgym/demo/bron.ts']
    for (const bestand of bestanden) expect(readFileSync(path.join(WORTEL, bestand), 'utf8'), bestand).not.toMatch(/c9f03e|201,\s*240,\s*62/i)
  })
})

describe('de donkere versie', () => {
  it('zet elk kleurtoken van de lichte versie opnieuw', () => {
    const donker = donkereTokens(SITE_CSS)
    const kleuren = Object.keys(LICHT).filter((k) => /^(#|rgb)/.test(LICHT[k]) || k.startsWith('ayg-gloed'))
    expect(kleuren.filter((k) => !(k in donker))).toEqual([])
  })
  it('meldt licht en donker, zodat Chrome de site niet zelf donker maakt', () => {
    expect(lees(SITE_CSS)).toMatch(/color-scheme:\s*light dark/)
    expect(lees('src/app/(aiyourgym)/(website)/aiyourgym/layout.tsx')).toMatch(/colorScheme:\s*'light dark'/)
  })
})

describe('contrast van de hoofdstukken en het podium', () => {
  it('er zijn vijf hoofdstukaccenten', () => {
    expect(HOOFDSTUK_TOKENS.sort()).toEqual(['ayg-h-beheer', 'ayg-h-betrokkenheid', 'ayg-h-coaching', 'ayg-h-groei', 'ayg-h-planning'])
  })
  it('het podium zet --ayg-tekst om naar de lichte inkttekst', () => {
    expect(P['ayg-tekst']).toBe('var(--ayg-inkt-tekst)')
  })
  it('het podium en de voet zetten het racegroene accent om naar de lichte salie', () => {
    expect(P['ayg-accent']).toBe('var(--ayg-accent-licht)')
    expect(P['ayg-accent-tekst']).toBe('var(--ayg-inkt)')
    expect(P['ayg-accent-sterk']).toBe('var(--ayg-accent-licht)')
    expect(lees(SITE_CSS)).toMatch(/\.ayg-voet \{[^}]*--ayg-accent:\s*var\(--ayg-accent-licht\)/)
    expect(lees(SITE_CSS)).toMatch(/\.ayg-voet \{[^}]*--ayg-accent-sterk:\s*var\(--ayg-accent-licht\)/)
  })
  it.each([...HOOFDSTUK_PAREN, ...PODIUM_PAREN])('$waar', ({ tekst, op, min }) => {
    expect(contrast(tekst, op)).toBeGreaterThanOrEqual(min)
  })
})

/** De regels van een selector in de site-css (alle blokken die precies zo beginnen). */
function regels(selector: string): string {
  const css = lees(SITE_CSS)
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return [...css.matchAll(new RegExp(`(?:^|\\n|\\})\\s*${esc}\\s*\\{([^}]*)\\}`, 'g'))].map((m) => m[1]).join(';')
}

describe('kop, contactbalk en menu: licht met racegroen (besluit Kane 23-10-2026)', () => {
  const DONKER_VLAK = /background(?:-color)?\s*:\s*var\(--ayg-(?:inkt|tekst)\)/

  it.each(['.ayg-contactbalk', '.ayg-kop', '.ayg-kop::before', '.ayg-menuknop', '.ayg-menupaneel', '.ayg-plak'])('%s heeft geen donker vlak', (sel) => {
    const r = regels(sel)
    expect(r, sel).not.toBe('')
    expect(r, sel).not.toMatch(DONKER_VLAK)
  })
  it('de contactbalk is de salietint met inkt erop', () => {
    expect(regels('.ayg-contactbalk')).toMatch(/background:\s*var\(--ayg-balk\)/)
    expect(regels('.ayg-contactbalk')).toMatch(/color:\s*var\(--ayg-tekst\)/)
  })
  it('de kop wordt bij scrollen een licht creme vlak met fijne lijn, zonder blur (die liet scrollen haperen)', () => {
    const r = regels('.ayg-kop::before')
    expect(r).toMatch(new RegExp(`color-mix\\(in srgb, var\\(--ayg-vlak\\) ${KOP_DEKKING * 100}%, transparent\\)`))
    expect(r).not.toMatch(/backdrop-filter/)
    expect(r).toMatch(/0 1px 0 var\(--ayg-lijn\)/)
  })
  it('geen mix-blend-mode en geen backdrop-filter in de css van de website', () => {
    for (const bestand of ALLE_CSS) expect(lees(bestand), bestand).not.toMatch(/mix-blend-mode|backdrop-filter/)
  })
  it('het menupaneel en de vaste knop onderin zijn licht', () => {
    expect(regels('.ayg-menupaneel')).toMatch(/background:\s*var\(--ayg-vlak\)/)
    expect(regels('.ayg-plak')).toMatch(new RegExp(`color-mix\\(in srgb, var\\(--ayg-vlak\\) ${PLAK_DEKKING * 100}%, transparent\\)`))
  })
  it('de hoofdknop in de kop is racegroen (de accentknop)', () => {
    const nav = readFileSync(path.join(WORTEL, 'src/components/aiyourgym/site/AygNav.tsx'), 'utf8')
    expect(nav).toMatch(/href=\{AANMELDEN\} className="ayg-knop ayg-knop--accent/)
  })
  it('kop en vaste knop kijken naar de body die scrolt, niet naar window.scrollY', () => {
    for (const bestand of ['AygKop.tsx', 'PlakActie.tsx']) {
      const code = readFileSync(path.join(WORTEL, 'src/components/aiyourgym/site', bestand), 'utf8')
      expect(code, bestand).toMatch(/volgScroll\(/)
      expect(code, bestand).not.toMatch(/window\.scrollY|addEventListener\('scroll'/)
    }
  })
  it('het grote woordmerk in de voet is rustig: zichtbaar, maar geen grijs blok', () => {
    for (const S of [LICHT, DONKER]) {
      const c = contrast(S['ayg-voet-woord'], S['ayg-inkt'])
      expect(c).toBeGreaterThanOrEqual(1.3)
      expect(c).toBeLessThanOrEqual(2.5)
    }
  })
})

describe('contrast van de website-tokens', () => {
  it.each(SITE_PAREN)('$waar', ({ tekst, op, min }) => {
    expect(contrast(tekst, op)).toBeGreaterThanOrEqual(min)
  })

  it('elke tekstkleur in de css staat in de lijst hierboven', () => {
    const gecontroleerd = new Set(['ayg-tekst', 'ayg-tekst-2', 'ayg-tekst-spook', 'ayg-inkt', 'ayg-inkt-tekst', 'ayg-inkt-tekst-2', 'ayg-inkt-spook', 'ayg-accent', 'ayg-accent-tekst', 'ayg-accent-sterk', 'ayg-accent-licht', 'ayg-h-tekst', 'ayg-bg', 'ayg-fout', 'ayg-ok', 'ayg-voet-woord', 'k-tekst'])
    const gebruikt = new Set<string>()
    for (const bestand of ALLE_CSS) {
      for (const m of lees(bestand).matchAll(/(?<![-\w])color\s*:\s*var\(--([\w-]+)/g)) gebruikt.add(m[1])
    }
    const ayg = [...gebruikt].filter((n) => n.startsWith('ayg-') || n === 'k-tekst')
    expect(ayg.filter((n) => !gecontroleerd.has(n))).toEqual([])
  })

  it('geen tekst met verlaagde dekking of een doorzichtige color-mix als kleur', () => {
    for (const bestand of ALLE_CSS) {
      const css = lees(bestand)
      expect(css, bestand).not.toMatch(/(?<![-\w])color\s*:\s*color-mix\([^)]*transparent/)
      expect(css, bestand).not.toMatch(/aygm-boven[^{]*\{[^}]*opacity/)
    }
  })
})

// De productbeelden: standaard de donkere schermen van .aygm, in de demo en de
// huisstijl-demo de kleuren van een sportschool via huisstijlVariabelen.
const M = tokens(MOCKUP_CSS, '.aygm')

function schermParen(v: Record<string, string>, naam: string): Paar[] {
  const vlakken = ['bg-app', 'bg-card', 'bg-raised'].map((k) => v[`--${k}`])
  const tekst = (k: string, op: string) => over(kleur(v[`--${k}`]), kleur(op))
  return [
    ...vlakken.flatMap((op) =>
      ['text-1', 'text-2', 'text-3'].map((k) => ({ waar: `${naam}: ${k} op ${op}`, tekst: tekst(k, op), op, min: NORMAAL })),
    ),
    ...vlakken.slice(0, 2).map((op) => ({ waar: `${naam}: tekst in de accentkleur op ${op}`, tekst: v['--brand-tekst'], op, min: NORMAAL })),
    { waar: `${naam}: tekst op een accentvlak (knop, chip, volgende les)`, tekst: v['--brand-inkt'], op: v['--brand'], min: NORMAAL },
    ...(['--club-ok', '--club-let-op'] as const).flatMap((k) => [
      { waar: `${naam}: ${k} op een kaart`, tekst: v[k], op: v['--bg-card'], min: NORMAAL },
      { waar: `${naam}: ${k} op zijn chip (14%)`, tekst: v[k], op: meng(v[k], over(kleur(v['--bg-raised']), kleur(v['--bg-app'])), 0.14), min: NORMAAL },
    ]),
  ]
}

const STANDAARD = Object.fromEntries(Object.entries(M).map(([k, w]) => [`--${k}`, w]))
const HUISSTIJLEN = [...STALEN.map((s) => ({ naam: s.naam, hex: s.hex })), { naam: 'Voorbeeld Gym', hex: '#3E63DD' }, { naam: 'Fit Factory brons', hex: '#B58E5C' }]

const SCHERM_PAREN: Paar[] = [
  ...schermParen(STANDAARD, 'standaard'),
  ...HUISSTIJLEN.flatMap((h) =>
    THEMAS.map((thema) => ({ naam: `${h.naam} ${thema}`, v: { ...STANDAARD, ...huisstijlVariabelen(h.hex, thema) } })),
  ).flatMap(({ naam, v }) => schermParen(v, naam)),
]

describe('contrast in de productbeelden en de demo', () => {
  it.each(SCHERM_PAREN)('$waar', ({ tekst, op, min }) => {
    expect(contrast(tekst, op)).toBeGreaterThanOrEqual(min)
  })
})
