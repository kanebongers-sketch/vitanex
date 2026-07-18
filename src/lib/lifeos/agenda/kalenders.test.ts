import { describe, it, expect } from 'vitest'
import type { GoogleAfspraak, GoogleKalender } from './google'
import {
  bouwKalenderWeergave,
  kleurEvents,
  opgeslagenKalenderUitRij,
  opgeslagenKalendersUitRijen,
  zichtbareKalenderIds,
  type OpgeslagenKalender,
} from './kalenders'

// De pure delen van de multi-agenda-spiegeling: rij-narrowing (systeemgrens op
// agenda_kalenders), de zichtbare-ids-afleiding, de kleur-toewijzing aan events,
// en de merge van Google's lijst met de opgeslagen zichtbaarheid. Geen database.

describe('opgeslagenKalenderUitRij — systeemgrens: één rij', () => {
  function rij(over: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      kalender_id: 'werk@x.nl',
      naam: 'Werk',
      kleur: '#33b679',
      toegang: 'owner',
      zichtbaar: true,
      ...over,
    }
  }

  it('leest een geldige rij', () => {
    expect(opgeslagenKalenderUitRij(rij())).toEqual({
      kalenderId: 'werk@x.nl',
      naam: 'Werk',
      kleur: '#33b679',
      toegang: 'owner',
      zichtbaar: true,
    })
  })

  it('weigert een rij zonder kalender_id of naam', () => {
    expect(opgeslagenKalenderUitRij(rij({ kalender_id: undefined }))).toBeNull()
    expect(opgeslagenKalenderUitRij(rij({ naam: '   ' }))).toBeNull()
  })

  it('weigert iets dat geen object is', () => {
    expect(opgeslagenKalenderUitRij(null)).toBeNull()
    expect(opgeslagenKalenderUitRij('werk')).toBeNull()
    expect(opgeslagenKalenderUitRij([])).toBeNull()
  })

  it('leest kleur en toegang als null/leeg wanneer ze ontbreken', () => {
    const k = opgeslagenKalenderUitRij(rij({ kleur: undefined, toegang: undefined }))
    expect(k?.kleur).toBeNull()
    expect(k?.toegang).toBe('')
  })

  it('leest zichtbaar als true tenzij het strikt false is', () => {
    // Alleen een expliciete false verbergt; een ontbrekende kolom (vóór de
    // migratie) telt als zichtbaar.
    expect(opgeslagenKalenderUitRij(rij({ zichtbaar: undefined }))?.zichtbaar).toBe(true)
    expect(opgeslagenKalenderUitRij(rij({ zichtbaar: 'false' }))?.zichtbaar).toBe(true)
    expect(opgeslagenKalenderUitRij(rij({ zichtbaar: false }))?.zichtbaar).toBe(false)
  })
})

describe('opgeslagenKalendersUitRijen — kapotte rijen overslaan', () => {
  it('houdt de goede en laat de kapotte vallen', () => {
    const lijst = opgeslagenKalendersUitRijen([
      { kalender_id: 'a@x.nl', naam: 'A' },
      { kalender_id: undefined, naam: 'B' },
      'geen-object',
      { kalender_id: 'c@x.nl', naam: 'C' },
    ])
    expect(lijst.map((k) => k.kalenderId)).toEqual(['a@x.nl', 'c@x.nl'])
  })
})

describe('zichtbareKalenderIds', () => {
  function k(over: Partial<OpgeslagenKalender>): OpgeslagenKalender {
    return { kalenderId: 'x', naam: 'X', kleur: null, toegang: 'owner', zichtbaar: true, ...over }
  }

  it('geeft alleen de ids van de zichtbare agenda\'s', () => {
    const ids = zichtbareKalenderIds([
      k({ kalenderId: 'aan-1', zichtbaar: true }),
      k({ kalenderId: 'uit', zichtbaar: false }),
      k({ kalenderId: 'aan-2', zichtbaar: true }),
    ])
    expect(ids).toEqual(['aan-1', 'aan-2'])
  })

  it('geeft een lege lijst als niets zichtbaar is', () => {
    expect(zichtbareKalenderIds([k({ zichtbaar: false })])).toEqual([])
  })
})

describe('kleurEvents — kleur-toewijzing', () => {
  function event(over: Partial<GoogleAfspraak> = {}): GoogleAfspraak {
    return {
      externId: 'evt-1',
      titel: 'Standup',
      startOp: new Date('2026-07-20T09:00:00.000Z'),
      eindOp: new Date('2026-07-20T09:30:00.000Z'),
      heleDag: false,
      locatie: null,
      ...over,
    }
  }

  it('kent elk event de agenda-id en -kleur toe', () => {
    const uit = kleurEvents([event({ externId: 'a' }), event({ externId: 'b' })], 'werk@x.nl', '#33b679')
    expect(uit.map((e) => e.externId)).toEqual(['a', 'b'])
    expect(uit.every((e) => e.kalenderId === 'werk@x.nl' && e.kleur === '#33b679')).toBe(true)
  })

  it('kent een null-kleur toe zonder te klagen', () => {
    const uit = kleurEvents([event()], 'feest@x.nl', null)
    expect(uit[0]?.kalenderId).toBe('feest@x.nl')
    expect(uit[0]?.kleur).toBeNull()
  })

  it('muteert de invoer niet (immutability)', () => {
    const invoer = [event()]
    const kopie = invoer.map((e) => ({ ...e }))
    kleurEvents(invoer, 'x@x.nl', '#fff')
    expect(invoer).toEqual(kopie)
    expect(invoer[0]?.kleur).toBeUndefined()
  })
})

describe('bouwKalenderWeergave — Google-lijst + opgeslagen zichtbaarheid', () => {
  function google(over: Partial<GoogleKalender>): GoogleKalender {
    return { id: 'x', naam: 'X', kleur: null, primair: false, toegang: 'owner', ...over }
  }
  function opgeslagen(over: Partial<OpgeslagenKalender>): OpgeslagenKalender {
    return { kalenderId: 'x', naam: 'X', kleur: null, toegang: 'owner', zichtbaar: true, ...over }
  }

  it('neemt naam/kleur/toegang/primair van Google en zichtbaar uit de opgeslagen lijst', () => {
    const weergave = bouwKalenderWeergave(
      [google({ id: 'werk@x.nl', naam: 'Werk', kleur: '#33b679', primair: true, toegang: 'owner' })],
      [opgeslagen({ kalenderId: 'werk@x.nl', zichtbaar: false })],
    )
    expect(weergave).toEqual([
      {
        id: 'werk@x.nl',
        naam: 'Werk',
        kleur: '#33b679',
        toegang: 'owner',
        primair: true,
        zichtbaar: false,
      },
    ])
  })

  it('is standaard zichtbaar voor een agenda die nog niet is opgeslagen', () => {
    const weergave = bouwKalenderWeergave([google({ id: 'nieuw@x.nl' })], [])
    expect(weergave[0]?.zichtbaar).toBe(true)
  })

  it('behoudt de volgorde van de Google-lijst', () => {
    const weergave = bouwKalenderWeergave(
      [google({ id: 'a' }), google({ id: 'b' }), google({ id: 'c' })],
      [opgeslagen({ kalenderId: 'b', zichtbaar: false })],
    )
    expect(weergave.map((k) => k.id)).toEqual(['a', 'b', 'c'])
  })
})
