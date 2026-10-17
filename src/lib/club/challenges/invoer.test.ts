import { describe, expect, it } from 'vitest'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { leesChallenge, leesLidId, leesWijziging } from './invoer'

const vestigingen: VestigingInfo[] = [
  { sleutel: 'budel', naam: 'Budel', standaard: true },
  { sleutel: 'eersel', naam: 'Eersel', standaard: false },
]

const goed = {
  titel: '  12 keer   in oktober ',
  uitleg: 'Kom vaak.',
  soort: 'bezoeken',
  doel: 12,
  start: '2026-10-01',
  eind: '2026-10-31',
  vestigingen: ['budel'],
  deelname: 'automatisch',
  zichtbaarApp: true,
  ranglijst: true,
}

describe('leesChallenge', () => {
  it('accepteert een goede challenge en maakt de titel schoon', () => {
    // Act
    const uit = leesChallenge(goed, vestigingen)
    // Assert
    expect(uit.ok).toBe(true)
    if (uit.ok) {
      expect(uit.waarde.titel).toBe('12 keer in oktober')
      expect(uit.waarde.vestigingen).toEqual(['budel'])
    }
  })

  it('alle vestigingen aangevinkt wordt een lege lijst (alle)', () => {
    const uit = leesChallenge({ ...goed, vestigingen: ['budel', 'eersel'] }, vestigingen)
    expect(uit.ok && uit.waarde.vestigingen).toEqual([])
  })

  it.each([
    [{ titel: '' }, 'titel'],
    [{ soort: 'stappen' }, 'telt'],
    [{ doel: 0 }, 'doel'],
    [{ doel: 2.5 }, 'doel'],
    [{ eind: '2026-09-01' }, 'einddatum'],
    [{ eind: '2028-01-01' }, 'jaar'],
    [{ vestigingen: ['onbekend'] }, 'vestiging'],
    [{ deelname: 'soms' }, 'meedoen'],
    [{ soort: 'weken_op_rij', doel: 9 }, 'weken'],
  ])('weigert %o', (over, woord) => {
    const uit = leesChallenge({ ...goed, ...over }, vestigingen)
    expect(uit.ok).toBe(false)
    if (!uit.ok) expect(uit.fout.toLowerCase()).toContain(woord)
  })

  it('weigert iets dat geen object is', () => {
    expect(leesChallenge('x', vestigingen).ok).toBe(false)
  })
})

describe('leesWijziging en leesLidId', () => {
  it('herkent stoppen', () => {
    expect(leesWijziging({ actie: 'stoppen' }, vestigingen)).toEqual({ ok: true, waarde: { soort: 'stoppen' } })
  })

  it('leest anders de hele challenge', () => {
    const uit = leesWijziging(goed, vestigingen)
    expect(uit.ok && uit.waarde.soort).toBe('wijzigen')
  })

  it('accepteert alleen een uuid als lid', () => {
    expect(leesLidId({ lidId: '67b0a700-3f1d-425e-9646-98c237e34fd7' }).ok).toBe(true)
    expect(leesLidId({ lidId: '1; drop' }).ok).toBe(false)
  })
})
