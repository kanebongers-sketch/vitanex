import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { OEFENRENDER_DATA } from '@/components/aiyourgym/inhoud/oefenrenders.data'
import { BEWEGING, behoudNeutraal, doelMapVan, framesBronVan, leesArgs } from '../../../../../scripts/oefenbeelden-web.mjs'

// Het webscript: twee figuren (besluit Kane 06-11-2026) en de lijst bewegingen.

const NIEUW = [
  'cable-fly-van-laag-naar-hoog', 'cable-fly-van-hoog-naar-laag', 'reverse-fly-aan-de-kabel', 'lat-pulldown-met-brede-greep',
  'hanging-leg-raise', 'dead-hang', 'scapula-pull-up', 'front-raise-aan-de-kabel', 'eenarmige-seated-cable-row',
  'triceps-pushdown-met-een-arm', 'bayesian-curl-aan-de-kabel', 'woodchop-aan-de-kabel',
]

const beweging = BEWEGING as Record<string, { heen_is: string; soort: string }>

describe('oefenbeelden-web', () => {
  it('kent standaard het figuur kane en weigert een onbekend figuur', () => {
    expect(leesArgs(['back-squat'])).toMatchObject({ figuur: 'kane', slugs: ['back-squat'] })
    expect(leesArgs(['--figuur', 'neutraal', 'plank'])).toMatchObject({ figuur: 'neutraal', slugs: ['plank'] })
    expect(() => leesArgs(['--figuur', 'iemand'])).toThrow(/onbekend figuur/)
  })

  it('neutraal leest uit uit/neutraal en schrijft onder oefenbeelden/neutraal', () => {
    expect(framesBronVan('uit', 'kane')).toBe('uit')
    expect(framesBronVan('uit', 'neutraal')).toBe(join('uit', 'neutraal'))
    expect(doelMapVan('doel', 'plank', 'kane')).toBe(join('doel', 'plank'))
    expect(doelMapVan('doel', 'plank', 'neutraal')).toBe(join('doel', 'neutraal', 'plank'))
  })

  it('geen oefening heet neutraal: de map botst nooit met een slug', () => {
    expect(OEFENRENDER_DATA.map((d) => d.slug)).not.toContain('neutraal')
    expect(Object.keys(beweging)).not.toContain('neutraal')
  })

  it('een nieuwe render van kane houdt het blok neutraal, behalve bij een ander aantal beelden', () => {
    const n = { versie: 'abcd1234' }
    const oud = { slug: 'x', neutraal: n, frames: { aantal: 72 } }
    expect(behoudNeutraal({ slug: 'x', frames: { aantal: 72 } }, oud)).toEqual({ slug: 'x', frames: { aantal: 72 }, neutraal: n })
    expect(behoudNeutraal({ slug: 'x', frames: { aantal: 96 } }, oud)).toEqual({ slug: 'x', frames: { aantal: 96 } })
    expect(behoudNeutraal({ slug: 'x', frames: { aantal: 72 } }, undefined)).toEqual({ slug: 'x', frames: { aantal: 72 } })
  })

  it('elke oefening heeft een beweging, ook de 12 nieuwe', () => {
    for (const slug of [...NIEUW, ...OEFENRENDER_DATA.map((d) => d.slug)]) {
      expect(['excentrisch', 'concentrisch'], slug).toContain(beweging[slug]?.heen_is)
      expect(['herhaling', 'vasthouden'], slug).toContain(beweging[slug]?.soort)
    }
    expect(beweging['dead-hang'].soort).toBe('vasthouden')
  })
})
