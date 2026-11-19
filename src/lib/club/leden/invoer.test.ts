import { describe, expect, it } from 'vitest'
import { isDatumSleutel, leesContact, leesLidWijziging, leesNotitie, leesVastpinnen, normaliseerTag } from './invoer'
import { notitieUitRij, reserveringUitRij, sorteerNotities } from './rijen'

const UUID = '3f2b8c1e-7a4d-4e2b-9c1a-0d5e6f7a8b9c'

describe('leesNotitie', () => {
  it('accepteert tekst en vastpinnen', () => {
    expect(leesNotitie({ tekst: '  Wil PT proberen ', vastgepind: true })).toEqual({ ok: true, waarde: { tekst: 'Wil PT proberen', vastgepind: true } })
  })

  it('weigert leeg, te lang en geen object', () => {
    expect(leesNotitie({ tekst: '   ' }).ok).toBe(false)
    expect(leesNotitie({ tekst: 'x'.repeat(2001) }).ok).toBe(false)
    expect(leesNotitie('tekst').ok).toBe(false)
  })

  it('leest vastpinnen alleen als boolean', () => {
    expect(leesVastpinnen({ vastgepind: false })).toEqual({ ok: true, waarde: false })
    expect(leesVastpinnen({ vastgepind: 'ja' }).ok).toBe(false)
  })
})

describe('normaliseerTag', () => {
  it('maakt nette tags', () => {
    expect(normaliseerTag(' PT interesse ')).toBe('pt-interesse')
    expect(normaliseerTag('Café_ochtend!')).toBe('cafe-ochtend')
    expect(normaliseerTag('***')).toBeNull()
    expect(normaliseerTag('x'.repeat(31))).toBeNull()
  })
})

describe('leesLidWijziging', () => {
  it('leest coach en tags', () => {
    expect(leesLidWijziging({ coachId: UUID })).toEqual({ ok: true, waarde: { coachId: UUID } })
    expect(leesLidWijziging({ coachId: null })).toEqual({ ok: true, waarde: { coachId: null } })
    expect(leesLidWijziging({ tags: ['Nieuw', 'nieuw', 'PT interesse'] })).toEqual({ ok: true, waarde: { tags: ['nieuw', 'pt-interesse'] } })
  })

  it('weigert onzin', () => {
    expect(leesLidWijziging({ coachId: 'drop table' }).ok).toBe(false)
    expect(leesLidWijziging({ tags: 'nieuw' }).ok).toBe(false)
    expect(leesLidWijziging({ tags: Array.from({ length: 13 }, (_, i) => `tag${i}`) }).ok).toBe(false)
    expect(leesLidWijziging({}).ok).toBe(false)
  })

  it('leest een status (proeflid wordt lid) en weigert een onbekende', () => {
    expect(leesLidWijziging({ status: 'actief' })).toEqual({ ok: true, waarde: { status: 'actief' } })
    expect(leesLidWijziging({ status: 'proef', coachId: null })).toEqual({ ok: true, waarde: { status: 'proef', coachId: null } })
    expect(leesLidWijziging({ status: 'vip' })).toEqual({ ok: false, fout: 'Kies een geldige status.' })
    expect(leesLidWijziging({ status: null }).ok).toBe(false)
  })
})

describe('rijen', () => {
  it('leest een reservering met les en lesnaam', () => {
    const r = reserveringUitRij({
      id: 'r1', lid_id: 'l1', status: 'geboekt', wachtpositie: null,
      club_lessen: { id: 'les1', start_op: '2026-10-14T17:00:00Z', eind_op: '2026-10-14T17:45:00Z', status: 'gepland', vestiging: 'budel', club_lestypen: { naam: 'Spinning' } },
    })
    expect(r).toMatchObject({ lesNaam: 'Spinning', status: 'geboekt', lesGeannuleerd: false })
    expect(reserveringUitRij({ id: 'r1', lid_id: 'l1', status: 'raar', club_lessen: null })).toBeNull()
  })

  it('zet vastgepinde notities bovenaan, daarna de nieuwste', () => {
    const n = (id: string, op: string, vastgepind = false) => notitieUitRij({ id, tekst: 't', vastgepind, aangemaakt_op: op })
    const lijst = [n('a', '2026-10-01T10:00:00Z'), n('b', '2026-10-05T10:00:00Z'), n('c', '2026-09-01T10:00:00Z', true)]
    expect(sorteerNotities(lijst.filter((x) => x !== null)).map((x) => x.id)).toEqual(['c', 'b', 'a'])
  })
})

describe('leesLidWijziging: lidmaatschap op de ledenkaart', () => {
  it('leest de vorm, netjes ingekort, en leeg als geen vorm', () => {
    expect(leesLidWijziging({ abonnement: '  All-in   12 maanden ' })).toEqual({ ok: true, waarde: { abonnement: 'All-in 12 maanden' } })
    expect(leesLidWijziging({ abonnement: '' })).toEqual({ ok: true, waarde: { abonnement: null } })
    expect(leesLidWijziging({ abonnement: null })).toEqual({ ok: true, waarde: { abonnement: null } })
    expect(leesLidWijziging({ abonnement: 5 }).ok).toBe(false)
    expect(leesLidWijziging({ abonnement: 'x'.repeat(81) }).ok).toBe(false)
  })

  it('leest datums en weigert onzin of een omgekeerde pauze', () => {
    expect(leesLidWijziging({ status: 'gepauzeerd', pauzeVan: '2026-11-01', pauzeTot: null }))
      .toEqual({ ok: true, waarde: { status: 'gepauzeerd', pauzeVan: '2026-11-01', pauzeTot: null } })
    expect(leesLidWijziging({ lidSinds: '2026-02-30' }).ok).toBe(false)
    expect(leesLidWijziging({ einddatum: '27-10-2026' }).ok).toBe(false)
    expect(leesLidWijziging({ pauzeVan: '2026-11-10', pauzeTot: '2026-11-01' })).toEqual({ ok: false, fout: 'De pauze kan niet eindigen voordat hij begint.' })
  })

  it('isDatumSleutel kent alleen echte dagen', () => {
    expect(isDatumSleutel('2028-02-29')).toBe(true)
    expect(isDatumSleutel('2026-02-29')).toBe(false)
    expect(isDatumSleutel('2026-13-01')).toBe(false)
    expect(isDatumSleutel(20261027)).toBe(false)
  })
})

describe('leesContact: contactgegevens op de ledenkaart', () => {
  const VANDAAG = '2026-11-14'

  it('leest alleen de velden die meekomen', () => {
    expect(leesContact({ status: 'actief' }, VANDAAG)).toEqual({ ok: true, waarde: {} })
    expect(leesContact('tekst', VANDAAG)).toEqual({ ok: true, waarde: {} })
    expect(leesContact({ telefoon: ' 06 12345678 ' }, VANDAAG)).toEqual({ ok: true, waarde: { telefoon: '06 12345678' } })
  })

  it('maakt een e-mailadres klein en zonder spaties, leeg wist het', () => {
    expect(leesContact({ email: '  Sanne@Voorbeeld.NL ' }, VANDAAG)).toEqual({ ok: true, waarde: { email: 'sanne@voorbeeld.nl' } })
    expect(leesContact({ email: '' }, VANDAAG)).toEqual({ ok: true, waarde: { email: null } })
    expect(leesContact({ email: null }, VANDAAG)).toEqual({ ok: true, waarde: { email: null } })
  })

  it('weigert een e-mailadres dat niet klopt of te lang is', () => {
    expect(leesContact({ email: 'sanne@voorbeeld' }, VANDAAG)).toEqual({ ok: false, fouten: { email: 'email' } })
    expect(leesContact({ email: 'sanne voorbeeld.nl' }, VANDAAG)).toEqual({ ok: false, fouten: { email: 'email' } })
    expect(leesContact({ email: 5 }, VANDAAG)).toEqual({ ok: false, fouten: { email: 'email' } })
    expect(leesContact({ email: `${'x'.repeat(120)}@voorbeeld.nl` }, VANDAAG)).toEqual({ ok: false, fouten: { email: 'email' } })
  })

  it('leest een telefoonnummer zoals mensen het tikken en weigert letters of te kort', () => {
    expect(leesContact({ telefoon: '+31 (0)6-1234 5678' }, VANDAAG)).toEqual({ ok: true, waarde: { telefoon: '+31 (0)6-1234 5678' } })
    expect(leesContact({ telefoon: '' }, VANDAAG)).toEqual({ ok: true, waarde: { telefoon: null } })
    expect(leesContact({ telefoon: 'bel mij' }, VANDAAG)).toEqual({ ok: false, fouten: { telefoon: 'telefoon' } })
    expect(leesContact({ telefoon: '0612' }, VANDAAG)).toEqual({ ok: false, fouten: { telefoon: 'telefoon' } })
    expect(leesContact({ telefoon: '0'.repeat(31) }, VANDAAG)).toEqual({ ok: false, fouten: { telefoon: 'telefoon' } })
  })

  it('leest een geboortedatum, niet in de toekomst en niet ouder dan 120 jaar', () => {
    expect(leesContact({ geboortedatum: '1990-05-17' }, VANDAAG)).toEqual({ ok: true, waarde: { geboortedatum: '1990-05-17' } })
    expect(leesContact({ geboortedatum: VANDAAG }, VANDAAG)).toEqual({ ok: true, waarde: { geboortedatum: VANDAAG } })
    expect(leesContact({ geboortedatum: '' }, VANDAAG)).toEqual({ ok: true, waarde: { geboortedatum: null } })
    expect(leesContact({ geboortedatum: '2026-11-15' }, VANDAAG)).toEqual({ ok: false, fouten: { geboortedatum: 'geboortedatumToekomst' } })
    expect(leesContact({ geboortedatum: '1906-11-13' }, VANDAAG)).toEqual({ ok: false, fouten: { geboortedatum: 'geboortedatumTeOud' } })
    expect(leesContact({ geboortedatum: '1906-11-14' }, VANDAAG).ok).toBe(true)
    expect(leesContact({ geboortedatum: '17-05-1990' }, VANDAAG)).toEqual({ ok: false, fouten: { geboortedatum: 'geboortedatum' } })
    expect(leesContact({ geboortedatum: '1990-02-30' }, VANDAAG)).toEqual({ ok: false, fouten: { geboortedatum: 'geboortedatum' } })
  })

  it('leest een naam netjes en weigert leeg of te lang', () => {
    expect(leesContact({ voornaam: '  Sanne ', achternaam: 'de   Vries' }, VANDAAG)).toEqual({ ok: true, waarde: { voornaam: 'Sanne', achternaam: 'de Vries' } })
    expect(leesContact({ voornaam: ' ' }, VANDAAG)).toEqual({ ok: false, fouten: { voornaam: 'voornaam' } })
    expect(leesContact({ achternaam: 'x'.repeat(81) }, VANDAAG)).toEqual({ ok: false, fouten: { achternaam: 'achternaam' } })
    expect(leesContact({ voornaam: null }, VANDAAG)).toEqual({ ok: false, fouten: { voornaam: 'voornaam' } })
  })

  it('meldt elke fout per veld in een keer', () => {
    expect(leesContact({ email: 'x', telefoon: 'y', voornaam: 'Sanne' }, VANDAAG)).toEqual({ ok: false, fouten: { email: 'email', telefoon: 'telefoon' } })
  })

  it('leesLidWijziging laat een verzoek met alleen contactgegevens door als dat is gemeld', () => {
    expect(leesLidWijziging({ email: 'sanne@voorbeeld.nl' }).ok).toBe(false)
    expect(leesLidWijziging({ email: 'sanne@voorbeeld.nl' }, true)).toEqual({ ok: true, waarde: {} })
  })
})
