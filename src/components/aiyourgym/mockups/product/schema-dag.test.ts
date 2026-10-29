import { describe, expect, it } from 'vitest'
import { OEFENRENDERS } from '@/components/aiyourgym/inhoud/oefenrenders'
import { dosering, reserve } from '@/lib/club/training/voorstel-regels'
import { DAG_B, UITGELICHT, rustTekst, schemaBlokken, tempoDelen, totaalSets, volgendeDag } from './schema-dag'

describe('voorbeeldschema op de voorpagina', () => {
  it('elke oefening van de dag heeft een eigen render', () => {
    const slugs = new Set(OEFENRENDERS.map((r) => r.slug))
    expect(DAG_B.filter((r) => !slugs.has(r.slug))).toEqual([])
    expect(DAG_B.some((r) => r.slug === UITGELICHT.slug)).toBe(true)
  })

  it('alle renders staan op dag B of bij de volgende dag', () => {
    const opDag = DAG_B.map((r) => r.slug)
    const volgende = volgendeDag(DAG_B, OEFENRENDERS).map((r) => r.slug)
    expect([...opDag, ...volgende].sort()).toEqual(OEFENRENDERS.map((r) => r.slug).sort())
  })

  it('een nieuwe render verschijnt vanzelf bij de volgende dag', () => {
    const nieuw = { ...OEFENRENDERS[0], slug: 'nieuwe-oefening', naam: 'Nieuwe oefening' }
    expect(volgendeDag(DAG_B, [...OEFENRENDERS, nieuw]).map((r) => r.slug)).toContain('nieuwe-oefening')
  })

  it('codes per blok, en een oefening zonder render laat geen gat', () => {
    const blokken = schemaBlokken(DAG_B, OEFENRENDERS)
    expect(blokken.flatMap((b) => b.regels.map((r) => r.code))).toEqual(['A1', 'B1', 'B2', 'C1', 'D1', 'D2', 'E1', 'E2'])
    const zonder = schemaBlokken(DAG_B, OEFENRENDERS.filter((r) => r.slug !== 'lunge-met-barbell'))
    expect(zonder.map((b) => b.letter)).toEqual(['A', 'B', 'C', 'D'])
    expect(totaalSets(blokken)).toBe(25)
  })

  it('de dosering klopt met de regels van het schemavoorstel (doel kracht, niveau 2)', () => {
    const hoofd = dosering('kracht', 'squat', 2)
    const squat = DAG_B[0]
    expect(squat.sets).toBe(hoofd.sets)
    expect(squat.rustSec).toBe(hoofd.rustSec)
    expect(squat.doel).toBeGreaterThanOrEqual(4)
    expect(squat.doel).toBeLessThanOrEqual(6)
    const iso = dosering('kracht', 'isolatie', 2)
    for (const slug of ['barbell-curl', 'glute-bridge']) {
      const r = DAG_B.find((x) => x.slug === slug)
      expect(r?.sets).toBe(iso.sets)
      expect(r?.doel).toBeGreaterThanOrEqual(8)
      expect(r?.doel).toBeLessThanOrEqual(10)
    }
    const plank = DAG_B.find((x) => x.slug === 'plank')
    expect(plank?.rir).toBe(reserve('kracht', 'core', 2))
    expect(plank?.doel).toBeGreaterThanOrEqual(30)
    expect(plank?.doel).toBeLessThanOrEqual(45)
    for (const r of DAG_B.filter((x) => x.slug !== 'plank')) expect(r.rir).toBe(reserve('kracht', 'squat', 2))
  })

  it('in een superset rust je pas na de laatste oefening', () => {
    for (const b of schemaBlokken(DAG_B, OEFENRENDERS).filter((x) => x.regels.length > 1)) {
      expect(b.regels.slice(0, -1).every((r) => r.rustSec === 0)).toBe(true)
      expect(b.regels[b.regels.length - 1].rustSec).toBeGreaterThan(0)
      expect(new Set(b.regels.map((r) => r.sets)).size).toBe(1)
    }
  })

  it('de zwaarste set loopt op naar het gewicht van vandaag', () => {
    const squat = DAG_B.find((r) => r.slug === UITGELICHT.slug)
    expect(UITGELICHT.zwaarste[UITGELICHT.zwaarste.length - 1]).toBe(squat?.kg)
  })

  it('tempo als balkjes', () => {
    expect(tempoDelen('3110')).toEqual([
      { soort: 'omlaag', sec: 3 },
      { soort: 'vast', sec: 1 },
      { soort: 'omhoog', sec: 1 },
    ])
    expect(tempoDelen(null)).toBeNull()
    expect(rustTekst(150)).toBe('2:30')
    expect(rustTekst(60)).toBe('1:00')
  })
})
