import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrast, huisstijlVariabelen, THEMAS } from '@/lib/club/kern/huisstijl'
import { STALEN } from './mockups/stalen'

// Bewaakt het contrast van de verkoopwebsite (WCAG 2.2 AA): normale tekst minstens
// 4.5:1, grote tekst (sierletters, grote nummers) en UI-randen minstens 3:1.
// Richting "Obsidian Luxury" (besluit Kane 28-10-2026): een basis in obsidiaan
// (.ayg) en lichte secties in ivoor (.ayg-ivoor) die dezelfde tokens omzetten.
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
  'src/components/aiyourgym/voorpagina/voorpagina.css',
  'src/components/aiyourgym/functies-pagina/functies-pagina.css',
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

const OBSIDIAAN = tokens(SITE_CSS, '.ayg')
const IVOOR_EIGEN = tokens(SITE_CSS, '.ayg-ivoor')
const IVOOR = { ...OBSIDIAAN, ...IVOOR_EIGEN }
const PALETTEN = [
  { naam: 'obsidiaan', S: OBSIDIAAN },
  { naam: 'ivoor', S: IVOOR },
] as const

interface Paar {
  waar: string
  tekst: string
  op: string
  min: number
}

const VLAKKEN = ['ayg-bg', 'ayg-vlak', 'ayg-vlak-2'] as const
const PODIUM_VLAKKEN = ['ayg-inkt', 'ayg-inkt-2'] as const
const procent = (w: string) => Number.parseFloat(w) / 100
const P = tokens(SITE_CSS, '.ayg-podium')

/** Hoe dekkend het vlak van de kop (gescrold) en van de vaste knop onderin is; gecontroleerd tegen de css hieronder. */
const KOP_DEKKING = 0.96
const PLAK_DEKKING = 0.97

/**
 * De kop, de contactbalk, het menupaneel en de vaste knop onderin staan altijd op
 * obsidiaan. Kop en vaste knop zijn half doorzichtig: we rekenen met het slechtste
 * geval eronder, een ivoren sectie en het antraciet podium.
 */
function kopParen(t: (token: string) => string): Paar[] {
  const onder = [t('ayg-inkt'), IVOOR['ayg-bg']]
  const doorzichtig = (dekking: number, plek: string) =>
    onder.flatMap((o) => {
      const vlak = meng(t('ayg-vlak'), o, dekking)
      return [
        { waar: `${plek} over ${o}: tekst`, tekst: t('ayg-tekst'), op: vlak, min: NORMAAL },
        { waar: `${plek} over ${o}: menulinks (tekst-2)`, tekst: t('ayg-tekst-2'), op: vlak, min: NORMAAL },
        { waar: `${plek} over ${o}: champagne streep onder de huidige pagina`, tekst: t('ayg-accent-sterk'), op: vlak, min: GROOT },
        { waar: `${plek} over ${o}: rand van de randknop`, tekst: t('ayg-lijn-sterk'), op: vlak, min: GROOT },
      ]
    })
  return [
    { waar: 'contactbalk: tekst', tekst: t('ayg-tekst'), op: t('ayg-balk'), min: NORMAAL },
    { waar: 'contactbalk: champagne iconen', tekst: t('ayg-accent-sterk'), op: t('ayg-balk'), min: NORMAAL },
    { waar: 'contactbalk: de balk is te onderscheiden van de pagina eronder', tekst: t('ayg-balk'), op: t('ayg-bg'), min: 1.05 },
    { waar: 'menuknop: tekst op het vlak', tekst: t('ayg-tekst'), op: t('ayg-vlak'), min: NORMAAL },
    { waar: 'menupaneel: champagne nummers', tekst: t('ayg-accent-sterk'), op: t('ayg-vlak'), min: NORMAAL },
    ...doorzichtig(KOP_DEKKING, 'kop gescrold'),
    ...doorzichtig(PLAK_DEKKING, 'vaste knop onderin'),
  ]
}

interface PaletParen {
  site: Paar[]
  hoofdstuk: Paar[]
  podium: Paar[]
}

/** Alle paren van een palet (obsidiaan of ivoor), met de naam van het palet ervoor. */
function paletParen(naam: string, S: Record<string, string>): PaletParen {
  const t = (token: string) => {
    const waarde = S[token]
    if (!waarde) throw new Error(`Token --${token} bestaat niet`)
    return waarde
  }
  const site: Paar[] = [
    ...VLAKKEN.flatMap((v) => [
      { waar: `tekst op ${v}`, tekst: t('ayg-tekst'), op: t(v), min: NORMAAL },
      { waar: `bijschriften, labels en placeholder op ${v}`, tekst: t('ayg-tekst-2'), op: t(v), min: NORMAAL },
      { waar: `grote sierletters en nummers op ${v}`, tekst: t('ayg-tekst-spook'), op: t(v), min: GROOT },
      { waar: `randen van invoervelden en randknoppen op ${v}`, tekst: t('ayg-lijn-sterk'), op: t(v), min: GROOT },
      { waar: `foutmelding op ${v}`, tekst: t('ayg-fout'), op: t(v), min: NORMAAL },
      { waar: `beschikbaar-melding op ${v}`, tekst: t('ayg-ok'), op: t(v), min: NORMAAL },
      { waar: `champagne als tekst, oog en cursief woord (accent-sterk) op ${v}`, tekst: t('ayg-accent-sterk'), op: t(v), min: NORMAAL },
      { waar: `accentknop, vinkje en badge afgetekend tegen ${v}`, tekst: t('ayg-accent'), op: t(v), min: GROOT },
      { waar: `focusrand op ${v}`, tekst: t('ayg-focus'), op: t(v), min: GROOT },
    ]),
    ...PODIUM_VLAKKEN.flatMap((v) => [
      { waar: `tekst op ${v}`, tekst: t('ayg-inkt-tekst'), op: t(v), min: NORMAAL },
      { waar: `bijschriften op ${v}`, tekst: t('ayg-inkt-tekst-2'), op: t(v), min: NORMAAL },
      { waar: `grote sierletters op ${v}`, tekst: t('ayg-inkt-spook'), op: t(v), min: GROOT },
      { waar: `lichte champagne als tekst en icoon op ${v}`, tekst: t('ayg-accent-licht'), op: t(v), min: NORMAAL },
      { waar: `lichte champagne knop met obsidiaan erop op ${v}`, tekst: t('ayg-h-tekst'), op: t('ayg-accent-licht'), min: NORMAAL },
    ]),
    { waar: 'tekst op de accentknop, badges, chips en vinkjes', tekst: t('ayg-accent-tekst'), op: t('ayg-accent'), min: NORMAAL },
    { waar: 'tekst op het warme vlak onder een markering', tekst: t('ayg-tekst'), op: t('ayg-accent-zacht'), min: NORMAAL },
    { waar: 'champagne speelknop en focusrand op de bedieningsbalk (86% inkt over het oefenbeeld)', tekst: t('ayg-accent-licht'), op: meng('#111614', '#e9f3f7', 0.86), min: GROOT },
    { waar: 'tekst op de standaardknop (warm wit of obsidiaan)', tekst: t('ayg-bg'), op: t('ayg-tekst'), min: NORMAAL },
    { waar: 'gekozen thema in de huisstijl-demo', tekst: t('ayg-inkt'), op: t('ayg-inkt-tekst'), min: NORMAAL },
    { waar: 'foutmelding in het meldingvlak (10% fout)', tekst: t('ayg-fout'), op: meng(t('ayg-fout'), t('ayg-vlak'), 0.1), min: NORMAAL },
    { waar: 'bijschrift op het diepere vlak onder in de held', tekst: t('ayg-tekst-2'), op: t('ayg-held-vlak'), min: NORMAAL },
    { waar: 'tekst op het diepere vlak onder in de held', tekst: t('ayg-tekst'), op: t('ayg-held-vlak'), min: NORMAAL },
    { waar: 'bijschrift op de gloed van de aanmeldband', tekst: t('ayg-inkt-tekst-2'), op: meng(t('ayg-inkt-2'), t('ayg-inkt'), procent(t('ayg-gloed-band'))), min: NORMAAL },
    { waar: 'uitgeschakelde accentknop (85%)', tekst: meng(t('ayg-accent-tekst'), t('ayg-vlak'), 0.85), op: meng(t('ayg-accent'), t('ayg-vlak'), 0.85), min: NORMAAL },
    { waar: 'uitgeschakelde standaardknop (85%)', tekst: meng(t('ayg-bg'), t('ayg-vlak'), 0.85), op: meng(t('ayg-tekst'), t('ayg-vlak'), 0.85), min: NORMAAL },
    { waar: 'lichte knop op het podium met obsidiaan erop', tekst: t('ayg-inkt'), op: t('ayg-inkt-tekst'), min: NORMAAL },
    ...(naam === 'obsidiaan' ? kopParen(t) : []),
  ]
  // Hoofdstukken van de functies: tinten van champagne tot ivoor, altijd met
  // obsidiaan erop of als tekst op het podium. Alleen op de obsidiaan basis.
  const hoofdstuk: Paar[] =
    naam === 'obsidiaan'
      ? Object.keys(S)
          .filter((k) => k.startsWith('ayg-h-') && k !== 'ayg-h-tekst')
          .flatMap((k) => [
            { waar: `obsidiaan op het hoofdstukaccent ${k}`, tekst: t('ayg-h-tekst'), op: t(k), min: NORMAAL },
            { waar: `hoofdstukaccent ${k} als tekst op het podium`, tekst: t(k), op: t('ayg-inkt'), min: NORMAAL },
            { waar: `hoofdstukaccent ${k} als lijn op obsidiaan`, tekst: t(k), op: t('ayg-bg'), min: GROOT },
          ])
      : []
  // Op een podium worden de tekstkleuren omgezet; een gewone knop wordt daar licht.
  const podiumToken = (token: string) => t((P[token] ?? '').replace(/^var\(--|\)$/g, ''))
  const podium: Paar[] = [
    { waar: 'podium: koppen en tekst (--ayg-tekst) op inkt', tekst: podiumToken('ayg-tekst'), op: t('ayg-inkt'), min: NORMAAL },
    { waar: 'podium: koppen en tekst (--ayg-tekst) op inkt-2', tekst: podiumToken('ayg-tekst'), op: t('ayg-inkt-2'), min: NORMAAL },
    { waar: 'podium: bijschriften (--ayg-tekst-2) op inkt', tekst: podiumToken('ayg-tekst-2'), op: t('ayg-inkt'), min: NORMAAL },
    { waar: 'podium: bijschriften (--ayg-tekst-2) op inkt-2', tekst: podiumToken('ayg-tekst-2'), op: t('ayg-inkt-2'), min: NORMAAL },
    { waar: 'podium: lichte knop (inkt op --ayg-tekst)', tekst: t('ayg-inkt'), op: podiumToken('ayg-tekst'), min: NORMAAL },
    { waar: 'podium: accentknop (obsidiaan op lichte champagne)', tekst: podiumToken('ayg-accent-tekst'), op: podiumToken('ayg-accent'), min: NORMAAL },
    { waar: 'podium: accentknop afgetekend tegen het podium', tekst: podiumToken('ayg-accent'), op: t('ayg-inkt'), min: GROOT },
    { waar: 'podium: rand van een invoerveld', tekst: t('ayg-inkt-tekst-2'), op: t('ayg-inkt-2'), min: GROOT },
    { waar: 'podium: champagne als tekst en lijn (--ayg-accent-sterk) op inkt', tekst: podiumToken('ayg-accent-sterk'), op: t('ayg-inkt'), min: NORMAAL },
    { waar: 'podium: champagne als tekst en lijn (--ayg-accent-sterk) op inkt-2', tekst: podiumToken('ayg-accent-sterk'), op: t('ayg-inkt-2'), min: NORMAAL },
  ]
  const metNaam = (p: Paar): Paar => ({ ...p, waar: `${naam}: ${p.waar}` })
  return { site: site.map(metNaam), hoofdstuk: hoofdstuk.map(metNaam), podium: podium.map(metNaam) }
}

const PAREN = PALETTEN.map(({ naam, S }) => paletParen(naam, S))
const SITE_PAREN = PAREN.flatMap((p) => p.site)
const HOOFDSTUK_PAREN = PAREN.flatMap((p) => p.hoofdstuk)
const PODIUM_PAREN = PAREN.flatMap((p) => p.podium)
const HOOFDSTUK_TOKENS = Object.keys(OBSIDIAAN).filter((k) => k.startsWith('ayg-h-') && k !== 'ayg-h-tekst')

describe('het palet: Obsidian Luxury (besluit Kane 28-10-2026)', () => {
  it('obsidiaan, warm wit en champagne als enige accent', () => {
    expect(OBSIDIAAN['ayg-bg'].toLowerCase()).toBe('#0a0a0b')
    expect(OBSIDIAAN['ayg-tekst'].toLowerCase()).toBe('#f3eee5')
    expect(OBSIDIAAN['ayg-accent'].toLowerCase()).toBe('#d4bf96')
    expect(OBSIDIAAN['ayg-accent-tekst'].toLowerCase()).toBe('#0a0a0b')
    expect(OBSIDIAAN['ayg-vlak-2'].toLowerCase()).toBe('#1a1a1d')
  })
  it('de ivoren sectie: warm wit papier, obsidiaan knoppen en diepe champagne als tekst', () => {
    expect(IVOOR['ayg-bg'].toLowerCase()).toBe('#f3eee5')
    expect(IVOOR['ayg-accent'].toLowerCase()).toBe('#0e0e0f')
    expect(IVOOR['ayg-accent-sterk'].toLowerCase()).toBe('#76603a')
  })
  it('de ivoren sectie zet elk vlak- en tekstkleurtoken opnieuw', () => {
    const moet = ['ayg-bg', 'ayg-vlak', 'ayg-vlak-2', 'ayg-tekst', 'ayg-tekst-2', 'ayg-tekst-spook', 'ayg-lijn', 'ayg-lijn-sterk', 'ayg-accent', 'ayg-accent-tekst', 'ayg-accent-sterk', 'ayg-accent-zacht', 'ayg-focus', 'ayg-fout', 'ayg-ok']
    expect(moet.filter((k) => !(k in IVOOR_EIGEN))).toEqual([])
  })
  it('nergens nog racegroen, salie, smaragd of volt in de css van de website', () => {
    for (const bestand of ALLE_CSS) {
      const css = lees(bestand)
      expect(css, bestand).not.toMatch(/10302a|1e4a40|a7b5a8|1fa77a|2db886|08704e|c9f03e/i)
    }
    for (const bestand of ['src/components/aiyourgym/mockups/stalen.ts', 'src/app/(aiyourgym)/(website)/aiyourgym/(site)/demo/page.tsx']) {
      expect(readFileSync(path.join(WORTEL, bestand), 'utf8'), bestand).not.toMatch(/1fa77a|2db886|c9f03e/i)
    }
  })
})

describe('een vast donker kleurenschema', () => {
  it('de site meldt alleen donker; de ivoren secties zelf licht', () => {
    const css = lees(SITE_CSS)
    expect(css).toMatch(/\.ayg \{[^}]*color-scheme:\s*dark/)
    expect(css).toMatch(/\.ayg-ivoor \{[^}]*color-scheme:\s*light/)
    expect(css).not.toMatch(/prefers-color-scheme/)
    expect(lees('src/app/(aiyourgym)/(website)/aiyourgym/layout.tsx')).toMatch(/colorScheme:\s*'dark'/)
  })
})

describe('contrast van de hoofdstukken en het podium', () => {
  it('er zijn vijf hoofdstukaccenten', () => {
    expect(HOOFDSTUK_TOKENS.sort()).toEqual(['ayg-h-beheer', 'ayg-h-betrokkenheid', 'ayg-h-coaching', 'ayg-h-groei', 'ayg-h-planning'])
  })
  it('het podium zet --ayg-tekst om naar de lichte inkttekst en het accent naar lichte champagne', () => {
    expect(P['ayg-tekst']).toBe('var(--ayg-inkt-tekst)')
    expect(P['ayg-accent']).toBe('var(--ayg-accent-licht)')
    expect(P['ayg-accent-tekst']).toBe('var(--ayg-h-tekst)')
    expect(P['ayg-accent-sterk']).toBe('var(--ayg-accent-licht)')
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

describe('kop, contactbalk, menu en voet', () => {
  it('de kop wordt bij scrollen een bijna dicht vlak met een haarlijn, zonder blur (die liet scrollen haperen)', () => {
    const r = regels('.ayg-kop::before')
    expect(r).toMatch(new RegExp(`color-mix\\(in srgb, var\\(--ayg-vlak\\) ${KOP_DEKKING * 100}%, transparent\\)`))
    expect(r).not.toMatch(/backdrop-filter/)
    expect(r).toMatch(/0 1px 0 var\(--ayg-lijn\)/)
  })
  it('geen mix-blend-mode en geen backdrop-filter in de css van de website', () => {
    for (const bestand of ALLE_CSS) expect(lees(bestand), bestand).not.toMatch(/mix-blend-mode|backdrop-filter/)
  })
  it('het menupaneel en de vaste knop onderin liggen op het vlak', () => {
    expect(regels('.ayg-menupaneel')).toMatch(/background:\s*var\(--ayg-vlak\)/)
    expect(regels('.ayg-plak')).toMatch(new RegExp(`color-mix\\(in srgb, var\\(--ayg-vlak\\) ${PLAK_DEKKING * 100}%, transparent\\)`))
  })
  it('de hoofdknop in de kop is de champagne accentknop', () => {
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
  it('de voet zet champagne als accent en het grote woordmerk is rustig: zichtbaar, maar geen blok', () => {
    expect(lees(SITE_CSS)).toMatch(/\.ayg-voet \{[^}]*--ayg-accent-sterk:\s*var\(--ayg-accent\)/)
    const c = contrast(OBSIDIAAN['ayg-voet-woord'], OBSIDIAAN['ayg-bg'])
    expect(c).toBeGreaterThanOrEqual(1.3)
    expect(c).toBeLessThanOrEqual(2.5)
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

const STANDAARD = Object.fromEntries(Object.entries(M).filter(([, w]) => /^(#|rgb)/.test(w)).map(([k, w]) => [`--${k}`, w]))
const HUISSTIJLEN = [...STALEN.map((s) => ({ naam: s.naam, hex: s.hex })), { naam: 'Voorbeeld Gym', hex: '#3E63DD' }, { naam: 'Fit Factory brons', hex: '#B58E5C' }]

const SCHERM_PAREN: Paar[] = [
  ...schermParen(STANDAARD, 'standaard'),
  ...HUISSTIJLEN.flatMap((h) =>
    THEMAS.map((thema) => ({ naam: `${h.naam} ${thema}`, v: { ...STANDAARD, ...huisstijlVariabelen(h.hex, thema) } })),
  ).flatMap(({ naam, v }) => schermParen(v, naam)),
]

describe('contrast in de productbeelden en de demo', () => {
  it('Kernhal (de voorbeeldsportschool) draagt champagne, passend bij de website', () => {
    expect(M['brand'].toLowerCase()).toBe('#c9b38a')
  })
  it.each(SCHERM_PAREN)('$waar', ({ tekst, op, min }) => {
    expect(contrast(tekst, op)).toBeGreaterThanOrEqual(min)
  })
})
