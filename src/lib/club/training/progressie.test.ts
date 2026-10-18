import { describe, expect, it } from 'vitest'
import { bereik, progressieOverzicht, sessiesUit, suggestie, toonSessie, verloop, werkgewicht, type GelogdeSet, type Sessie } from './progressie'

function sessie(id: string, op: string, gewicht: number | null, herh: (number | null)[], tijd: (number | null)[] = []): Sessie {
  return {
    trainingId: id,
    op,
    sets: herh.map((h, i) => ({ trainingId: id, op, setNr: i + 1, herhalingen: h, gewichtKg: gewicht, tijdSec: tijd[i] ?? null })),
  }
}

const V = { sets: 3, herhalingen: '8-10', tijdSec: null }

describe('bereik', () => {
  it('leest bereiken en losse getallen', () => {
    expect(bereik('8-10')).toEqual({ laag: 8, hoog: 10 })
    expect(bereik('8 tot 10')).toEqual({ laag: 8, hoog: 10 })
    expect(bereik('12')).toEqual({ laag: 12, hoog: 12 })
    expect(bereik('AMRAP')).toBeNull()
    expect(bereik('30 sec')).toBeNull()
    expect(bereik('10-8')).toBeNull()
    expect(bereik(null)).toBeNull()
  })
})

describe('dubbele progressie', () => {
  it('alle sets bovenaan: gewicht de kleinste stap omhoog, terug naar onderaan', () => {
    const s = suggestie(V, 'barbell', [sessie('t1', '2026-10-01', 40, [10, 10, 10])])
    expect(s).toMatchObject({ soort: 'gewicht_omhoog', gewichtKg: 42.5, doel: '8, 8, 8' })
    expect(suggestie(V, 'dumbbell', [sessie('t1', '2026-10-01', 12, [10, 10, 10])]).gewichtKg).toBe(14)
    expect(suggestie(V, 'machine', [sessie('t1', '2026-10-01', 35, [10, 11, 10])]).gewichtKg).toBe(40)
  })

  it('binnen het bereik: zelfde gewicht, per set een herhaling meer tot de bovenkant', () => {
    const s = suggestie(V, 'barbell', [sessie('t1', '2026-10-01', 40, [10, 9, 8])])
    expect(s).toMatchObject({ soort: 'herhalingen_omhoog', gewichtKg: 40, doel: '10, 10, 9' })
  })

  it('een set te weinig gelogd telt niet als alles gehaald', () => {
    expect(suggestie(V, 'barbell', [sessie('t1', '2026-10-01', 40, [10, 10])]).soort).toBe('vasthouden')
  })

  it('onder het bereik: vasthouden, twee keer op rij: een stap terug', () => {
    const een = [sessie('t1', '2026-10-01', 40, [8, 7, 6])]
    expect(suggestie(V, 'barbell', een)).toMatchObject({ soort: 'vasthouden', gewichtKg: 40 })
    const twee = [...een, sessie('t2', '2026-10-08', 40, [8, 7, 7])]
    expect(suggestie(V, 'barbell', twee)).toMatchObject({ soort: 'gewicht_omlaag', gewichtKg: 37.5 })
  })

  it('zonder extra gewicht: een zwaardere variant', () => {
    expect(suggestie(V, 'geen', [sessie('t1', '2026-10-01', null, [10, 12, 10])]).soort).toBe('zwaardere_variant')
  })

  it('op tijd: 5 seconden erbij als alle sets gehaald zijn', () => {
    const v = { sets: 3, herhalingen: null, tijdSec: 30 }
    expect(suggestie(v, 'geen', [sessie('t1', '2026-10-01', null, [null, null, null], [30, 32, 30])])).toMatchObject({ soort: 'tijd_omhoog', doel: '35 sec' })
    expect(suggestie(v, 'geen', [sessie('t1', '2026-10-01', null, [null, null, null], [30, 25, 30])]).soort).toBe('vasthouden')
  })

  it('zonder gegevens of bereik: geen verzonnen advies', () => {
    expect(suggestie(V, 'barbell', []).soort).toBe('start')
    expect(suggestie({ sets: 3, herhalingen: 'AMRAP', tijdSec: null }, 'barbell', [sessie('t1', '2026-10-01', 40, [12, 10, 9])]).soort).toBe('vasthouden')
  })
})

describe('sessies en verloop', () => {
  const sets: GelogdeSet[] = [
    { trainingId: 'b', op: '2026-10-08T17:00:00Z', setNr: 2, herhalingen: 9, gewichtKg: 42.5, tijdSec: null },
    { trainingId: 'a', op: '2026-10-01T17:00:00Z', setNr: 1, herhalingen: 10, gewichtKg: 40, tijdSec: null },
    { trainingId: 'b', op: '2026-10-08T17:00:00Z', setNr: 1, herhalingen: 8, gewichtKg: 42.5, tijdSec: null },
  ]

  it('groepeert per training, oudste eerst, sets op volgorde', () => {
    const s = sessiesUit(sets)
    expect(s.map((x) => x.trainingId)).toEqual(['a', 'b'])
    expect(s[1].sets.map((x) => x.setNr)).toEqual([1, 2])
    expect(toonSessie(s[1])).toBe('42,5 kg: 8, 9')
  })

  it('werkgewicht is het meest gebruikte, bij gelijkspel het zwaarste', () => {
    const s = sessie('x', 'o', 0, [])
    const mix = (w: number[]) => werkgewicht(w.map((g, i) => ({ ...s, trainingId: 'x', op: 'o', setNr: i + 1, herhalingen: 8, gewichtKg: g, tijdSec: null })))
    expect(mix([20, 25, 25])).toBe(25)
    expect(mix([20, 25])).toBe(25)
    expect(mix([])).toBeNull()
  })

  it('maakt een reeks voor de grafiek', () => {
    expect(verloop(sessiesUit(sets)).map((p) => p.waarde)).toEqual([40, 42.5])
    expect(verloop([sessie('t', 'o', null, [12, 14])])[0]).toMatchObject({ waarde: 14, eenheid: 'herh' })
  })
})

describe('progressieOverzicht', () => {
  it('een regel per oefening, zonder cardio, met suggestie', () => {
    const logs = new Map([['a', sessie('t1', '2026-10-01', 40, [10, 10, 10]).sets]])
    const oef = new Map([
      ['a', { naam: 'Back squat', materiaal: 'barbell' as const }],
      ['c', { naam: 'Crosstrainer', materiaal: 'cardio_apparaat' as const }],
      ['b', { naam: 'Plank', materiaal: 'geen' as const }],
    ])
    const uit = progressieOverzicht(
      [{ oefeningId: 'a', ...V }, { oefeningId: 'c', ...V }, { oefeningId: 'a', ...V }, { oefeningId: 'b', sets: 3, herhalingen: null, tijdSec: 30 }],
      oef,
      logs,
    )
    expect(uit.map((r) => r.naam)).toEqual(['Back squat', 'Plank'])
    expect(uit[0]).toMatchObject({ aantal: 1, laatste: '40 kg: 10, 10, 10', eenheid: 'kg', suggestie: { soort: 'gewicht_omhoog', gewichtKg: 42.5 } })
    expect(uit[1]).toMatchObject({ aantal: 0, laatste: null, suggestie: { soort: 'start' } })
  })
})
