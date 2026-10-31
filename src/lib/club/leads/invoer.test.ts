import { describe, expect, it } from 'vitest'
import { leesHistorie, leesLeadPatch, leesNieuweLead, leesOmzetten, leesProefles } from './invoer'
import { leesFilters, pasFiltersToe } from './filters'
import { maakLead } from './testdata'

const NU = new Date('2026-10-14T08:00:00Z')
const MW = '11111111-2222-4333-8444-555555555555'

const basis = { vestiging: 'budel', naam: ' Jan  van der Berg ', telefoon: '06 12345678', bron: 'balie', toestemming: true }

describe('leesNieuweLead', () => {
  it('accepteert een snelle balielead', () => {
    const u = leesNieuweLead(basis)
    expect(u.ok && u.waarde).toMatchObject({ naam: 'Jan van der Berg', telefoon: '06 12345678', email: null, bron: 'balie' })
  })

  it('eist toestemming om contact op te nemen (AVG)', () => {
    expect(leesNieuweLead({ ...basis, toestemming: false })).toMatchObject({ ok: false })
  })

  it('eist telefoon of e-mail en controleert ze', () => {
    expect(leesNieuweLead({ ...basis, telefoon: '' })).toMatchObject({ ok: false })
    expect(leesNieuweLead({ ...basis, email: 'geen-adres' })).toMatchObject({ ok: false })
  })

  it('weigert een onbekende vestiging of bron', () => {
    expect(leesNieuweLead({ ...basis, vestiging: 'Amsterdam!' })).toMatchObject({ ok: false })
    expect(leesNieuweLead({ ...basis, bron: 'tv' })).toMatchObject({ ok: false })
  })
})

describe('leesLeadPatch', () => {
  it('eist een reden bij verloren', () => {
    expect(leesLeadPatch({ status: 'verloren' })).toMatchObject({ ok: false })
    const u = leesLeadPatch({ status: 'verloren', verlorenReden: 'Te duur' })
    expect(u.ok && u.waarde).toEqual({ status: 'verloren', verloren_reden: 'Te duur', opvolgen_op: null })
  })

  it('laat proefles en lid niet direct toe', () => {
    expect(leesLeadPatch({ status: 'proefles' })).toMatchObject({ ok: false })
    expect(leesLeadPatch({ status: 'lid' })).toMatchObject({ ok: false })
  })

  it('wist de verloren-reden bij een andere status', () => {
    const u = leesLeadPatch({ status: 'contact' })
    expect(u.ok && u.waarde).toEqual({ status: 'contact', verloren_reden: null })
  })

  it('zet medewerker en opvolgdatum, en weigert onzin', () => {
    const u = leesLeadPatch({ medewerkerId: MW, opvolgenOp: '2026-10-15' })
    expect(u.ok && u.waarde).toEqual({ medewerker_id: MW, opvolgen_op: '2026-10-15' })
    expect(leesLeadPatch({ opvolgenOp: 'morgen' })).toMatchObject({ ok: false })
    expect(leesLeadPatch({})).toMatchObject({ ok: false })
  })
})

describe('leesHistorie en leesProefles', () => {
  it('eist tekst bij een notitie maar niet bij gebeld', () => {
    expect(leesHistorie({ soort: 'notitie', tekst: '  ' })).toMatchObject({ ok: false })
    expect(leesHistorie({ soort: 'gebeld', uitkomst: 'niet_bereikt' })).toMatchObject({ ok: true })
  })

  it('eist een uitkomst uit de vaste lijst bij bellen, optioneel bij mailen', () => {
    expect(leesHistorie({ soort: 'gebeld' })).toEqual({ ok: false, fout: 'Kies wat het gesprek opleverde.' })
    expect(leesHistorie({ soort: 'gebeld', uitkomst: 'misschien' })).toMatchObject({ ok: false })
    expect(leesHistorie({ soort: 'gemaild' })).toMatchObject({ ok: true, waarde: { uitkomst: null } })
    expect(leesHistorie({ soort: 'gemaild', uitkomst: 'afspraak_gemaakt' })).toMatchObject({ ok: true, waarde: { uitkomst: 'afspraak_gemaakt' } })
    expect(leesHistorie({ soort: 'notitie', tekst: 'x', uitkomst: 'lid_geworden' })).toMatchObject({ ok: true, waarde: { uitkomst: null } })
  })

  it('weigert een proefles in het verleden of te ver vooruit', () => {
    expect(leesProefles({ actie: 'tijdstip', tijdstip: '2026-10-13T08:00:00Z' }, NU)).toMatchObject({ ok: false })
    expect(leesProefles({ actie: 'tijdstip', tijdstip: '2027-03-01T08:00:00Z' }, NU)).toMatchObject({ ok: false })
    expect(leesProefles({ actie: 'tijdstip', tijdstip: '2026-10-15T16:00:00Z' }, NU)).toMatchObject({ ok: true })
    expect(leesProefles({ actie: 'les', lesId: 'x' }, NU)).toMatchObject({ ok: false })
  })

  it('leest omzetten met of zonder bestaand lid', () => {
    expect(leesOmzetten(null)).toEqual({ ok: true, waarde: { bestaandLidId: null, negeerDubbel: false } })
    expect(leesOmzetten({ bestaandLidId: 'nee' })).toMatchObject({ ok: false })
  })
})

describe('filters', () => {
  it('leest geldige filters en negeert onzin', () => {
    expect(leesFilters({ bron: 'balie', mw: 'geen', periode: '30', weergave: 'lijst' })).toEqual({ bron: 'balie', medewerker: 'geen', periode: '30', weergave: 'lijst' })
    expect(leesFilters({ bron: 'tv', mw: 'x', periode: '5' })).toEqual({ bron: null, medewerker: null, periode: 'alle', weergave: 'pijplijn' })
  })

  it('filtert op bron, medewerker en periode', () => {
    const leads = [
      maakLead({ bron: 'balie', medewerkerId: MW, aangemaaktOp: '2026-10-10T10:00:00Z' }),
      maakLead({ bron: 'balie', medewerkerId: null, aangemaaktOp: '2026-10-10T10:00:00Z' }),
      maakLead({ bron: 'website', medewerkerId: MW, aangemaaktOp: '2026-08-01T10:00:00Z' }),
    ]
    expect(pasFiltersToe(leads, leesFilters({ bron: 'balie' }), NU)).toHaveLength(2)
    expect(pasFiltersToe(leads, leesFilters({ mw: 'geen' }), NU)).toHaveLength(1)
    expect(pasFiltersToe(leads, leesFilters({ mw: MW, periode: '30' }), NU)).toHaveLength(1)
  })
})
