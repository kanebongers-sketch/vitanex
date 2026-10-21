import { describe, expect, it } from 'vitest'
import { dagLabel, interesseTekst, lestypenVan, perDag, plekVan, voornaam, widgetLesUitRij, widgetWeergave } from './rooster'

const SPIN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const YOGA = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function rij(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'les-1',
    lestype_id: SPIN,
    start_op: '2026-10-21T17:00:00Z',
    eind_op: '2026-10-21T17:45:00Z',
    capaciteit: 20,
    status: 'gepland',
    lestype: { naam: 'Spinning', actief: true },
    zaal: { naam: 'Zaal 2' },
    instructeur: { naam: 'Sanne van Dijk' },
    ...over,
  }
}

describe('widgetLesUitRij', () => {
  it('alleen openbare gegevens: voornaam instructeur, geen deelnemers, geen exacte bezetting', () => {
    const les = widgetLesUitRij({ ...rij(), reserveringen: [{ lid: 'Jan' }] }, 4, new Set())
    expect(les).toEqual({
      id: 'les-1', naam: 'Spinning', lestypeId: SPIN, startOp: '2026-10-21T17:00:00.000Z', eindOp: '2026-10-21T17:45:00.000Z',
      dag: '2026-10-21', tijd: '19:00', duurMin: 45, zaal: 'Zaal 2', instructeur: 'Sanne', plek: 'vrij', vrij: null,
    })
    expect(Object.keys(les ?? {})).not.toContain('reserveringen')
  })

  it('geannuleerd, inactief lestype of niet gekozen lestype valt weg', () => {
    expect(widgetLesUitRij(rij({ status: 'geannuleerd' }), 0, new Set())).toBeNull()
    expect(widgetLesUitRij(rij({ lestype: { naam: 'Spinning', actief: false } }), 0, new Set())).toBeNull()
    expect(widgetLesUitRij(rij(), 0, new Set([YOGA]))).toBeNull()
    expect(widgetLesUitRij(rij(), 0, new Set([SPIN]))).not.toBeNull()
    expect(widgetLesUitRij(null, 0, new Set())).toBeNull()
    expect(widgetLesUitRij(rij({ start_op: 'gisteren' }), 0, new Set())).toBeNull()
  })

  it('lijst-vorm van een embedded select werkt ook', () => {
    expect(widgetLesUitRij(rij({ lestype: [{ naam: 'Yoga', actief: true }], instructeur: [] }), 0, new Set())?.naam).toBe('Yoga')
  })
})

describe('plekVan', () => {
  it('vol, weinig (met aantal) of vrij (zonder aantal)', () => {
    expect(plekVan(20, 20)).toEqual({ plek: 'vol', vrij: 0 })
    expect(plekVan(20, 25)).toEqual({ plek: 'vol', vrij: 0 })
    expect(plekVan(20, 17)).toEqual({ plek: 'weinig', vrij: 3 })
    expect(plekVan(20, 2)).toEqual({ plek: 'vrij', vrij: null })
  })
})

describe('voornaam', () => {
  it('alleen het eerste woord', () => {
    expect(voornaam('  Sanne van Dijk ')).toBe('Sanne')
    expect(voornaam('')).toBeNull()
    expect(voornaam(null)).toBeNull()
  })
})

describe('perDag en dagLabel', () => {
  it('zeven dagen vanaf vandaag (Nederlandse kalender), alleen lessen die nog komen', () => {
    const nu = new Date('2026-10-21T16:00:00Z') // 18:00 in Nederland
    const a = widgetLesUitRij(rij(), 0, new Set())!
    const b = widgetLesUitRij(rij({ id: 'les-2', start_op: '2026-10-21T15:00:00Z', eind_op: '2026-10-21T16:00:00Z' }), 0, new Set())!
    const c = widgetLesUitRij(rij({ id: 'les-3', start_op: '2026-10-22T06:00:00Z', eind_op: '2026-10-22T07:00:00Z' }), 0, new Set())!
    const dagen = perDag([c, a, b], nu)
    expect(dagen).toHaveLength(7)
    expect(dagen[0]).toEqual({ dag: '2026-10-21', lessen: [a] })
    expect(dagen[1].lessen.map((l) => l.id)).toEqual(['les-3'])
    expect(dagen[6].dag).toBe('2026-10-27')
  })

  it('kort Nederlands label, gelijk op server en browser', () => {
    expect(dagLabel('2026-10-21')).toBe('wo 21 okt')
    expect(dagLabel('2026-03-01')).toBe('zo 1 mrt')
  })

  it('lestypen voor het filter, uniek en op naam', () => {
    const a = widgetLesUitRij(rij(), 0, new Set())!
    const y = widgetLesUitRij(rij({ id: 'y', lestype_id: YOGA, lestype: { naam: 'Bodypump', actief: true } }), 0, new Set())!
    expect(lestypenVan([a, y, a])).toEqual([{ id: YOGA, naam: 'Bodypump' }, { id: SPIN, naam: 'Spinning' }])
  })
})

describe('interesseTekst', () => {
  it('proefles met les en tijd, anders kennismaking', () => {
    expect(interesseTekst({ naam: 'Spinning', dag: '2026-10-21', tijd: '19:00' })).toBe('Proefles Spinning, wo 21 okt 19:00 (via de website)')
    expect(interesseTekst(null)).toBe('Kennismaking aangevraagd via de website')
    expect(interesseTekst({ naam: 'x'.repeat(300), dag: '2026-10-21', tijd: '19:00' }).length).toBeLessThanOrEqual(200)
  })
})

describe('widgetWeergave', () => {
  const basis = { actief: true, aan: true, voorbeeld: false, isPlatformEigenaar: false, isBeheerder: false }

  it('openbaar alleen met schakelaar aan en widget aan', () => {
    expect(widgetWeergave(basis)).toBe('openbaar')
    expect(widgetWeergave({ ...basis, aan: false })).toBeNull()
    expect(widgetWeergave({ ...basis, actief: false })).toBeNull()
  })

  it('schakelaar uit: alleen een voorvertoning voor Kane', () => {
    expect(widgetWeergave({ ...basis, actief: false, aan: false, voorbeeld: true, isPlatformEigenaar: true })).toBe('voorbeeld')
    expect(widgetWeergave({ ...basis, actief: false, voorbeeld: true, isBeheerder: true })).toBeNull()
    expect(widgetWeergave({ ...basis, actief: false, voorbeeld: true })).toBeNull()
  })

  it('schakelaar aan: voorvertoning ook voor de eigenaar, ook als de widget uit staat', () => {
    expect(widgetWeergave({ ...basis, aan: false, voorbeeld: true, isBeheerder: true })).toBe('voorbeeld')
    expect(widgetWeergave({ ...basis, aan: false, voorbeeld: true })).toBeNull()
    // ?voorbeeld=1 zonder rechten op een openbare widget: gewoon de openbare widget.
    expect(widgetWeergave({ ...basis, voorbeeld: true })).toBe('openbaar')
  })
})
