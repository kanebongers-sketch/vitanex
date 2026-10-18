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

const SITE_CSS = 'src/app/aiyourgym/aiyourgym.css'
const MOCKUP_CSS = 'src/components/aiyourgym/mockups/mockups.css'
const ALLE_CSS = [
  SITE_CSS,
  MOCKUP_CSS,
  'src/components/aiyourgym/home/home.css',
  'src/components/aiyourgym/home/hoofdpunten.css',
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
    ]),
    ...DONKER_VLAKKEN.flatMap((v) => [
      { waar: `tekst op ${v}`, tekst: t('ayg-inkt-tekst'), op: t(v), min: NORMAAL },
      { waar: `bijschriften op ${v}`, tekst: t('ayg-inkt-tekst-2'), op: t(v), min: NORMAAL },
      { waar: `grote sierletters op ${v}`, tekst: t('ayg-inkt-spook'), op: t(v), min: GROOT },
      { waar: `volt als tekst en icoon op ${v}`, tekst: t('ayg-accent'), op: t(v), min: NORMAAL },
    ]),
    { waar: 'tekst op de voltknop, badges en chips', tekst: t('ayg-accent-tekst'), op: t('ayg-accent'), min: NORMAAL },
    { waar: 'tekst op de inktknop', tekst: t('ayg-bg'), op: t('ayg-tekst'), min: NORMAAL },
    { waar: 'gekozen thema in de huisstijl-demo', tekst: t('ayg-inkt'), op: t('ayg-inkt-tekst'), min: NORMAAL },
    { waar: 'foutmelding in het meldingvlak (10% fout)', tekst: t('ayg-fout'), op: meng(t('ayg-fout'), t('ayg-vlak'), 0.1), min: NORMAAL },
    { waar: 'bijschrift op de held-gloed', tekst: t('ayg-tekst-2'), op: meng(t('ayg-accent'), t('ayg-bg'), procent(t('ayg-gloed'))), min: NORMAAL },
    { waar: 'bijschrift op de gloed van de aanmeldband', tekst: t('ayg-inkt-tekst-2'), op: meng(t('ayg-accent'), t('ayg-inkt'), procent(t('ayg-gloed-band'))), min: NORMAAL },
    { waar: 'uitgeschakelde voltknop (85%)', tekst: meng(t('ayg-accent-tekst'), t('ayg-vlak'), 0.85), op: meng(t('ayg-accent'), t('ayg-vlak'), 0.85), min: NORMAAL },
    { waar: 'uitgeschakelde inktknop (85%)', tekst: meng(t('ayg-bg'), t('ayg-vlak'), 0.85), op: meng(t('ayg-tekst'), t('ayg-vlak'), 0.85), min: NORMAAL },
    { waar: 'volt als tekst op het papier (de markering in de donkere versie)', tekst: t('ayg-accent'), op: t('ayg-bg'), min: naam === 'donker' ? NORMAAL : 1 },
    { waar: 'hover op een hoofdstuk: lichte knop met inkt erop', tekst: t('ayg-accent-tekst'), op: t('ayg-inkt-tekst'), min: NORMAAL },
  ]
  // Elk hoofdstuk van de functies heeft een eigen accent: altijd inkt erop (het
  // nummer, het label, de hover-vulling) en als tekst op inkt (het nummer bij hover).
  const hoofdstuk: Paar[] = Object.keys(S)
    .filter((k) => k.startsWith('ayg-h-'))
    .flatMap((k) => [
      { waar: `inkt op het hoofdstukaccent ${k}`, tekst: t('ayg-accent-tekst'), op: t(k), min: NORMAAL },
      { waar: `hoofdstukaccent ${k} als tekst op inkt`, tekst: t(k), op: t('ayg-inkt'), min: NORMAAL },
      { waar: `hoofdstukaccent ${k} als nummer op de inkt van een hover`, tekst: t(k), op: t('ayg-accent-tekst'), min: NORMAAL },
    ])
  // Op een donker podium worden de tekstkleuren omgezet; een gewone inktknop wordt daar licht.
  const podiumToken = (token: string) => t((P[token] ?? '').replace(/^var\(--|\)$/g, ''))
  const podium: Paar[] = [
    { waar: 'podium: koppen en tekst (--ayg-tekst) op inkt', tekst: podiumToken('ayg-tekst'), op: t('ayg-inkt'), min: NORMAAL },
    { waar: 'podium: koppen en tekst (--ayg-tekst) op inkt-2', tekst: podiumToken('ayg-tekst'), op: t('ayg-inkt-2'), min: NORMAAL },
    { waar: 'podium: bijschriften (--ayg-tekst-2) op inkt', tekst: podiumToken('ayg-tekst-2'), op: t('ayg-inkt'), min: NORMAAL },
    { waar: 'podium: lichte knop (inkt op --ayg-tekst)', tekst: t('ayg-inkt'), op: podiumToken('ayg-tekst'), min: NORMAAL },
  ]
  const metNaam = (p: Paar): Paar => ({ ...p, waar: `${naam}: ${p.waar}` })
  return { site: site.map(metNaam), hoofdstuk: hoofdstuk.map(metNaam), podium: podium.map(metNaam) }
}

const PAREN = PALETTEN.map(({ naam, S }) => paletParen(naam, S))
const SITE_PAREN = PAREN.flatMap((p) => p.site)
const HOOFDSTUK_PAREN = PAREN.flatMap((p) => p.hoofdstuk)
const PODIUM_PAREN = PAREN.flatMap((p) => p.podium)
const HOOFDSTUK_TOKENS = Object.keys(LICHT).filter((k) => k.startsWith('ayg-h-'))

describe('de donkere versie', () => {
  it('zet elk kleurtoken van de lichte versie opnieuw', () => {
    const donker = donkereTokens(SITE_CSS)
    const kleuren = Object.keys(LICHT).filter((k) => /^(#|rgb)/.test(LICHT[k]) || k.startsWith('ayg-gloed'))
    expect(kleuren.filter((k) => !(k in donker))).toEqual([])
  })
  it('meldt licht en donker, zodat Chrome de site niet zelf donker maakt', () => {
    expect(lees(SITE_CSS)).toMatch(/color-scheme:\s*light dark/)
    expect(lees('src/app/aiyourgym/layout.tsx')).toMatch(/colorScheme:\s*'light dark'/)
  })
})

describe('contrast van de hoofdstukken en het podium', () => {
  it('er zijn vijf hoofdstukaccenten', () => {
    expect(HOOFDSTUK_TOKENS.sort()).toEqual(['ayg-h-beheer', 'ayg-h-betrokkenheid', 'ayg-h-coaching', 'ayg-h-groei', 'ayg-h-planning'])
  })
  it('het podium zet --ayg-tekst om naar de lichte inkttekst', () => {
    expect(P['ayg-tekst']).toBe('var(--ayg-inkt-tekst)')
  })
  it.each([...HOOFDSTUK_PAREN, ...PODIUM_PAREN])('$waar', ({ tekst, op, min }) => {
    expect(contrast(tekst, op)).toBeGreaterThanOrEqual(min)
  })
})

describe('contrast van de website-tokens', () => {
  it.each(SITE_PAREN)('$waar', ({ tekst, op, min }) => {
    expect(contrast(tekst, op)).toBeGreaterThanOrEqual(min)
  })

  it('elke tekstkleur in de css staat in de lijst hierboven', () => {
    const gecontroleerd = new Set(['ayg-tekst', 'ayg-tekst-2', 'ayg-tekst-spook', 'ayg-inkt', 'ayg-inkt-tekst', 'ayg-inkt-tekst-2', 'ayg-inkt-spook', 'ayg-accent', 'ayg-accent-tekst', 'ayg-bg', 'ayg-fout', 'ayg-ok', 'k-tekst'])
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
