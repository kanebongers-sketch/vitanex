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
  'src/components/aiyourgym/demo/demo.css',
  'src/components/aiyourgym/aanmelden/aanmelden.css',
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

const S = tokens(SITE_CSS, '.ayg')
const t = (naam: string) => {
  const waarde = S[naam]
  if (!waarde) throw new Error(`Token --${naam} bestaat niet`)
  return waarde
}

interface Paar {
  waar: string
  tekst: string
  op: string
  min: number
}

const LICHT_VLAKKEN = ['ayg-bg', 'ayg-vlak', 'ayg-vlak-2'] as const
const DONKER_VLAKKEN = ['ayg-inkt', 'ayg-inkt-2'] as const

const SITE_PAREN: Paar[] = [
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
  { waar: 'bijschrift op de held-gloed (30% volt)', tekst: t('ayg-tekst-2'), op: meng(t('ayg-accent'), t('ayg-bg'), 0.3), min: NORMAAL },
  { waar: 'bijschrift op de gloed van de aanmeldband (26% volt)', tekst: t('ayg-inkt-tekst-2'), op: meng(t('ayg-accent'), t('ayg-inkt'), 0.26), min: NORMAAL },
  { waar: 'uitgeschakelde voltknop (85%)', tekst: meng(t('ayg-accent-tekst'), t('ayg-vlak'), 0.85), op: meng(t('ayg-accent'), t('ayg-vlak'), 0.85), min: NORMAAL },
  { waar: 'uitgeschakelde inktknop (85%)', tekst: meng(t('ayg-bg'), t('ayg-vlak'), 0.85), op: meng(t('ayg-tekst'), t('ayg-vlak'), 0.85), min: NORMAAL },
]

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
