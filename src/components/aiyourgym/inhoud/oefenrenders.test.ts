import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { coachingVoor } from '@/lib/club/training/coaching'
import { OEFENRENDERS, renderVoor, spierZin, srcSetVan } from './oefenrenders'

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
 * in scripts/oefenbeelden-web.mjs afwegen.
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
        expect(b.bytes / 1024, b.src).toBeLessThan(MAX_KB[sleutel])
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
