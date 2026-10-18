import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { LESTYPE_SCHEMA, SERIE_SCHEMA, leesNieuw } from '@/lib/club/instellingen/validatie'
import { VOORBEELD_LESSEN, VOORBEELD_LESTYPEN, lesVoorstellen, zelfdeNaam } from './voorbeelden'

describe('voorbeeldlestypen', () => {
  it('slaagt voor dezelfde controle als de API', () => {
    for (const v of VOORBEELD_LESTYPEN) {
      const uit = leesNieuw({ naam: v.naam, omschrijving: v.omschrijving, soort: v.soort, duurMin: v.duurMin, intensiteit: v.intensiteit }, LESTYPE_SCHEMA, { actief: true })
      expect(uit.ok, v.naam).toBe(true)
    }
  })

  it('heeft unieke namen', () => {
    const namen = VOORBEELD_LESTYPEN.map((v) => v.naam.toLowerCase())
    expect(new Set(namen).size).toBe(namen.length)
  })

  it('heeft voor elke voorbeeldles een bestaand lestype', () => {
    for (const les of VOORBEELD_LESSEN) expect(VOORBEELD_LESTYPEN.some((t) => zelfdeNaam(t.naam, les.lestype)), les.lestype).toBe(true)
  })

  it('maakt geldige vaste lessen voor de API', () => {
    for (const les of VOORBEELD_LESSEN) {
      const body = { lestypeId: '00000000-0000-4000-8000-000000000001', weekdag: les.weekdag, starttijd: les.starttijd, duurMin: 45, capaciteit: les.capaciteit, vanaf: '2026-10-19' }
      expect(leesNieuw(body, SERIE_SCHEMA, { actief: true, zaalId: null, instructeurId: null, tot: null }).ok, `${les.lestype} ${les.starttijd}`).toBe(true)
    }
  })
})

describe('lesVoorstellen', () => {
  const lestypen = [
    { id: 'a', naam: 'spinning ', duurMin: 50 },
    { id: 'b', naam: 'Yoga', duurMin: 60 },
  ]

  it('toont alleen lessen van lestypen die er zijn, met hun eigen duur', () => {
    const uit = lesVoorstellen(lestypen, [])
    expect(uit.map((l) => l.lestype)).toEqual(['Spinning', 'Yoga', 'Spinning'])
    expect(uit[0]).toMatchObject({ lestypeId: 'a', duurMin: 50, bestaat: false })
  })

  it('ziet een les die al in het rooster staat', () => {
    const uit = lesVoorstellen(lestypen, [{ lestypeId: 'a', weekdag: 1, starttijd: '19:00:00' }])
    expect(uit.find((l) => l.weekdag === 1)?.bestaat).toBe(true)
    expect(uit.find((l) => l.weekdag === 6)?.bestaat).toBe(false)
  })

  it('is leeg zonder lestypen', () => {
    expect(lesVoorstellen([], [])).toEqual([])
  })
})

// Schrijfstijl van de wizard: geen gedachtestreepjes en geen klemtoon-accenten in zichtbare tekst.
const MAPPEN = ['src/lib/club/start', 'src/components/club/start', 'src/app/clubkane/start']
const VERBODEN = /[—–]/
const ACCENT = /[\p{L}]*[áéíóúÁÉÍÓÚ][\p{L}]*/gu
const TOEGESTAAN = new Set(['privé', 'café'])

function bestanden(map: string): string[] {
  try {
    return readdirSync(map).flatMap((naam) => {
      const vol = path.join(map, naam)
      if (statSync(vol).isDirectory()) return bestanden(vol)
      return /\.tsx?$/.test(naam) && !naam.endsWith('.test.ts') ? [vol] : []
    })
  } catch {
    return []
  }
}

describe('tekststijl van de wizard', () => {
  it('bevat geen gedachtestreepjes of klemtoon-accenten', () => {
    const fout = MAPPEN.flatMap(bestanden).flatMap((bestand) =>
      readFileSync(bestand, 'utf8')
        .split('\n')
        .filter((regel) => !/^\s*(\/\/|\*|\/\*)/.test(regel))
        .filter((regel) => VERBODEN.test(regel) || (regel.match(ACCENT) ?? []).some((w) => !TOEGESTAAN.has(w.toLowerCase())))
        .map((regel) => `${bestand}: ${regel.trim().slice(0, 90)}`),
    )
    expect(fout).toEqual([])
  })
})
