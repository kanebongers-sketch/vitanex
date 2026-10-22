import { describe, expect, it } from 'vitest'
import {
  herkenTitel,
  leesAangevinkt,
  leesAgendaItem,
  leesUitvoering,
  leesVoorvertoning,
  maakNaamIndex,
  maakPlan,
  splitsHelften,
  uitvoerVolgorde,
  vatSamen,
  verplaatsVenster,
  type AgendaItem,
} from './verplaatsen'

const NAMEN = ['Amey', 'Iris', 'Jamey']

function item(id: string, titel: string | null, startOp = '2026-10-26T11:30:00.000Z', extra: Partial<AgendaItem> = {}): AgendaItem {
  return { id, titel, startOp, heleDag: false, reeks: false, reeksId: null, vanMij: true, gewoon: true, ...extra }
}

function herken(titel: string, namen = NAMEN) {
  return herkenTitel(titel, namen, maakNaamIndex(namen))
}

describe('verplaatsVenster', () => {
  it('loopt van 18 maanden terug tot 12 maanden vooruit', () => {
    const { van, tot } = verplaatsVenster(new Date('2026-10-22T12:00:00Z'))
    expect(van.toISOString().slice(0, 7)).toBe('2025-04')
    expect(tot.toISOString().slice(0, 7)).toBe('2027-10')
  })
})

describe('herkenTitel', () => {
  it('herkent de vaste titel', () => {
    expect(herken('Coachgesprek PT - Kane (Amey)')).toEqual({ soort: 'vast', naam: 'Amey' })
  })

  it('verwart Jamey niet met Amey', () => {
    expect(herken('Coachgesprek PT - Kane (Jamey)')).toEqual({ soort: 'vast', naam: 'Jamey' })
  })

  it('herkent de vaste vorm ook voor een oud teamlid', () => {
    expect(herken('Coachgesprek PT - Kane (Sanne)')).toEqual({ soort: 'vast', naam: 'Sanne' })
  })

  it('twijfelt bij het signaal zonder bekende naam', () => {
    expect(herken('Coachgesprek PT voorbereiden')?.soort).toBe('twijfel')
  })

  it('herkent alleen een naam, met ! of Team erachter', () => {
    expect(herken('Amey')).toEqual({ soort: 'naam', naam: 'Amey' })
    expect(herken('Amey!')).toEqual({ soort: 'naam', naam: 'Amey' })
    expect(herken('amey team')).toEqual({ soort: 'naam', naam: 'Amey' })
    expect(herken('Amey! Team!')).toEqual({ soort: 'naam', naam: 'Amey' })
  })

  it('is accentongevoelig', () => {
    expect(herken('Írís')).toEqual({ soort: 'naam', naam: 'Iris' })
  })

  it('herkent een voornaam bij een volledige naam', () => {
    expect(herken('Iris', ['Iris de Vries'])).toEqual({ soort: 'naam', naam: 'Iris de Vries' })
  })

  it('twijfelt als een voornaam bij twee PT\'ers hoort', () => {
    expect(herken('Iris', ['Iris de Vries', 'Iris Jansen'])?.soort).toBe('twijfel')
  })

  it('herkent "Naam en Naam" met twee PT\'ers', () => {
    expect(herken('Amey en Iris')).toEqual({ soort: 'twee', namen: ['Amey', 'Iris'] })
    expect(herken('Amey & Iris!')).toEqual({ soort: 'twee', namen: ['Amey', 'Iris'] })
  })

  it('laat andere afspraken staan', () => {
    expect(herken('Tandarts')).toBeNull()
    expect(herken('Lunch met Amey')).toBeNull()
    expect(herken('Amey en Tom')).toBeNull()
    expect(herken('Amey en Amey')).toBeNull()
  })
})

describe('splitsHelften', () => {
  it('maakt twee afspraken van 20 minuten achter elkaar', () => {
    expect(splitsHelften(['Amey', 'Iris'], '2026-10-26T11:30:00.000Z')).toEqual([
      { naam: 'Amey', titel: 'Coachgesprek PT - Kane (Amey)', startOp: '2026-10-26T11:30:00.000Z', eindOp: '2026-10-26T11:50:00.000Z' },
      { naam: 'Iris', titel: 'Coachgesprek PT - Kane (Iris)', startOp: '2026-10-26T11:50:00.000Z', eindOp: '2026-10-26T12:10:00.000Z' },
    ])
  })
})

describe('maakPlan', () => {
  it('verplaatst de vaste titel en hernoemt een losse naam', () => {
    const plan = maakPlan(
      [item('a', 'Coachgesprek PT - Kane (Amey)', '2026-10-01T10:00:00.000Z'), item('b', 'Iris!', '2026-10-02T10:00:00.000Z'), item('c', 'Tandarts')],
      [],
      NAMEN,
    )
    expect(plan.voorstellen.map((v) => [v.sleutel, v.nieuweTitel])).toEqual([
      ['verplaatsen:a', 'Coachgesprek PT - Kane (Amey)'],
      ['hernoemen:b', 'Coachgesprek PT - Kane (Iris)'],
    ])
    expect(plan.overgeslagen).toEqual([])
  })

  it('verwijdert een dubbel en houdt de vaste titel', () => {
    const plan = maakPlan([item('x', 'Amey Team'), item('y', 'Coachgesprek PT - Kane (Amey)')], [], NAMEN)
    const perId = Object.fromEntries(plan.voorstellen.map((v) => [v.eventId, v]))
    expect(perId.y.actie).toBe('verplaatsen')
    expect(perId.x.actie).toBe('dubbel')
    expect(perId.x.bewaardDoor).toBe('verplaatsen:y')
  })

  it('verwijdert wat al in Coachgesprekken PT staat (idempotent)', () => {
    const plan = maakPlan([item('x', 'Amey Team')], [item('k', 'Coachgesprek PT - Kane (Amey)')], NAMEN)
    expect(plan.voorstellen).toHaveLength(1)
    expect(plan.voorstellen[0]).toMatchObject({ actie: 'dubbel', bewaardDoor: null })
  })

  it('doet niets met een afspraak die met hetzelfde id al in Coachgesprekken PT staat', () => {
    const plan = maakPlan([item('k', 'Coachgesprek PT - Kane (Amey)')], [item('k', 'Coachgesprek PT - Kane (Amey)')], NAMEN)
    expect(plan.voorstellen).toEqual([])
  })

  it('splitst "Naam en Naam" in twee', () => {
    const plan = maakPlan([item('s', 'Amey en Iris')], [], NAMEN)
    expect(plan.voorstellen[0].actie).toBe('splitsen')
    expect(plan.voorstellen[0].nieuw.map((n) => n.titel)).toEqual(['Coachgesprek PT - Kane (Amey)', 'Coachgesprek PT - Kane (Iris)'])
  })

  it('maakt bij een tweede ronde alleen de helft die nog mist', () => {
    const plan = maakPlan([item('s', 'Amey en Iris')], [item('k', 'Coachgesprek PT - Kane (Amey)')], NAMEN)
    expect(plan.voorstellen[0].actie).toBe('splitsen')
    expect(plan.voorstellen[0].nieuw.map((n) => n.titel)).toEqual(['Coachgesprek PT - Kane (Iris)'])
  })

  it('maakt van een split een dubbel als beide helften al bestaan', () => {
    const plan = maakPlan(
      [item('s', 'Amey en Iris')],
      [item('k1', 'Coachgesprek PT - Kane (Amey)'), item('k2', 'Coachgesprek PT - Kane (Iris)', '2026-10-26T11:50:00.000Z')],
      NAMEN,
    )
    expect(plan.voorstellen[0].actie).toBe('dubbel')
  })

  it('verplaatst een reeks als geheel en slaat losse exemplaren over', () => {
    const plan = maakPlan(
      [item('r', 'Amey', '2026-01-05T10:00:00.000Z', { reeks: true }), item('r_2026', 'Amey', '2026-03-02T10:00:00.000Z', { reeksId: 'r' })],
      [],
      NAMEN,
    )
    expect(plan.voorstellen).toHaveLength(1)
    expect(plan.voorstellen[0]).toMatchObject({ sleutel: 'hernoemen:r', reeks: true })
    expect(plan.voorstellen[0].toelichting).toContain('hele reeks')
  })

  it('meldt wat niet kan in plaats van het te verbergen', () => {
    const plan = maakPlan(
      [
        item('u', 'Amey', undefined, { vanMij: false }),
        item('w', 'Amey en Iris', undefined, { reeks: true }),
        item('l', 'Iris', undefined, { reeksId: 'onbekend' }),
        item('t', 'Coachgesprek PT overleg'),
      ],
      [],
      NAMEN,
    )
    expect(plan.voorstellen).toEqual([])
    expect(plan.overgeslagen.map((o) => o.eventId).sort()).toEqual(['l', 't', 'u', 'w'])
  })

  it('raakt hele-dag-afspraken en bijzondere soorten niet aan', () => {
    const plan = maakPlan([item('d', 'Amey', undefined, { heleDag: true }), item('f', 'Amey', undefined, { gewoon: false })], [], NAMEN)
    expect(plan).toEqual({ voorstellen: [], overgeslagen: [] })
  })
})

describe('uitvoerVolgorde en vatSamen', () => {
  it('doet dubbelen als laatste en alleen wat aangevinkt is', () => {
    const plan = maakPlan([item('x', 'Amey Team'), item('y', 'Coachgesprek PT - Kane (Amey)'), item('z', 'Iris', '2026-11-01T10:00:00.000Z')], [], NAMEN)
    const volgorde = uitvoerVolgorde(plan, new Set(['dubbel:x', 'verplaatsen:y']))
    expect(volgorde.map((v) => v.sleutel)).toEqual(['verplaatsen:y', 'dubbel:x'])
  })

  it('telt per actie en houdt mislukte apart', () => {
    const basis = { oudeTitel: 't', startOp: '2026-10-26T11:30:00.000Z', reden: null }
    const s = vatSamen([
      { ...basis, sleutel: '1', actie: 'verplaatsen', gelukt: true },
      { ...basis, sleutel: '2', actie: 'hernoemen', gelukt: true },
      { ...basis, sleutel: '3', actie: 'splitsen', gelukt: true },
      { ...basis, sleutel: '4', actie: 'dubbel', gelukt: true },
      { ...basis, sleutel: '5', actie: 'dubbel', gelukt: false, reden: 'Google weigert dit.' },
    ])
    expect(s).toMatchObject({ verplaatst: 1, hernoemd: 1, gesplitst: 1, verwijderd: 1 })
    expect(s.mislukt.map((m) => m.sleutel)).toEqual(['5'])
  })
})

describe('leesAgendaItem', () => {
  it('leest een gewone afspraak', () => {
    expect(
      leesAgendaItem({ id: 'a', summary: 'Amey', start: { dateTime: '2026-10-26T12:30:00+01:00' }, organizer: { self: true }, eventType: 'default' }),
    ).toEqual(item('a', 'Amey', '2026-10-26T11:30:00.000Z'))
  })

  it('leest reeks, exemplaar en organisator', () => {
    const r = leesAgendaItem({ id: 'r', summary: 'X', start: { dateTime: '2026-10-26T12:30:00Z' }, recurrence: ['RRULE:FREQ=WEEKLY'], organizer: { self: false } })
    expect(r).toMatchObject({ reeks: true, vanMij: false })
    expect(leesAgendaItem({ id: 'e', start: { dateTime: '2026-10-26T12:30:00Z' }, recurringEventId: 'r' })?.reeksId).toBe('r')
  })

  it('slaat geannuleerde en onleesbare afspraken over', () => {
    expect(leesAgendaItem({ id: 'a', status: 'cancelled', start: { dateTime: '2026-10-26T12:30:00Z' } })).toBeNull()
    expect(leesAgendaItem({ id: 'a', start: {} })).toBeNull()
    expect(leesAgendaItem(null)).toBeNull()
  })
})

describe('over de draad', () => {
  it('leest een voorvertoning heen en terug', () => {
    const plan = maakPlan([item('s', 'Amey en Iris'), item('u', 'Amey', undefined, { vanMij: false })], [], NAMEN)
    const ruw = JSON.parse(JSON.stringify({ vanAgenda: 'Persoonlijke agenda', ...plan }))
    expect(leesVoorvertoning(ruw)).toEqual({ vanAgenda: 'Persoonlijke agenda', ...plan })
  })

  it('weigert een kapot item', () => {
    expect(leesVoorvertoning({ vanAgenda: 'x', voorstellen: [{ sleutel: 'a' }], overgeslagen: [] })).toBeNull()
    expect(leesUitvoering({ resultaten: [{ sleutel: 'a', actie: 'raar' }] })).toBeNull()
  })

  it('leest de aangevinkte sleutels', () => {
    expect(leesAangevinkt({ sleutels: ['verplaatsen:a'] })).toEqual(new Set(['verplaatsen:a']))
    expect(leesAangevinkt({ sleutels: [1] })).toBeNull()
    expect(leesAangevinkt({})).toBeNull()
  })
})
