import { describe, expect, it } from 'vitest'
import type { Lid } from '@/lib/club/kern/lid'
import { bouwRijen, telTegels } from '@/lib/club/leden/lijst'
import { datumTekst, risicoLijst, wegTekst } from './risico'

const NU = new Date('2026-10-14T12:00:00Z')
const VANDAAG = '2026-10-14'

function lid(id: string, achternaam: string, deel: Partial<Lid> = {}): Lid {
  return {
    id, vestiging: 'budel', lidnummer: null, sportivityId: null, voornaam: 'Sam', achternaam, email: null, telefoon: null,
    geboortedatum: null, geslacht: null, abonnement: null, status: 'actief', lidSinds: '2024-01-01', einddatum: null, tags: [], coachId: null, demo: true,
    ...deel,
  }
}

function dagenGeleden(n: number): Date {
  return new Date(NU.getTime() - n * 86_400_000)
}

describe('leden met risico', () => {
  const leden = [
    lid('trouw', 'Aarts'),
    lid('weg', 'Bakker'),
    lid('nooit', 'Claes', { lidSinds: '2026-09-01' }),
    lid('pauze', 'Dekker', { status: 'gepauzeerd' }),
    lid('minder', 'Evers'),
  ]
  const bezoeken = new Map<string, Date[]>([
    ['trouw', [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 30, 35, 40, 50, 60].map(dagenGeleden)],
    ['weg', [40, 45, 50, 55, 60, 65, 70].map(dagenGeleden)],
    ['minder', [20, 33, 37, 41, 44, 48, 52, 56, 63, 70].map(dagenGeleden)],
  ])
  const rijen = bouwRijen(leden, bezoeken, new Map(), NU)

  it('gebruikt precies het risicolabel van de behoudsscore, zoals de ledenlijst', () => {
    const lijst = risicoLijst(rijen)
    expect(lijst.map((r) => r.lid.id)).toEqual(expect.arrayContaining(['weg', 'nooit']))
    expect(lijst.length).toBe(telTegels(rijen).risico)
    expect(lijst.every((r) => r.behoud.score < 45)).toBe(true)
    expect(lijst.map((r) => r.lid.id)).not.toContain('trouw')
    expect(lijst.map((r) => r.lid.id)).not.toContain('pauze')
  })

  it('zet de laagste score eerst en daarna wie het langst weg is', () => {
    const lijst = risicoLijst(rijen)
    for (let i = 1; i < lijst.length; i++) {
      const a = lijst[i - 1].behoud
      const b = lijst[i].behoud
      expect(a.score <= b.score).toBe(true)
      if (a.score === b.score) expect((a.dagenSinds ?? Infinity) >= (b.dagenSinds ?? Infinity)).toBe(true)
    }
  })
})

describe('hoe lang weg', () => {
  it('telt dagen en kent enkelvoud', () => {
    expect(wegTekst(23, undefined, null, VANDAAG)).toEqual({ getal: 23, tekst: 'dagen weg' })
    expect(wegTekst(1, undefined, null, VANDAAG)).toEqual({ getal: 1, tekst: 'dag weg' })
    expect(wegTekst(0, undefined, null, VANDAAG)).toEqual({ getal: null, tekst: 'Vandaag geweest' })
  })

  it('gebruikt het laatste bezoek ooit als het langer dan 12 weken geleden is', () => {
    expect(wegTekst(null, new Date('2026-06-01T10:00:00Z'), '2025-01-01', VANDAAG)).toEqual({ getal: 135, tekst: 'dagen weg' })
  })

  it('zegt eerlijk wanneer iemand nog nooit kwam', () => {
    expect(wegTekst(null, null, '2026-05-03', VANDAAG).tekst).toBe('Nog nooit geweest sinds inschrijving 3 mei')
    expect(wegTekst(null, null, '2025-05-03', VANDAAG).tekst).toBe('Nog nooit geweest sinds inschrijving 3 mei 2025')
    expect(wegTekst(null, null, null, VANDAAG).tekst).toBe('Nog nooit geweest')
    expect(wegTekst(null, undefined, '2026-05-03', VANDAAG).tekst).toBe('Langer dan 12 weken niet geweest')
  })

  it('schrijft een datum met jaartal alleen als het een ander jaar is', () => {
    expect(datumTekst('2026-10-01', VANDAAG)).toBe('1 okt')
    expect(datumTekst('2025-10-01', VANDAAG)).toBe('1 okt 2025')
  })
})
