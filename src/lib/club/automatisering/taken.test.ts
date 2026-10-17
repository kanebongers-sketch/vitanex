import { describe, expect, it } from 'vitest'
import { onbekendeVelden, vulSjabloon } from './sjabloon'
import { NOTITIE_MAX, actieNaarWijziging, groepeerPerRegel, leesTaakActie, sjabloonWaarden, taakUitRij, telPerRegel, type Taak } from './taken'

const RIJ = {
  id: 't1',
  lid_id: 'l1',
  vestiging: 'budel',
  regel: 'niet_gezien',
  periode: '2026-10-01',
  waarde: 16,
  reden: 'Al 16 dagen niet geweest',
  status: 'open',
  rol: 'trainer',
  medewerker_id: null,
  notitie: null,
  afgehandeld_door: null,
  afgehandeld_op: null,
  aangemaakt_op: '2026-10-17T08:00:00Z',
  club_leden: { voornaam: 'Sanne', achternaam: 'de Vries', telefoon: '0612345678', email: 'sanne@voorbeeld.nl' },
}

describe('vulSjabloon', () => {
  it('vult voornaam, vestiging, dagen en bezoeken in', () => {
    const uit = vulSjabloon('Hoi {voornaam}, {dagen} dagen weg uit {vestiging}, {bezoeken}e bezoek', { voornaam: 'Sanne', vestiging: 'Budel', dagen: 16, bezoeken: 50 })
    expect(uit).toBe('Hoi Sanne, 16 dagen weg uit Budel, 50e bezoek')
  })

  it('laat lege en onbekende plekken zichtbaar staan', () => {
    expect(vulSjabloon('Hoi {voornaam} {achternaam} {dagen}', { voornaam: ' ', dagen: null })).toBe('Hoi {voornaam} {achternaam} {dagen}')
  })

  it('vult dezelfde plek meerdere keren in', () => {
    expect(vulSjabloon('{voornaam}! {voornaam}?', { voornaam: 'Tim' })).toBe('Tim! Tim?')
  })

  it('vindt onbekende plekken', () => {
    expect(onbekendeVelden('Hoi {voornaam} {naam} {naam} {}')).toEqual(['naam', ''])
  })
})

describe('taakUitRij', () => {
  it('leest een rij met het lid erbij', () => {
    const t = taakUitRij(RIJ)
    expect(t).toMatchObject({ id: 't1', regel: 'niet_gezien', waarde: 16, status: 'open', wie: { soort: 'rol', rol: 'trainer' }, lid: { voornaam: 'Sanne' } })
  })

  it('leest het lid ook als lijst en valt terug op iedereen', () => {
    const t = taakUitRij({ ...RIJ, rol: null, club_leden: [RIJ.club_leden] })
    expect(t?.lid?.achternaam).toBe('de Vries')
    expect(t?.wie).toEqual({ soort: 'iedereen' })
  })

  it('weigert onbruikbare rijen', () => {
    expect(taakUitRij({ ...RIJ, regel: 'x' })).toBeNull()
    expect(taakUitRij({ ...RIJ, id: '' })).toBeNull()
    expect(taakUitRij('x')).toBeNull()
  })
})

describe('groeperen en tellen', () => {
  const t = (id: string, regel: string, aangemaakt: string, voornaam: string): Taak =>
    taakUitRij({ ...RIJ, id, regel, aangemaakt_op: aangemaakt, club_leden: { voornaam } }) as Taak

  it('groepeert in vaste regelvolgorde, oudste eerst, dan op naam', () => {
    const groepen = groepeerPerRegel([
      t('1', 'verjaardag', '2026-10-17', 'Bas'),
      t('2', 'welkom', '2026-10-17', 'Zoe'),
      t('3', 'welkom', '2026-10-16', 'Mila'),
      t('4', 'welkom', '2026-10-17', 'Anna'),
    ])
    expect(groepen.map((g) => [g.regel, g.taken.map((x) => x.id)])).toEqual([
      ['welkom', ['3', '4', '2']],
      ['verjaardag', ['1']],
    ])
  })

  it('telt per regel en slaat onbekende over', () => {
    expect(telPerRegel(['risico', 'welkom', 'risico', 'onzin'])).toEqual([
      { regel: 'welkom', aantal: 1 },
      { regel: 'risico', aantal: 2 },
    ])
  })
})

describe('sjabloonWaarden', () => {
  it('geeft dagen alleen bij regels over dagen en bezoeken bij een mijlpaal', () => {
    expect(sjabloonWaarden({ regel: 'niet_gezien', waarde: 16, lid: null }, 'Budel')).toMatchObject({ dagen: 16, bezoeken: null, vestiging: 'Budel' })
    expect(sjabloonWaarden({ regel: 'mijlpaal', waarde: 50, lid: null }, 'Budel')).toMatchObject({ dagen: null, bezoeken: 50 })
    expect(sjabloonWaarden({ regel: 'risico', waarde: 30, lid: null }, 'Budel').dagen).toBeNull()
  })
})

describe('leesTaakActie en actieNaarWijziging', () => {
  const NU = new Date('2026-10-17T10:00:00Z')

  it('gedaan zet status, wie en wanneer', () => {
    const u = leesTaakActie({ actie: 'gedaan', notitie: ' Gebeld, komt dinsdag ' })
    expect(u.ok).toBe(true)
    if (!u.ok) return
    expect(actieNaarWijziging(u.waarde, 'Kane', NU)).toEqual({ notitie: 'Gebeld, komt dinsdag', status: 'gedaan', afgehandeld_door: 'Kane', afgehandeld_op: NU.toISOString() })
  })

  it('overslaan zonder notitie laat de notitie staan', () => {
    const u = leesTaakActie({ actie: 'overgeslagen' })
    expect(u.ok && actieNaarWijziging(u.waarde, 'Kane', NU)).toEqual({ status: 'overgeslagen', afgehandeld_door: 'Kane', afgehandeld_op: NU.toISOString() })
  })

  it('alleen een notitie, en een lege notitie wist hem', () => {
    const u = leesTaakActie({ actie: 'notitie', notitie: '  ' })
    expect(u.ok && actieNaarWijziging(u.waarde, 'Kane', NU)).toEqual({ notitie: null })
  })

  it('heropen maakt de taak weer open', () => {
    const u = leesTaakActie({ actie: 'heropen' })
    expect(u.ok && actieNaarWijziging(u.waarde, 'Kane', NU)).toEqual({ status: 'open', afgehandeld_door: null, afgehandeld_op: null })
  })

  it('weigert onbekende acties en te lange notities', () => {
    expect(leesTaakActie({ actie: 'wissen' })).toEqual({ ok: false, fout: 'Onbekende actie.' })
    expect(leesTaakActie({ actie: 'gedaan', notitie: 'a'.repeat(NOTITIE_MAX + 1) }).ok).toBe(false)
    expect(leesTaakActie({ actie: 'gedaan', notitie: 5 }).ok).toBe(false)
    expect(leesTaakActie(null).ok).toBe(false)
  })
})
