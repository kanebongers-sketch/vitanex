import { describe, expect, test } from 'vitest'
import {
  coachSchrijfAgenda,
  extraCoachAgenda,
  isCoachAgendaNaam,
  isCoachgesprekTitel,
  ontdubbelEvents,
  teLezenAgendas,
  vindCoachAgenda,
  type AgendaInLijst,
  type CoachAgenda,
} from './coach-agenda'

const agenda = (naam: string, extra: Partial<AgendaInLijst> = {}): AgendaInLijst => ({
  id: extra.id ?? `id-${naam}`,
  naam,
  primair: extra.primair ?? false,
  toegang: extra.toegang ?? 'owner',
})

const COACH: CoachAgenda = { id: 'coach@group', primair: false, schrijfbaar: true }

describe('isCoachAgendaNaam', () => {
  test('exacte naam telt', () => {
    expect(isCoachAgendaNaam('Coachgesprekken PT')).toBe(true)
  })
  test('hoofdletterongevoelig en spaties eromheen getrimd', () => {
    expect(isCoachAgendaNaam('  coachgesprekken pt ')).toBe(true)
  })
  test('een andere naam telt niet', () => {
    expect(isCoachAgendaNaam('Coachgesprekken')).toBe(false)
    expect(isCoachAgendaNaam('Coachgesprekken PT oud')).toBe(false)
    expect(isCoachAgendaNaam('Coachgesprek PT')).toBe(false)
  })
})

describe('vindCoachAgenda', () => {
  test('vindt de agenda op naam', () => {
    const lijst = [agenda('kane@gmail.com', { primair: true }), agenda(' COACHGESPREKKEN PT', { id: 'c1' })]
    expect(vindCoachAgenda(lijst)).toEqual({ id: 'c1', primair: false, schrijfbaar: true })
  })
  test('geen agenda met die naam: null', () => {
    expect(vindCoachAgenda([agenda('Werk'), agenda('Privé')])).toBeNull()
    expect(vindCoachAgenda([])).toBeNull()
  })
  test('alleen-lezen agenda is niet schrijfbaar', () => {
    expect(vindCoachAgenda([agenda('Coachgesprekken PT', { toegang: 'reader' })])?.schrijfbaar).toBe(false)
  })
  test('writer is schrijfbaar', () => {
    expect(vindCoachAgenda([agenda('Coachgesprekken PT', { toegang: 'writer' })])?.schrijfbaar).toBe(true)
  })
  test('bij twee met dezelfde naam telt de eerste', () => {
    const lijst = [agenda('Coachgesprekken PT', { id: 'a' }), agenda('Coachgesprekken PT', { id: 'b' })]
    expect(vindCoachAgenda(lijst)?.id).toBe('a')
  })
})

describe('teLezenAgendas', () => {
  test('zonder coachagenda alleen de gekozen agenda', () => {
    expect(teLezenAgendas(null, null)).toEqual([null])
    expect(teLezenAgendas('werk', null)).toEqual(['werk'])
  })
  test('met coachagenda beide, gekozen eerst', () => {
    expect(teLezenAgendas(null, COACH)).toEqual([null, 'coach@group'])
    expect(teLezenAgendas('werk', COACH)).toEqual(['werk', 'coach@group'])
  })
  test('is de coachagenda al de gekozen agenda, dan een keer', () => {
    expect(teLezenAgendas('coach@group', COACH)).toEqual(['coach@group'])
  })
  test('primaire coachagenda met gekozen null (primary) telt een keer', () => {
    expect(teLezenAgendas(null, { ...COACH, primair: true })).toEqual([null])
  })
  test('extraCoachAgenda volgt dezelfde regel', () => {
    expect(extraCoachAgenda(null, null)).toBeNull()
    expect(extraCoachAgenda(null, COACH)).toBe('coach@group')
    expect(extraCoachAgenda('coach@group', COACH)).toBeNull()
  })
})

describe('coachSchrijfAgenda', () => {
  test('schrijft in de coachagenda als die bestaat', () => {
    expect(coachSchrijfAgenda(null, COACH)).toBe('coach@group')
    expect(coachSchrijfAgenda('werk', COACH)).toBe('coach@group')
  })
  test('zonder coachagenda in de gekozen agenda', () => {
    expect(coachSchrijfAgenda(null, null)).toBeNull()
    expect(coachSchrijfAgenda('werk', null)).toBe('werk')
  })
  test('alleen-lezen coachagenda: terug naar de gekozen agenda', () => {
    expect(coachSchrijfAgenda('werk', { ...COACH, schrijfbaar: false })).toBe('werk')
  })
})

describe('isCoachgesprekTitel', () => {
  test('herkent de vaste titel', () => {
    expect(isCoachgesprekTitel('Coachgesprek PT - Kane (Iris)')).toBe(true)
    expect(isCoachgesprekTitel('coachgesprek pt')).toBe(true)
  })
  test('andere afspraken niet', () => {
    expect(isCoachgesprekTitel('Training Iris')).toBe(false)
    expect(isCoachgesprekTitel('Coachgesprek met Iris')).toBe(false)
    expect(isCoachgesprekTitel(null)).toBe(false)
    expect(isCoachgesprekTitel('')).toBe(false)
  })
})

describe('ontdubbelEvents', () => {
  const ev = (externId: string, titel: string | null, iso: string) => ({ externId, titel, startOp: new Date(iso) })

  test('voegt samen en sorteert op starttijd', () => {
    const gekozen = [ev('a', 'Lunch', '2026-10-22T12:00:00Z')]
    const coach = [ev('b', 'Coachgesprek PT - Kane (Iris)', '2026-10-22T09:00:00Z')]
    expect(ontdubbelEvents([gekozen, coach]).map((e) => e.externId)).toEqual(['b', 'a'])
  })
  test('hetzelfde Google-id in beide agenda telt een keer, de gekozen agenda wint', () => {
    const gekozen = [{ ...ev('x', 'Coachgesprek PT - Kane (Iris)', '2026-10-22T09:00:00Z'), bron: 'gekozen' }]
    const coach = [{ ...ev('x', 'Coachgesprek PT - Kane (Iris)', '2026-10-22T09:00:00Z'), bron: 'coach' }]
    const uit = ontdubbelEvents([gekozen, coach])
    expect(uit).toHaveLength(1)
    expect(uit[0].bron).toBe('gekozen')
  })
  test('een kopie met dezelfde titel en starttijd telt een keer', () => {
    const gekozen = [ev('x', 'Coachgesprek PT - Kane (Iris)', '2026-10-22T09:00:00Z')]
    const coach = [ev('y', ' coachgesprek pt - kane (iris) ', '2026-10-22T09:00:00Z')]
    expect(ontdubbelEvents([gekozen, coach])).toHaveLength(1)
  })
  test('zelfde titel op een ander moment telt wel twee keer', () => {
    const gekozen = [ev('x', 'Coachgesprek PT - Kane (Iris)', '2026-10-22T09:00:00Z')]
    const coach = [ev('y', 'Coachgesprek PT - Kane (Iris)', '2026-10-29T09:00:00Z')]
    expect(ontdubbelEvents([gekozen, coach])).toHaveLength(2)
  })
  test('lege lijsten geven een lege lijst', () => {
    expect(ontdubbelEvents([[], []])).toEqual([])
  })
})
