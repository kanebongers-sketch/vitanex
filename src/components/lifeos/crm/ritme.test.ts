import { describe, expect, it } from 'vitest'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { RITME_DAGEN, verdeelRitme } from './ritme'

const VANDAAG = new Date(2026, 6, 20) // 20 juli 2026

function persoon(over: Partial<Persoon>): Persoon {
  return {
    id: over.id ?? crypto.randomUUID(),
    naam: over.naam ?? 'Test',
    groep: 'pt_team',
    status: over.status ?? 'actief',
    sortering: over.sortering ?? 0,
    followUpDatum: over.followUpDatum ?? null,
    telefoon: over.telefoon ?? null,
    email: over.email ?? null,
    bijzonderheden: over.bijzonderheden ?? null,
    laatsteContactOp: over.laatsteContactOp ?? null,
    aangemaaktOp: over.aangemaaktOp ?? '2026-01-01T00:00:00.000Z',
  }
}

function isoDagenGeleden(n: number): string {
  return new Date(2026, 6, 20 - n, 9).toISOString()
}

describe('verdeelRitme', () => {
  it('zet nooit-gesproken en ≥ RITME_DAGEN geleden in "teSpreken"', () => {
    const v = verdeelRitme(
      [
        persoon({ naam: 'nooit', laatsteContactOp: null }),
        persoon({ naam: 'oud', laatsteContactOp: isoDagenGeleden(RITME_DAGEN) }),
        persoon({ naam: 'grens', laatsteContactOp: isoDagenGeleden(RITME_DAGEN - 1) }),
        persoon({ naam: 'vers', laatsteContactOp: isoDagenGeleden(1) }),
      ],
      VANDAAG,
    )
    expect(v.teSpreken.map((p) => p.naam)).toEqual(expect.arrayContaining(['nooit', 'oud']))
    expect(v.gesproken.map((p) => p.naam)).toEqual(expect.arrayContaining(['grens', 'vers']))
    expect(v.teSpreken).toHaveLength(2)
    expect(v.gesproken).toHaveLength(2)
  })

  it('sorteert "teSpreken" met langst geleden (en nooit) bovenaan', () => {
    const v = verdeelRitme(
      [
        persoon({ naam: 'tien', laatsteContactOp: isoDagenGeleden(10) }),
        persoon({ naam: 'nooit', laatsteContactOp: null }),
        persoon({ naam: 'dertig', laatsteContactOp: isoDagenGeleden(30) }),
      ],
      VANDAAG,
    )
    expect(v.teSpreken.map((p) => p.naam)).toEqual(['nooit', 'dertig', 'tien'])
  })

  it('sorteert "gesproken" met meest recent bovenaan', () => {
    const v = verdeelRitme(
      [
        persoon({ naam: 'gisteren', laatsteContactOp: isoDagenGeleden(1) }),
        persoon({ naam: 'vandaag', laatsteContactOp: isoDagenGeleden(0) }),
        persoon({ naam: 'vijf', laatsteContactOp: isoDagenGeleden(5) }),
      ],
      VANDAAG,
    )
    expect(v.gesproken.map((p) => p.naam)).toEqual(['vandaag', 'gisteren', 'vijf'])
  })

  it('muteert de invoer niet en werkt op een lege lijst', () => {
    const mensen = [persoon({ naam: 'a', laatsteContactOp: null })]
    const kopie = [...mensen]
    verdeelRitme(mensen, VANDAAG)
    expect(mensen).toEqual(kopie)
    expect(verdeelRitme([], VANDAAG)).toEqual({ teSpreken: [], gesproken: [] })
  })
})
