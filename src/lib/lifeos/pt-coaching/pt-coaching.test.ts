import { describe, expect, test } from 'vitest'
import { evaluatieSamenvatting, leesEvaluatie, leesEvaluaties } from './pt-coaching'

const geldig = { scores: { algemeen: 4, energie: 3, voortgang: 5 } }

describe('leesEvaluatie', () => {
  test('accepteert drie geldige scores', () => {
    const u = leesEvaluatie(geldig)
    expect(u.ok).toBe(true)
    if (u.ok) expect(u.waarde.scores).toEqual({ algemeen: 4, energie: 3, voortgang: 5 })
  })

  test.each([0, 6, 2.5, '3', null])('weigert een score buiten 1..5 of geen heel getal: %s', (bad) => {
    expect(leesEvaluatie({ scores: { algemeen: bad, energie: 3, voortgang: 4 } }).ok).toBe(false)
  })

  test('scores zijn verplicht', () => {
    expect(leesEvaluatie({}).ok).toBe(false)
    expect(leesEvaluatie({ scores: {} }).ok).toBe(false)
  })

  test('notitie en aandachtspunt zijn optioneel en worden getrimd', () => {
    const u = leesEvaluatie({ ...geldig, notitie: '  ging goed  ', aandachtspunt: '' })
    expect(u.ok).toBe(true)
    if (u.ok) {
      expect(u.waarde.notitie).toBe('ging goed')
      expect('aandachtspunt' in u.waarde).toBe(false) // lege string → weggelaten
    }
  })

  test('weigert niet-object-invoer', () => {
    expect(leesEvaluatie(null).ok).toBe(false)
    expect(leesEvaluatie('nee').ok).toBe(false)
  })
})

describe('evaluatieSamenvatting', () => {
  test('vat de scores samen voor de tijdlijn', () => {
    expect(evaluatieSamenvatting(geldig)).toBe('Coaching afgerond — algemeen 4/5, energie 3/5, voortgang 5/5.')
  })

  test('plakt notitie en aandachtspunt erachter', () => {
    const s = evaluatieSamenvatting({ ...geldig, notitie: 'sterker', aandachtspunt: 'knie' })
    expect(s).toContain('sterker')
    expect(s).toContain('Aandachtspunt: knie')
  })
})

describe('leesEvaluaties', () => {
  test('leest een geldige lijst', () => {
    const lijst = leesEvaluaties({
      evaluaties: [
        { id: 'e1', aangemaaktOp: '2026-09-04T10:00:00.000Z', scores: { algemeen: 4, energie: 3, voortgang: 5 }, notitie: null, aandachtspunt: null },
      ],
    })
    expect(lijst).not.toBeNull()
    expect(lijst?.[0].scores.voortgang).toBe(5)
  })

  test('één kapot item maakt het geheel kapot (geen stille verdwijning)', () => {
    expect(leesEvaluaties({ evaluaties: [{ id: 'e1' }] })).toBeNull()
  })

  test('geen array is ongeldig', () => {
    expect(leesEvaluaties({ evaluaties: {} })).toBeNull()
    expect(leesEvaluaties(null)).toBeNull()
  })
})
