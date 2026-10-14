import { describe, expect, it } from 'vitest'
import { behoudVoorLid, berekenBehoud, labelVoorScore, noShowTekst, perWeekTekst } from './behoud'

const NU = new Date('2026-10-14T12:00:00+02:00')

/** Bezoeken op `dagenGeleden` (om 10:00 Nederlandse tijd). */
function op(...dagenGeleden: number[]): Date[] {
  return dagenGeleden.map((d) => new Date(NU.getTime() - d * 86_400_000 - 2 * 3_600_000))
}

/** `perWeek` bezoeken per week tussen `van` en `tot` dagen geleden. */
function regelmatig(perWeek: number, van: number, tot: number): Date[] {
  const stap = 7 / perWeek
  const dagen: number[] = []
  for (let d = van; d < tot; d += stap) dagen.push(Math.round(d))
  return op(...dagen)
}

const LANG_LID = '2023-01-01'

describe('berekenBehoud', () => {
  it('geeft een trouw lid (2x per week, stabiel) de volle score', () => {
    const b = berekenBehoud({ bezoeken: regelmatig(2, 1, 84), noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.score).toBe(100)
    expect(b.label).toBe('goed')
    expect(b.uitleg).toBe('Komt ongeveer 2x per week, stabiel')
  })

  it('ziet een lid dat 3x per week kwam en 2 weken wegblijft als risico', () => {
    const bezoeken = [...regelmatig(3, 28, 84), ...op(15, 17, 20, 22, 25, 27)]
    const b = berekenBehoud({ bezoeken, noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.dagenSinds).toBe(15)
    expect(b.uitleg).toBe('Kwam ongeveer 3x per week, nu al 2 weken niet')
    expect(b.label).not.toBe('goed')
  })

  it('geeft een lid dat 12 weken niet kwam een risico met uitleg', () => {
    const b = berekenBehoud({ bezoeken: [], noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.label).toBe('risico')
    expect(b.dagenSinds).toBeNull()
    expect(b.uitleg).toBe('Geen bezoek in de laatste 12 weken')
  })

  it('zegt bij een nieuw lid zonder bezoek dat het nog niet geweest is', () => {
    const b = berekenBehoud({ bezoeken: [], noShows: 0, lidSinds: '2026-10-04', nu: NU })
    expect(b.uitleg).toBe('Nog niet geweest sinds de inschrijving')
    expect(b.label).toBe('risico')
  })

  it('rekent een nieuw lid met bezoek eerlijk per week sinds de inschrijving', () => {
    const b = berekenBehoud({ bezoeken: op(1, 4), noShows: 0, lidSinds: '2026-10-08', nu: NU })
    expect(b.eerderPerWeek).toBeNull()
    expect(b.recentPerWeek).toBe(2)
    expect(b.uitleg).toBe('Nieuw lid, komt ongeveer 2x per week')
    expect(b.label).toBe('goed')
  })

  it('telt twee check-ins op dezelfde dag als een bezoek', () => {
    const dubbel = [...op(2), ...op(2)]
    const b = berekenBehoud({ bezoeken: dubbel, noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.recentPerWeek).toBe(0.25)
  })

  it('negeert bezoeken buiten 12 weken en in de toekomst', () => {
    const b = berekenBehoud({ bezoeken: op(100, -3), noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.dagenSinds).toBeNull()
  })

  it('trekt punten af voor no-shows en noemt ze', () => {
    const basis = { bezoeken: regelmatig(2, 1, 84), lidSinds: LANG_LID, nu: NU }
    expect(berekenBehoud({ ...basis, noShows: 0 }).onderdelen.noShows).toBe(10)
    expect(berekenBehoud({ ...basis, noShows: 1 }).onderdelen.noShows).toBe(6)
    const veel = berekenBehoud({ ...basis, noShows: 5 })
    expect(veel.onderdelen.noShows).toBe(0)
    expect(veel.uitleg).toBe('Komt ongeveer 2x per week, stabiel. 5 keer niet gekomen bij een geboekte les')
    expect(berekenBehoud({ ...basis, noShows: 1 }).uitleg).toBe('Komt ongeveer 2x per week, stabiel. Een keer niet gekomen bij een geboekte les')
  })

  it('meldt een daling zonder lange afwezigheid', () => {
    const bezoeken = [...regelmatig(3, 28, 84), ...op(3, 17)]
    const b = berekenBehoud({ bezoeken, noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.uitleg).toBe('Kwam ongeveer 3x per week, nu minder dan 1x per week')
    expect(b.onderdelen.trend).toBeLessThan(10)
  })

  it('meldt het als iemand vaker komt', () => {
    const bezoeken = [...regelmatig(1, 28, 84), ...regelmatig(3, 1, 28)]
    const b = berekenBehoud({ bezoeken, noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.uitleg).toBe('Komt vaker: ongeveer 3x per week (was ongeveer 1x per week)')
  })

  it('geeft lid-duur punten naar hoe lang iemand lid is', () => {
    const bezoeken = regelmatig(2, 1, 84)
    expect(berekenBehoud({ bezoeken, noShows: 0, lidSinds: '2026-09-01', nu: NU }).onderdelen.lidDuur).toBe(0)
    expect(berekenBehoud({ bezoeken, noShows: 0, lidSinds: '2026-03-01', nu: NU }).onderdelen.lidDuur).toBe(3)
    expect(berekenBehoud({ bezoeken, noShows: 0, lidSinds: null, nu: NU }).onderdelen.lidDuur).toBe(3)
  })

  it('houdt de score tussen 0 en 100 en de onderdelen tellen op', () => {
    const b = berekenBehoud({ bezoeken: op(9, 30, 40), noShows: 2, lidSinds: LANG_LID, nu: NU })
    const som = Object.values(b.onderdelen).reduce((s, p) => s + p, 0)
    expect(b.score).toBe(som)
    expect(b.score).toBeGreaterThanOrEqual(0)
    expect(b.score).toBeLessThanOrEqual(100)
  })
})

describe('labelVoorScore en perWeekTekst', () => {
  it('legt de grenzen vast', () => {
    expect(labelVoorScore(70)).toBe('goed')
    expect(labelVoorScore(69)).toBe('let_op')
    expect(labelVoorScore(45)).toBe('let_op')
    expect(labelVoorScore(44)).toBe('risico')
  })

  it('rondt af op hele of halve keren in gewone taal', () => {
    expect(perWeekTekst(0)).toBe('niet')
    expect(perWeekTekst(Number.NaN)).toBe('niet')
    expect(perWeekTekst(0.25)).toBe('minder dan 1x per week')
    expect(perWeekTekst(0.74)).toBe('minder dan 1x per week')
    expect(perWeekTekst(0.8)).toBe('ongeveer 1x per week')
    expect(perWeekTekst(1.3)).toBe('ongeveer 1,5x per week')
    expect(perWeekTekst(2)).toBe('ongeveer 2x per week')
  })

  it('maakt van extreme waarden eerlijke woorden in plaats van 7x per week', () => {
    expect(perWeekTekst(5.6)).toBe('bijna elke dag')
    expect(perWeekTekst(7)).toBe('elke dag')
    expect(perWeekTekst(12)).toBe('elke dag')
  })

  it('schrijft no-shows als een keer of n keer', () => {
    expect(noShowTekst(0)).toBe('Altijd gekomen bij een geboekte les')
    expect(noShowTekst(1)).toBe('Een keer niet gekomen bij een geboekte les')
    expect(noShowTekst(3)).toBe('3 keer niet gekomen bij een geboekte les')
  })
})

describe('extreme en rare invoer', () => {
  it('telt een lid dat elke dag komt als elke dag, niet als meer', () => {
    const b = berekenBehoud({ bezoeken: op(...Array.from({ length: 84 }, (_, i) => i)), noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.recentPerWeek).toBe(7)
    expect(b.uitleg).toBe('Komt elke dag, stabiel')
    expect(b.score).toBe(100)
  })

  it('zegt "komt weinig" bij minder dan een keer per week', () => {
    const b = berekenBehoud({ bezoeken: op(5, 40, 70), noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.uitleg).toBe('Komt weinig: minder dan 1x per week')
  })

  it('noemt weken bij lange afwezigheid zonder eerder ritme', () => {
    const b = berekenBehoud({ bezoeken: op(20), noShows: 0, lidSinds: LANG_LID, nu: NU })
    expect(b.uitleg).toBe('Al 2 weken niet geweest')
  })
})

describe('behoudVoorLid', () => {
  it('geeft alleen actieve en proefleden een score', () => {
    const bezoeken = regelmatig(2, 1, 84)
    expect(behoudVoorLid({ status: 'actief', lidSinds: LANG_LID }, bezoeken, 0, NU)?.score).toBe(100)
    expect(behoudVoorLid({ status: 'proef', lidSinds: LANG_LID }, bezoeken, 0, NU)).not.toBeNull()
    expect(behoudVoorLid({ status: 'gepauzeerd', lidSinds: LANG_LID }, bezoeken, 0, NU)).toBeNull()
    expect(behoudVoorLid({ status: 'opgezegd', lidSinds: LANG_LID }, bezoeken, 0, NU)).toBeNull()
  })
})
