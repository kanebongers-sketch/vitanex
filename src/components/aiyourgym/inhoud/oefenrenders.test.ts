import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { coachingVoor } from '@/lib/club/training/coaching'
import {
  FASE_VOLGORDE,
  OEFENRENDERS,
  faseLengte,
  frameUrl,
  kiesFrameMaat,
  renderVoor,
  spierZin,
  srcSetVan,
} from './oefenrenders'

// De renders op de website: elke render hoort bij een echte oefening uit de
// bibliotheek (met coaching), alle bestanden staan in public/ en blijven
// binnen een HD-budget.

const PUBLIC = join(process.cwd(), 'public')
/**
 * Bovengrens per bestand in KB (HD, besluit Kane 23-10-2026: "Dit moet HD zijn!").
 * Een lus heeft 72 tot 120 beelden op 24 per seconde en libwebp kent geen
 * bewegingsvoorspelling, dus elk beeld telt bijna als een losse foto. Gemeten
 * over de 10 oefeningen (sharp, smartSubsample):
 * - lusHd (1317 tot 1359 px, kwaliteit 86): 1,3 tot 2,95 MB. Alleen retina en
 *   grote schermen laden hem, pas als hij in beeld komt. Grens 3 MB.
 * - lus (720 px, kwaliteit 85): 1,0 tot 2,1 MB, voor gewone schermen. Grens 2,25 MB.
 * - lusKlein (480 px, kwaliteit 80): 0,6 tot 1,25 MB, telefoons. Grens 1,3 MB.
 * - begin en piek (HD, kwaliteit 92): 29 tot 55 KB, grens 120 KB; de kleine
 *   posters (480 px) 10 tot 21 KB, grens 40 KB.
 * Lossless is gemeten en te zwaar (ruim 7 MB voor 940 px). Een langere lus
 * (meer beelden) mag niet zomaar boven deze grenzen: dan eerst de kwaliteit
 * in scripts/oefenbeelden-web.mjs afwegen. Het script zakt zelf in kwaliteit
 * (stappen van 2, niet onder 66) tot een lus binnen deze grenzen past. Een
 * wisselende lus (30-10-2026) kan langer zijn dan 120 beelden; dan groeit de
 * grens van de bewegende lussen naar rato mee (`grens`, zelfde regel als het script).
 */
const MAX_KB = {
  lusHd: 3072,
  lus: 2304,
  lusKlein: 1330,
  begin: 120,
  piek: 120,
  beginKlein: 40,
  piekKlein: 40,
} as const

const LUSSEN = new Set<keyof typeof MAX_KB>(['lusHd', 'lus', 'lusKlein'])

/** Grens in KB; bewegende lussen boven 120 beelden naar rato, met 6 procent ruimte (zelfde regel als het script). */
function grens(sleutel: keyof typeof MAX_KB, beelden: number): number {
  const factor = beelden > 120 ? (beelden / 120) * 1.06 : 1
  return LUSSEN.has(sleutel) ? MAX_KB[sleutel] * factor : MAX_KB[sleutel]
}

/**
 * Losse beelden voor de rep-speler, bovengrens in MB per maat (alle beelden van
 * een oefening samen). Gemeten over 9 oefeningen (72 tot 120 beelden):
 * 480 px 0,8 tot 1,8 MB, 720 px 1,3 tot 3,2 MB, 1080 px 2,1 tot 5,0 MB
 * (glute bridge, 120 beelden, is de zwaarste met samen 10 MB).
 * Het script laat 1080 weg boven 6 MB.
 */
const MAX_FRAMES_MB = { 480: 2, 720: 3.5, 1080: 6 } as const
const MAX_FRAMES_TOTAAL_MB = 11
/**
 * Renders die nog geen losse beelden en vloerlijn hebben. Alleen back-squat:
 * die wordt opnieuw gerenderd (24-10-2026); haal hem hier weg na
 * node scripts/oefenbeelden-web.mjs back-squat.
 */
const ZONDER_FRAMES: readonly string[] = []

function pad(src: string): string {
  return join(PUBLIC, src.split('?')[0])
}

describe('oefenrenders', () => {
  it('heeft minstens de back squat en de front squat', () => {
    expect(renderVoor('Back squat')?.slug).toBe('back-squat')
    expect(renderVoor('front squat')?.slug).toBe('front-squat')
    expect(renderVoor('Bestaat niet')).toBeUndefined()
  })

  it('elke render hoort bij een oefening met coaching', () => {
    for (const r of OEFENRENDERS) {
      expect(coachingVoor(r.naam), r.naam).toBeDefined()
      expect(r.spieren.length, r.naam).toBeGreaterThan(0)
    }
  })

  it('alle bestanden bestaan, met maten en binnen het budget', () => {
    for (const r of OEFENRENDERS) {
      for (const sleutel of Object.keys(MAX_KB) as (keyof typeof MAX_KB)[]) {
        const b = r[sleutel]
        expect(b.src, `${r.slug} ${sleutel}`).toMatch(/^\/oefenbeelden\/[a-z0-9-]+\/[a-z-]+\.webp\?v=[0-9a-f]{8}$/)
        expect(existsSync(pad(b.src)), b.src).toBe(true)
        expect(statSync(pad(b.src)).size, b.src).toBe(b.bytes)
        expect(b.bytes / 1024, b.src).toBeLessThan(grens(sleutel, r.frames?.aantal ?? 0))
        expect(b.breedte).toBeGreaterThan(0)
        expect(b.hoogte).toBeGreaterThan(0)
      }
      // Poster en lus even groot: geen verspringen als de lus erin vervaagt
      expect(r.begin.breedte / r.begin.hoogte).toBeCloseTo(r.lus.breedte / r.lus.hoogte)
      // HD is echt HD: minstens 1024 px, en de maten lopen op van klein naar HD
      expect(r.lusHd.breedte, r.slug).toBeGreaterThanOrEqual(1024)
      expect(r.begin.breedte, r.slug).toBe(r.lusHd.breedte)
      expect(r.lusKlein.breedte).toBeLessThan(r.lus.breedte)
      expect(r.lus.breedte).toBeLessThan(r.lusHd.breedte)
    }
  })

  it('heeft losse beelden voor de rep-speler, compleet en binnen het budget', () => {
    for (const r of OEFENRENDERS) {
      if (!r.frames) {
        expect(ZONDER_FRAMES, `${r.slug} mist losse beelden: draai scripts/oefenbeelden-web.mjs ${r.slug}`).toContain(r.slug)
        continue
      }
      const f = r.frames
      expect(f.aantal, r.slug).toBeGreaterThan(0)
      expect(f.fps).toBe(24)
      expect(f.versie).toMatch(/^[0-9a-f]{8}$/)
      expect(f.maten.map((m) => m.maat), r.slug).toEqual(expect.arrayContaining([480, 720]))
      let totaal = 0
      for (const m of f.maten) {
        const map = join(PUBLIC, 'oefenbeelden', r.slug, 'frames', String(m.maat))
        const bestanden = readdirSync(map).filter((b) => b.endsWith('.webp'))
        expect(bestanden.length, `${r.slug} ${m.maat}`).toBe(f.aantal)
        const som = bestanden.reduce((s, b) => s + statSync(join(map, b)).size, 0)
        expect(som, `${r.slug} ${m.maat}`).toBe(m.bytes)
        expect(m.bytes / 1048576, `${r.slug} ${m.maat}`).toBeLessThan(MAX_FRAMES_MB[m.maat as keyof typeof MAX_FRAMES_MB])
        expect(m.breedte / m.hoogte).toBeCloseTo(r.lus.breedte / r.lus.hoogte)
        totaal += m.bytes
        // Eerste en laatste beeld via frameUrl bestaan echt
        for (const i of [0, f.aantal - 1]) {
          const url = frameUrl(r, m.maat, i)
          expect(url).toMatch(/^\/oefenbeelden\/[a-z0-9-]+\/frames\/\d+\/f\d{3}\.webp\?v=[0-9a-f]{8}$/)
          expect(existsSync(pad(url!)), url).toBe(true)
        }
      }
      expect(totaal / 1048576, `${r.slug} totaal losse beelden`).toBeLessThan(MAX_FRAMES_TOTAAL_MB)
    }
  })

  it('fasen sluiten aan, lopen op en vallen binnen de lus', () => {
    for (const r of OEFENRENDERS) {
      const f = r.frames
      if (!f) continue
      // Wisselend (30-10-2026): links in de eerste helft, rechts in de tweede; samen de hele lus.
      const reeksen = f.fasenRechts ? [f.fasen, f.fasenRechts] : [f.fasen]
      let vorige = 0
      for (const fasen of reeksen) {
        for (const naam of FASE_VOLGORDE) {
          const [van, tot] = fasen[naam]
          expect(van, `${r.slug} ${naam}`).toBe(vorige)
          expect(tot, `${r.slug} ${naam}`).toBeGreaterThanOrEqual(van)
          vorige = tot
        }
      }
      expect(vorige, r.slug).toBe(f.aantal)
      // Een rep heeft echt een heen- en terugbeweging
      expect(faseLengte(f, 'heen'), r.slug).toBeGreaterThan(0)
      expect(faseLengte(f, 'terug'), r.slug).toBeGreaterThan(0)
      expect(['excentrisch', 'concentrisch']).toContain(f.heenIs)
      expect(['herhaling', 'vasthouden']).toContain(f.soort)
    }
    const soort = (slug: string) => OEFENRENDERS.find((r) => r.slug === slug)?.frames
    if (soort('plank')) expect(soort('plank')?.soort).toBe('vasthouden')
    if (soort('front-squat')) expect(soort('front-squat')?.heenIs).toBe('excentrisch')
    if (soort('barbell-curl')) expect(soort('barbell-curl')?.heenIs).toBe('concentrisch')
    if (soort('bird-dog')) expect(soort('bird-dog')?.fasenRechts, 'bird-dog wisselt af').not.toBeNull()
  })

  it('vloerlijn ligt laag in beeld: geen lege band onder de voeten', () => {
    for (const r of OEFENRENDERS) {
      if (r.vloerY === null) {
        expect(ZONDER_FRAMES).toContain(r.slug)
        continue
      }
      expect(r.vloerY, r.slug).toBeGreaterThan(0.9)
      expect(r.vloerY, r.slug).toBeLessThanOrEqual(1)
    }
  })

  it('frameUrl kiest de maat erboven en loopt rond', () => {
    const r = OEFENRENDERS.find((x) => x.frames)
    if (!r?.frames) return
    expect(frameUrl(r, 500, 0)).toContain('/frames/720/f000.webp')
    expect(frameUrl(r, 100, r.frames.aantal)).toContain('/frames/480/f000.webp')
    expect(frameUrl(r, 480, -1)).toContain(`/f${String(r.frames.aantal - 1).padStart(3, '0')}.webp`)
    expect(kiesFrameMaat(r.frames, 99999).maat).toBe(r.frames.maten[r.frames.maten.length - 1].maat)
  })

  it('maakt een srcset van klein naar groot zonder dubbele maten', () => {
    const b = (breedte: number) => ({ src: `/x-${breedte}.webp`, breedte, hoogte: breedte, bytes: 1 })
    expect(srcSetVan([b(1350), b(480), b(720), b(720)])).toBe('/x-480.webp 480w, /x-720.webp 720w, /x-1350.webp 1350w')
  })

  it('schrijft spieren als gewone zin', () => {
    expect(spierZin(['Bovenbenen'])).toBe('bovenbenen')
    expect(spierZin(['Bovenbenen', 'Bilspieren'])).toBe('bovenbenen en bilspieren')
    expect(spierZin(['Bovenbenen', 'Bilspieren', 'Romp'])).toBe('bovenbenen, bilspieren en romp')
  })
})
