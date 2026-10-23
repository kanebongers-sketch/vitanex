import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { coachingVoor } from '@/lib/club/training/coaching'
import { OEFENRENDERS, renderVoor, spierZin } from './oefenrenders'

// De renders op de website: elke render hoort bij een echte oefening uit de
// bibliotheek (met coaching), alle bestanden staan in public/ en blijven
// licht genoeg voor een snelle pagina.

const PUBLIC = join(process.cwd(), 'public')
/** Bovengrens per bestand: de grote lus mag het zwaarst zijn. */
const MAX_KB = { lus: 700, lusKlein: 400, begin: 60, piek: 60 } as const

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
    }
  })

  it('schrijft spieren als gewone zin', () => {
    expect(spierZin(['Bovenbenen'])).toBe('bovenbenen')
    expect(spierZin(['Bovenbenen', 'Bilspieren'])).toBe('bovenbenen en bilspieren')
    expect(spierZin(['Bovenbenen', 'Bilspieren', 'Romp'])).toBe('bovenbenen, bilspieren en romp')
  })
})
