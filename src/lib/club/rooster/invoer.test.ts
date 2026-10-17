import { describe, expect, it } from 'vitest'
import { leesAfvinkInvoer, leesAnnuleerReden, leesGenereerInvoer, leesLesWijziging, leesLessenVraag, leesReserveerInvoer } from './invoer'

const LES = '11111111-1111-4111-8111-111111111111'
const LID = '22222222-2222-4222-8222-222222222222'

describe('leesReserveerInvoer', () => {
  it('accepteert een geldige boeking', () => {
    expect(leesReserveerInvoer({ lesId: LES, lidId: LID, bron: 'app' })).toEqual({ ok: true, waarde: { lesId: LES, lidId: LID, bron: 'app', toch: false } })
  })

  it('valt terug op balie zonder bron en weigert onzin', () => {
    expect(leesReserveerInvoer({ lesId: LES, lidId: LID })).toMatchObject({ ok: true, waarde: { bron: 'balie' } })
    expect(leesReserveerInvoer({ lesId: 'x', lidId: LID }).ok).toBe(false)
    expect(leesReserveerInvoer({ lesId: LES, lidId: LID, bron: 'hacker' }).ok).toBe(false)
    expect(leesReserveerInvoer(null).ok).toBe(false)
  })

  it('laat toch boeken alleen toe aan de balie, nooit vanuit de ledenapp', () => {
    expect(leesReserveerInvoer({ lesId: LES, lidId: LID, bron: 'balie', toch: true })).toMatchObject({ ok: true, waarde: { toch: true } })
    expect(leesReserveerInvoer({ lesId: LES, lidId: LID, bron: 'app', toch: true })).toMatchObject({ ok: true, waarde: { toch: false } })
    expect(leesReserveerInvoer({ lesId: LES, lidId: LID, toch: 'ja' })).toMatchObject({ ok: true, waarde: { toch: false } })
  })
})

describe('leesAfvinkInvoer', () => {
  it('kent alleen aanwezig, no_show en geboekt', () => {
    expect(leesAfvinkInvoer({ status: 'no_show' })).toEqual({ ok: true, waarde: 'no_show' })
    expect(leesAfvinkInvoer({ status: 'geannuleerd' }).ok).toBe(false)
  })
})

describe('leesLesWijziging', () => {
  it('leest capaciteit, instructeur en zaal', () => {
    expect(leesLesWijziging({ capaciteit: '12', zaalId: null, instructeurId: LID })).toEqual({ ok: true, waarde: { capaciteit: 12, zaalId: null, instructeurId: LID } })
  })

  it('weigert lege of ongeldige wijzigingen', () => {
    expect(leesLesWijziging({}).ok).toBe(false)
    expect(leesLesWijziging({ capaciteit: 0 }).ok).toBe(false)
    expect(leesLesWijziging({ zaalId: 'abc' }).ok).toBe(false)
  })
})

describe('leesAnnuleerReden', () => {
  it('eist een korte reden', () => {
    expect(leesAnnuleerReden({ reden: '  Instructeur ziek ' })).toEqual({ ok: true, waarde: 'Instructeur ziek' })
    expect(leesAnnuleerReden({ reden: '' }).ok).toBe(false)
    expect(leesAnnuleerReden({ reden: 'x'.repeat(201) }).ok).toBe(false)
  })
})

describe('leesGenereerInvoer', () => {
  it('neemt standaard 6 weken', () => {
    expect(leesGenereerInvoer({ vestiging: 'budel' })).toEqual({ ok: true, waarde: { vestiging: 'budel', weken: 6 } })
    expect(leesGenereerInvoer({ vestiging: 'Parijs!' }).ok).toBe(false)
    expect(leesGenereerInvoer({ vestiging: 'budel', weken: 13 }).ok).toBe(false)
  })
})

describe('leesLessenVraag', () => {
  it('leest vestiging en bereik', () => {
    const uit = leesLessenVraag(new URLSearchParams('v=budel&van=2026-10-12T00:00:00Z&tot=2026-10-19T00:00:00Z'))
    expect(uit.ok).toBe(true)
  })

  it('weigert een te groot of omgekeerd bereik', () => {
    expect(leesLessenVraag(new URLSearchParams('v=budel&van=2026-10-19&tot=2026-10-12')).ok).toBe(false)
    expect(leesLessenVraag(new URLSearchParams('v=budel&van=2026-01-01&tot=2026-06-01')).ok).toBe(false)
    expect(leesLessenVraag(new URLSearchParams('van=2026-10-12&tot=2026-10-19')).ok).toBe(false)
  })
})
